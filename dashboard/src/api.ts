export interface GuildOverview {
  guildId: string;
  guildName: string;
  totalMessages: number;
  totalMembers: number;
  today: {
    messages: number;
    activeUsers: number;
  };
  growth: {
    messagesVsYesterday: number;
  };
}

export interface MessagesOverTime {
  guildId: string;
  guildName: string;
  period: { days: number; since: string };
  data: Array<{
    date: string;
    messages: number;
    activeUsers: number;
  }>;
}

export interface TopUsers {
  guildId: string;
  guildName: string;
  leaderboard: Array<{
    rank: number;
    discordId: string;
    username: string;
    avatarUrl: string | null;
    messageCount: number;
  }>;
}

export interface UserInfo {
  discordId: string;
  username: string;
  avatarUrl: string | null;
}

export interface GuildListItem {
  id: string;
  name: string;
  iconUrl: string | null;
  tracked: boolean;
}

const BASE = import.meta.env.VITE_API_URL ?? "";
const opts: RequestInit = BASE ? { credentials: "include" } : {};

export async function fetchMe(): Promise<UserInfo | null> {
  const res = await fetch(`${BASE}/auth/me`, opts);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchMyGuilds(): Promise<GuildListItem[]> {
  const res = await fetch(`${BASE}/guilds`, opts);
  if (!res.ok) throw new Error("Failed to fetch guilds");
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${BASE}/auth/logout`, { ...opts, method: "POST" });
}

export async function fetchOverview(guildId: string): Promise<GuildOverview> {
  const res = await fetch(`${BASE}/guild/${guildId}/overview`, opts);
  if (!res.ok) throw new Error("Guild not found");
  return res.json();
}

export async function fetchMessagesOverTime(
  guildId: string,
  days = 30
): Promise<MessagesOverTime> {
  const res = await fetch(
    `${BASE}/guild/${guildId}/messages-over-time?days=${days}`,
    opts
  );
  if (!res.ok) throw new Error("Guild not found");
  return res.json();
}

export async function fetchTopUsers(
  guildId: string,
  limit = 10
): Promise<TopUsers> {
  const res = await fetch(
    `${BASE}/guild/${guildId}/top-users?limit=${limit}`,
    opts
  );
  if (!res.ok) throw new Error("Guild not found");
  return res.json();
}

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

export async function fetchPresence(): Promise<PresenceConfig> {
  const res = await fetch(`${BASE}/bot/presence`, opts);
  if (!res.ok) throw new Error("Failed to fetch presence config");
  return res.json();
}

export async function savePresence(config: PresenceConfig): Promise<void> {
  const res = await fetch(`${BASE}/bot/presence`, {
    ...opts,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to save presence config");
}
