import { prisma } from "./prisma";

/** Upsert a guild by Discord ID — creates or updates name. */
export async function upsertGuild(discordId: string, name: string) {
  return prisma.guild.upsert({
    where: { discordId },
    update: { name },
    create: { discordId, name },
  });
}
