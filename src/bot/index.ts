import { config } from "../config";
import { createClient } from "./client";

const client = createClient();

client.once("ready", (c) => {
  console.log(`Bot ready! Logged in as ${c.user.tag}`);
  console.log(`Serving ${c.guilds.cache.size} guild(s)`);
});

client.login(config.discord.token);
