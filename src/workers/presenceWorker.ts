import { ActivityType, Client } from "discord.js";
import { prisma } from "../db/prisma.js";
import { cacheGet, cacheSet } from "../db/redis.js";

export interface PresenceSlot {
  id: string;
  type: "Playing" | "Watching" | "Listening" | "Competing";
  template: string;
}

export interface PresenceConfig {
  status: "online" | "idle" | "dnd" | "invisible";
  slots: PresenceSlot[];
  intervalSeconds: number;
}

const DEFAULT_CONFIG: PresenceConfig = {
  status: "online",
  intervalSeconds: 30,
  slots: [
    { id: "1", type: "Watching", template: "{servers} servers worth of drama" },
    { id: "2", type: "Listening", template: "{messages_today} messages fly by" },
    { id: "3", type: "Playing", template: "with {active_users} chatty users" },
    { id: "4", type: "Competing", template: "tracking {total_messages} messages" },
  ],
};

const ACTIVITY_TYPE_MAP = {
  Playing: ActivityType.Playing,
  Watching: ActivityType.Watching,
  Listening: ActivityType.Listening,
  Competing: ActivityType.Competing,
} as const;

let presenceConfig: PresenceConfig = { ...DEFAULT_CONFIG, slots: [...DEFAULT_CONFIG.slots] };
let currentSlot = 0;
let timeoutId: ReturnType<typeof setTimeout> | null = null;
let discordClient: Client | null = null;

export function getPresenceConfig(): PresenceConfig {
  return presenceConfig;
}

export function setPresenceConfig(newConfig: PresenceConfig) {
  presenceConfig = newConfig;
  currentSlot = 0;
  if (discordClient) {
    if (timeoutId) clearTimeout(timeoutId);
    applyPresence().then(() => scheduleNext());
  }
}

async function getLiveStats(): Promise<Record<string, string>> {
  const cached = await cacheGet<Record<string, string>>("presence:stats");
  if (cached) return cached;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const [totalMessages, guildCount, messagesToday, activeUsersToday] = await Promise.all([
    prisma.message.count(),
    prisma.guild.count(),
    prisma.message.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.message.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
  ]);

  const stats = {
    total_messages: totalMessages.toLocaleString(),
    servers: guildCount.toString(),
    messages_today: messagesToday.toLocaleString(),
    active_users: activeUsersToday.length.toString(),
  };

  await cacheSet("presence:stats", stats, 30);
  return stats;
}

function applyTemplate(template: string, stats: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => stats[key] ?? `{${key}}`);
}

async function applyPresence() {
  if (!discordClient?.user || !presenceConfig.slots.length) return;

  const slot = presenceConfig.slots[currentSlot % presenceConfig.slots.length];
  currentSlot = (currentSlot + 1) % presenceConfig.slots.length;

  try {
    const stats = await getLiveStats();
    const name = applyTemplate(slot.template, stats);
    discordClient.user.setPresence({
      status: presenceConfig.status,
      activities: [{ name, type: ACTIVITY_TYPE_MAP[slot.type] }],
    });
    console.log(`[Presence] Set: ${slot.type} ${name}`);
  } catch (err) {
    console.error("[Presence] Failed to update:", err);
  }
}

function scheduleNext() {
  timeoutId = setTimeout(async () => {
    await applyPresence();
    scheduleNext();
  }, presenceConfig.intervalSeconds * 1000);
}

export function startPresenceWorker(client: Client) {
  discordClient = client;
  console.log("[Presence] Worker started");
  applyPresence().then(() => scheduleNext());
}
