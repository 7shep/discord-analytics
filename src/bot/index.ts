import { config } from "../config";
import { createClient } from "./client";
import { handleMessageCreate } from "./events/messageCreate";
import { handleGuildMemberAdd } from "./events/guildMemberAdd";
import { startAggregationWorker } from "../workers/aggregationWorker";

const client = createClient();

client.once("clientReady", (c) => {
  console.log(`Bot ready! Logged in as ${c.user.tag}`);
  console.log(`Serving ${c.guilds.cache.size} guild(s)`);
  startAggregationWorker();
});

client.on("messageCreate", handleMessageCreate);
client.on("guildMemberAdd", handleGuildMemberAdd);

client.login(config.discord.token);
