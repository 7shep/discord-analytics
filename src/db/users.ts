import { prisma } from "./prisma";

/** Upsert a user by Discord ID — creates if new, returns existing if known. */
export async function upsertUser(discordId: string) {
  return prisma.user.upsert({
    where: { discordId },
    update: {},
    create: { discordId },
  });
}
