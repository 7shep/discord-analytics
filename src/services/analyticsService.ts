import { prisma } from "../db/prisma.js";
import { cacheGet, cacheSet } from "../db/redis.js";

// Cache-friendly result types (avoid self-referencing ReturnType)
type CachedResult = Record<string, unknown>;

/** Get guild overview: total messages, active users today, growth metrics. */
export async function getGuildOverview(guildDiscordId: string) {
  const cacheKey = `overview:${guildDiscordId}`;
  const cached = await cacheGet<CachedResult>(cacheKey);
  if (cached) return cached;
  const guild = await prisma.guild.findUnique({
    where: { discordId: guildDiscordId },
  });
  if (!guild) return null;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const [totalMessages, todayStats, yesterdayStats, totalMembers] =
    await Promise.all([
      prisma.message.count({ where: { guildId: guild.id } }),
      prisma.dailyStat.findUnique({
        where: { guildId_date: { guildId: guild.id, date: today } },
      }),
      prisma.dailyStat.findUnique({
        where: { guildId_date: { guildId: guild.id, date: yesterday } },
      }),
      prisma.user.count({
        where: { messages: { some: { guildId: guild.id } } },
      }),
    ]);

  const messagesToday = todayStats?.messageCount ?? 0;
  const messagesYesterday = yesterdayStats?.messageCount ?? 0;
  const messageGrowth =
    messagesYesterday > 0
      ? ((messagesToday - messagesYesterday) / messagesYesterday) * 100
      : 0;

  const result = {
    guildId: guild.discordId,
    guildName: guild.name,
    totalMessages,
    totalMembers,
    today: {
      messages: messagesToday,
      activeUsers: todayStats?.activeUsers ?? 0,
    },
    growth: {
      messagesVsYesterday: Math.round(messageGrowth * 100) / 100,
    },
  };

  await cacheSet(cacheKey, result, 60);
  return result;
}

/** Get daily message counts for a guild over a time range. */
export async function getMessagesOverTime(
  guildDiscordId: string,
  days: number = 30
) {
  const cacheKey = `messages-over-time:${guildDiscordId}:${days}`;
  const cached = await cacheGet<CachedResult>(cacheKey);
  if (cached) return cached;

  const guild = await prisma.guild.findUnique({
    where: { discordId: guildDiscordId },
  });
  if (!guild) return null;

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days);

  const stats = await prisma.dailyStat.findMany({
    where: {
      guildId: guild.id,
      date: { gte: since },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      messageCount: true,
      activeUsers: true,
    },
  });

  const result = {
    guildId: guild.discordId,
    guildName: guild.name,
    period: { days, since: since.toISOString() },
    data: stats.map((s: { date: Date; messageCount: number; activeUsers: number }) => ({
      date: s.date.toISOString().split("T")[0],
      messages: s.messageCount,
      activeUsers: s.activeUsers,
    })),
  };

  await cacheSet(cacheKey, result, 120);
  return result;
}

/** Get top users by message count in a guild. */
export async function getTopUsers(
  guildDiscordId: string,
  limit: number = 10
) {
  const cacheKey = `top-users:${guildDiscordId}:${limit}`;
  const cached = await cacheGet<CachedResult>(cacheKey);
  if (cached) return cached;

  const guild = await prisma.guild.findUnique({
    where: { discordId: guildDiscordId },
  });
  if (!guild) return null;

  const topUsers = await prisma.message.groupBy({
    by: ["userId"],
    where: { guildId: guild.id },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  // Fetch user details
  const userIds = topUsers.map((u: { userId: number }) => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
  });

  interface UserDetail {
    discordId: string;
    username: string | null;
    avatarUrl: string | null;
  }

  const userMap = new Map<number, UserDetail>(
    users.map((u: { id: number; discordId: string; username: string | null; avatar: string | null }) => [u.id, {
      discordId: u.discordId,
      username: u.username,
      avatarUrl: u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png`
        : null,
    }])
  );

  const result = {
    guildId: guild.discordId,
    guildName: guild.name,
    leaderboard: topUsers.map((u: { userId: number; _count: { id: number } }, i: number) => {
      const user = userMap.get(u.userId);
      return {
        rank: i + 1,
        discordId: user?.discordId ?? "Unknown",
        username: user?.username ?? "Unknown",
        avatarUrl: user?.avatarUrl ?? null,
        messageCount: u._count.id,
      };
    }),
  };

  await cacheSet(cacheKey, result, 120);
  return result;
}

/** Get voice channel overview for a guild: total time, sessions, top channel, today's stats. */
export async function getVoiceOverview(guildDiscordId: string) {
  const cacheKey = `voice-overview:${guildDiscordId}`;
  const cached = await cacheGet<CachedResult>(cacheKey);
  if (cached) return cached;

  const guild = await prisma.guild.findUnique({
    where: { discordId: guildDiscordId },
  });
  if (!guild) return null;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [totals, todayTotals, topChannelRaw] = await Promise.all([
    prisma.voiceSession.aggregate({
      where: { guildId: guild.id },
      _sum: { duration: true },
      _count: { id: true },
    }),
    prisma.voiceSession.aggregate({
      where: { guildId: guild.id, joinedAt: { gte: today } },
      _sum: { duration: true },
      _count: { id: true },
    }),
    prisma.voiceSession.groupBy({
      by: ["channelId", "channelName"],
      where: { guildId: guild.id },
      _sum: { duration: true },
      orderBy: { _sum: { duration: "desc" } },
      take: 1,
    }),
  ]);

  const topChannel = topChannelRaw.length > 0
    ? {
        id: topChannelRaw[0].channelId,
        name: topChannelRaw[0].channelName,
        totalSeconds: topChannelRaw[0]._sum.duration ?? 0,
      }
    : null;

  const result = {
    guildId: guild.discordId,
    guildName: guild.name,
    totalVoiceSeconds: totals._sum.duration ?? 0,
    totalSessions: totals._count.id,
    topChannel,
    today: {
      voiceSeconds: todayTotals._sum.duration ?? 0,
      sessions: todayTotals._count.id,
    },
  };

  await cacheSet(cacheKey, result, 60);
  return result;
}

/** Get daily voice time for a guild over a time range. */
export async function getVoiceOverTime(
  guildDiscordId: string,
  days: number = 30
) {
  const cacheKey = `voice-over-time:${guildDiscordId}:${days}`;
  const cached = await cacheGet<CachedResult>(cacheKey);
  if (cached) return cached;

  const guild = await prisma.guild.findUnique({
    where: { discordId: guildDiscordId },
  });
  if (!guild) return null;

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days);

  const sessions = await prisma.voiceSession.findMany({
    where: { guildId: guild.id, joinedAt: { gte: since } },
    select: { joinedAt: true, duration: true },
    orderBy: { joinedAt: "asc" },
  });

  // Group by date
  const byDate = new Map<string, { totalSeconds: number; sessionCount: number }>();
  for (const s of sessions) {
    const date = s.joinedAt.toISOString().split("T")[0];
    const entry = byDate.get(date) ?? { totalSeconds: 0, sessionCount: 0 };
    entry.totalSeconds += s.duration;
    entry.sessionCount += 1;
    byDate.set(date, entry);
  }

  const result = {
    guildId: guild.discordId,
    guildName: guild.name,
    period: { days, since: since.toISOString() },
    data: Array.from(byDate.entries()).map(([date, stats]) => ({
      date,
      totalSeconds: stats.totalSeconds,
      sessionCount: stats.sessionCount,
    })),
  };

  await cacheSet(cacheKey, result, 120);
  return result;
}

/** Get top users by voice time in a guild. */
export async function getTopVoiceUsers(
  guildDiscordId: string,
  limit: number = 10
) {
  const cacheKey = `top-voice-users:${guildDiscordId}:${limit}`;
  const cached = await cacheGet<CachedResult>(cacheKey);
  if (cached) return cached;

  const guild = await prisma.guild.findUnique({
    where: { discordId: guildDiscordId },
  });
  if (!guild) return null;

  const topVoice = await prisma.voiceSession.groupBy({
    by: ["userId"],
    where: { guildId: guild.id },
    _sum: { duration: true },
    orderBy: { _sum: { duration: "desc" } },
    take: limit,
  });

  const userIds = topVoice.map((u: { userId: number }) => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
  });

  interface VoiceUserDetail {
    discordId: string;
    username: string | null;
    avatarUrl: string | null;
  }

  const userMap = new Map<number, VoiceUserDetail>(
    users.map((u: { id: number; discordId: string; username: string | null; avatar: string | null }) => [u.id, {
      discordId: u.discordId,
      username: u.username,
      avatarUrl: u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png`
        : null,
    }])
  );

  const result = {
    guildId: guild.discordId,
    guildName: guild.name,
    leaderboard: topVoice.map((u: { userId: number; _sum: { duration: number | null } }, i: number) => {
      const user = userMap.get(u.userId);
      return {
        rank: i + 1,
        discordId: user?.discordId ?? "Unknown",
        username: user?.username ?? "Unknown",
        avatarUrl: user?.avatarUrl ?? null,
        totalSeconds: u._sum.duration ?? 0,
      };
    }),
  };

  await cacheSet(cacheKey, result, 120);
  return result;
}
