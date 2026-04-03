import { prisma } from "./prisma";

/** Get total message count across all guilds. */
export async function getTotalMessages() {
  return prisma.message.count();
}

/** Get message count grouped by guild. */
export async function getMessagesPerGuild() {
  const results = await prisma.message.groupBy({
    by: ["guildId"],
    _count: { id: true },
  });

  // Enrich with guild names
  const guilds = await prisma.guild.findMany();
  const guildMap = new Map(guilds.map((g: { id: number; name: string }) => [g.id, g.name]));

  return results.map((r: { guildId: number; _count: { id: number } }) => ({
    guildId: r.guildId,
    guildName: guildMap.get(r.guildId) ?? "Unknown",
    messageCount: r._count.id,
  }));
}
