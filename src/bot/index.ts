import { config } from "../config.js";
import { createClient } from "./client.js";
import { handleMessageCreate } from "./events/messageCreate.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd.js";
import { startAggregationWorker } from "../workers/aggregationWorker.js";
import { startPresenceWorker } from "../workers/presenceWorker.js";
import { startApi } from "../api/index.js";

const client = createClient();

client.once("clientReady", (c: { user: { tag: string }; guilds: { cache: { size: number } } }) => {
  console.log(`Bot ready! Logged in as ${c.user.tag}`);
  console.log(`Serving ${c.guilds.cache.size} guild(s)`);
  startAggregationWorker();
  startPresenceWorker(client);
  startApi();
});

client.on("messageCreate", handleMessageCreate);
client.on("guildMemberAdd", handleGuildMemberAdd);

client.login(config.discord.token);
