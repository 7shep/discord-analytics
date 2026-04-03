import { prisma } from "./prisma";

/** Upsert a user by Discord ID — creates if new, updates username/avatar if changed. */
export async function upsertUser(
  discordId: string,
  username?: string,
  avatar?: string | null
) {
  return prisma.user.upsert({
    where: { discordId },
    update: { username, avatar: avatar ?? undefined },
    create: { discordId, username, avatar },
  });
}
