import { prisma } from "./prisma.js";

/** Insert a raw message event. Skips duplicates via unique discordId. */
export async function insertMessage(userId: number, guildId: number, discordId: string) {
  try {
    return await prisma.message.create({
      data: { discordId, userId, guildId },
    });
  } catch (error: unknown) {
    // Skip duplicate messages (unique constraint on discordId)
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return null;
    }
    throw error;
  }
}
