import { GuildMember } from "discord.js";
import { upsertUser } from "../../db/users.js";
import { upsertGuild } from "../../db/guilds.js";

export async function handleGuildMemberAdd(member: GuildMember) {
  // Ignore bots
  if (member.user.bot) return;

  try {
    await upsertUser(member.user.id, member.user.username, member.user.avatar);
    await upsertGuild(member.guild.id, member.guild.name);

    console.log(`New member tracked: ${member.user.tag} in ${member.guild.name}`);
  } catch (error) {
    console.error("Failed to log member join event:", error);
  }
}
