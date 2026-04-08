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
  isAdmin?: boolean;
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

export interface VoiceOverview {
  guildId: string;
  guildName: string;
  totalVoiceSeconds: number;
  totalSessions: number;
  topChannel: { id: string; name: string; totalSeconds: number } | null;
  today: { voiceSeconds: number; sessions: number };
}

export interface TopVoiceUsers {
  guildId: string;
  guildName: string;
  leaderboard: Array<{
    rank: number;
    discordId: string;
    username: string;
    avatarUrl: string | null;
    totalSeconds: number;
  }>;
}

export type GuildEvent =
  | { type: "new_message"; guildId: string; username: string; timestamp: string }
  | { type: "voice_session_end"; guildId: string; username: string; channelName: string; duration: number; timestamp: string };

export async function fetchVoiceOverview(
  guildId: string
): Promise<VoiceOverview> {
  const res = await fetch(`${BASE}/guild/${guildId}/voice-overview`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Voice overview request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchTopVoiceUsers(
  guildId: string,
  limit = 10
): Promise<TopVoiceUsers> {
  const res = await fetch(
    `${BASE}/guild/${guildId}/top-voice-users?limit=${limit}`,
    opts
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Top voice users request failed (${res.status})`);
  }
  return res.json();
}

/** Connect to the guild WebSocket for live updates. Auto-reconnects on close. */
export function connectGuildWs(
  guildId: string,
  onEvent: (event: GuildEvent) => void
): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout>;

  function connect() {
    if (closed) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = BASE ? new URL(BASE).host : window.location.host;
    ws = new WebSocket(`${protocol}//${host}/ws`);

    ws.onopen = () => {
      ws?.send(JSON.stringify({ action: "subscribe", guildId }));
    };

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as GuildEvent;
        onEvent(event);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!closed) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };
  }

  connect();

  // Return cleanup function
  return () => {
    closed = true;
    clearTimeout(reconnectTimer);
    ws?.close();
  };
}
