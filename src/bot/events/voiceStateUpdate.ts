import { VoiceState } from "discord.js";
import { upsertUser } from "../../db/users.js";
import { upsertGuild } from "../../db/guilds.js";
import { insertVoiceSession } from "../../db/voiceSessions.js";
import { broadcastGuildUpdate } from "../../api/ws.js";

interface ActiveSession {
  channelId: string;
  channelName: string;
  guildDiscordId: string;
  userDiscordId: string;
  username: string;
  avatar: string | null;
  guildName: string;
  joinedAt: Date;
}

// In-memory tracking of active voice sessions: "guildId:userId" → session info
const activeSessions = new Map<string, ActiveSession>();

export async function handleVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState
) {
  const member = newState.member ?? oldState.member;
  if (!member || member.user.bot) return;

  const guild = oldState.guild;
  const userId = member.user.id;
  const key = `${guild.id}:${userId}`;

  const leftChannel = oldState.channel;
  const joinedChannel = newState.channel;

  // User switched or left a channel — end previous session
  if (leftChannel && (!joinedChannel || joinedChannel.id !== leftChannel.id)) {
    const session = activeSessions.get(key);
    if (session) {
      activeSessions.delete(key);
      await endSession(session, member.user.username, member.user.avatar);
    }
  }

  // User joined or switched to a channel — start new session
  if (joinedChannel && (!leftChannel || leftChannel.id !== joinedChannel.id)) {
    activeSessions.set(key, {
      channelId: joinedChannel.id,
      channelName: joinedChannel.name,
      guildDiscordId: guild.id,
      userDiscordId: userId,
      username: member.user.username,
      avatar: member.user.avatar,
      guildName: guild.name,
      joinedAt: new Date(),
    });
  }
}

async function endSession(
  session: ActiveSession,
  username: string,
  avatar: string | null
) {
  const leftAt = new Date();
  const duration = Math.floor(
    (leftAt.getTime() - session.joinedAt.getTime()) / 1000
  );

  // Skip very short sessions (< 5 seconds) — likely accidental
  if (duration < 5) return;

  try {
    const user = await upsertUser(session.userDiscordId, username, avatar);
    const guild = await upsertGuild(session.guildDiscordId, session.guildName);

    await insertVoiceSession(
      user.id,
      guild.id,
      session.channelId,
      session.channelName,
      session.joinedAt,
      leftAt,
      duration
    );

    broadcastGuildUpdate(session.guildDiscordId, {
      type: "voice_session_end",
      guildId: session.guildDiscordId,
      username,
      channelName: session.channelName,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log voice session:", error);
  }
}

/** Get count of active voice sessions (for diagnostics). */
export function getActiveVoiceSessionCount(): number {
  return activeSessions.size;
}
