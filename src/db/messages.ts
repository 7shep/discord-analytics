import { prisma } from "./prisma.js";

/** Insert a raw message event. */
export async function insertMessage(userId: number, guildId: number) {
  return prisma.message.create({
    data: { userId, guildId },
  });
}
