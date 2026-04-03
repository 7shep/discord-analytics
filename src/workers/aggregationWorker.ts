import { prisma } from "../db/prisma.js";

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/** Recompute DailyStats for all guilds for a given date. */
async function aggregateDay(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  // Get message counts per guild
  const messageCounts = await prisma.message.groupBy({
    by: ["guildId"],
    _count: { id: true },
    where: {
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
  });

  // Get active user counts per guild
  const activeUserCounts = await prisma.message.groupBy({
    by: ["guildId", "userId"],
    where: {
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
  });

  // Count distinct users per guild
  const activeUsersMap = new Map<number, number>();
  for (const row of activeUserCounts) {
    activeUsersMap.set(row.guildId, (activeUsersMap.get(row.guildId) ?? 0) + 1);
  }

  // Upsert stats for each guild
  for (const row of messageCounts) {
    await prisma.dailyStat.upsert({
      where: { guildId_date: { guildId: row.guildId, date: startOfDay } },
      update: {
        messageCount: row._count.id,
        activeUsers: activeUsersMap.get(row.guildId) ?? 0,
      },
      create: {
        guildId: row.guildId,
        date: startOfDay,
        messageCount: row._count.id,
        activeUsers: activeUsersMap.get(row.guildId) ?? 0,
      },
    });
  }
}

/** Run a single aggregation cycle — recomputes today's stats. */
async function runAggregation() {
  try {
    await aggregateDay(new Date());
    console.log(`[Aggregation] Stats updated at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("[Aggregation] Failed:", error);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

/** Start the aggregation worker on a recurring interval. */
export function startAggregationWorker() {
  console.log(`[Aggregation] Worker started (interval: ${INTERVAL_MS / 1000}s)`);

  // Run immediately on start, then on interval
  runAggregation();
  intervalId = setInterval(runAggregation, INTERVAL_MS);
}

/** Stop the aggregation worker. */
export function stopAggregationWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Aggregation] Worker stopped");
  }
}
