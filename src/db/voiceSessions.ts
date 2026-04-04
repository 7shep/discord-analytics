import { prisma } from "./prisma.js";

/** Insert a completed voice session. */
export async function insertVoiceSession(
  userId: number,
  guildId: number,
  channelId: string,
  channelName: string,
  joinedAt: Date,
  leftAt: Date,
  duration: number
) {
  return prisma.voiceSession.create({
    data: { userId, guildId, channelId, channelName, joinedAt, leftAt, duration },
  });
}
