import { prisma } from "../db/prisma.js";

/** Get guild overview: total messages, active users today, growth metrics. */
export async function getGuildOverview(guildDiscordId: string) {
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

  return {
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
}

/** Get daily message counts for a guild over a time range. */
export async function getMessagesOverTime(
  guildDiscordId: string,
  days: number = 30
) {
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

  return {
    guildId: guild.discordId,
    guildName: guild.name,
    period: { days, since: since.toISOString() },
    data: stats.map((s: { date: Date; messageCount: number; activeUsers: number }) => ({
      date: s.date.toISOString().split("T")[0],
      messages: s.messageCount,
      activeUsers: s.activeUsers,
    })),
  };
}

/** Get top users by message count in a guild. */
export async function getTopUsers(
  guildDiscordId: string,
  limit: number = 10
) {
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

  return {
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
}
