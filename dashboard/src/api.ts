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
    messageCount: number;
  }>;
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
