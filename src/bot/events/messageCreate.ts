import { Message } from "discord.js";
import { upsertUser } from "../../db/users";
import { upsertGuild } from "../../db/guilds";
import { insertMessage } from "../../db/messages";
import { updateDailyStats } from "../../db/dailyStats";

export async function handleMessageCreate(message: Message) {
  // Ignore bots
  if (message.author.bot) return;

  // Must be in a guild (ignore DMs)
  if (!message.guild) return;

  try {
    const user = await upsertUser(message.author.id);
    const guild = await upsertGuild(message.guild.id, message.guild.name);

    await insertMessage(user.id, guild.id);
    await updateDailyStats(guild.id);
  } catch (error) {
    console.error("Failed to log message event:", error);
  }
}
