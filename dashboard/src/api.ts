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

export async function fetchMe(): Promise<UserInfo | null> {
  const res = await fetch("/auth/me");
  if (!res.ok) return null;
  return res.json();
}

export async function fetchMyGuilds(): Promise<GuildListItem[]> {
  const res = await fetch("/guilds");
  if (!res.ok) throw new Error("Failed to fetch guilds");
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch("/auth/logout", { method: "POST" });
}

const BASE = "";

export async function fetchOverview(guildId: string): Promise<GuildOverview> {
  const res = await fetch(`${BASE}/guild/${guildId}/overview`);
  if (!res.ok) throw new Error("Guild not found");
  return res.json();
}

export async function fetchMessagesOverTime(
  guildId: string,
  days = 30
): Promise<MessagesOverTime> {
  const res = await fetch(
    `${BASE}/guild/${guildId}/messages-over-time?days=${days}`
  );
  if (!res.ok) throw new Error("Guild not found");
  return res.json();
}

export async function fetchTopUsers(
  guildId: string,
  limit = 10
): Promise<TopUsers> {
  const res = await fetch(`${BASE}/guild/${guildId}/top-users?limit=${limit}`);
  if (!res.ok) throw new Error("Guild not found");
  return res.json();
}
