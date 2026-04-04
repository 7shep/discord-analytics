import { Message } from "discord.js";
import { upsertUser } from "../../db/users.js";
import { upsertGuild } from "../../db/guilds.js";
import { insertMessage } from "../../db/messages.js";
import { broadcastGuildUpdate } from "../../api/ws.js";

export async function handleMessageCreate(message: Message) {
  // Ignore bots
  if (message.author.bot) return;

  // Must be in a guild (ignore DMs)
  if (!message.guild) return;

  try {
    const user = await upsertUser(
      message.author.id,
      message.author.username,
      message.author.avatar
    );
    const guild = await upsertGuild(message.guild.id, message.guild.name);

    const inserted = await insertMessage(user.id, guild.id, message.id);

    // Broadcast to dashboard clients (skip if duplicate)
    if (inserted) {
      broadcastGuildUpdate(message.guild.id, {
        type: "new_message",
        guildId: message.guild.id,
        username: message.author.username,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Failed to log message event:", error);
  }
}
