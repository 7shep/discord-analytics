import { Message } from "discord.js";
import { upsertUser } from "../../db/users.js";
import { upsertGuild } from "../../db/guilds.js";
import { insertMessage } from "../../db/messages.js";
import { updateDailyStats } from "../../db/dailyStats.js";

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

    await insertMessage(user.id, guild.id);
    await updateDailyStats(guild.id);
  } catch (error) {
    console.error("Failed to log message event:", error);
  }
}
