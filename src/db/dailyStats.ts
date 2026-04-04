import { prisma } from "./prisma.js";

/** Increment message count and track active users for today. */
export async function updateDailyStats(guildId: number) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Count distinct users who sent messages today in this guild
  const activeUsers = await prisma.message.groupBy({
    by: ["userId"],
    where: {
      guildId,
      createdAt: { gte: today },
    },
  });

  await prisma.dailyStat.upsert({
    where: { guildId_date: { guildId, date: today } },
    update: {
      messageCount: { increment: 1 },
      activeUsers: activeUsers.length,
    },
    create: {
      guildId,
      date: today,
      messageCount: 1,
      activeUsers: activeUsers.length,
    },
  });
}
