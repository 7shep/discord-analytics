import { Router } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config.js";
import { prisma } from "../../db/prisma.js";

const router = Router();

const DISCORD_API = "https://discord.com/api/v10";
const ADMINISTRATOR = 0x8;

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
}

/** Get guilds the user has admin access to that the bot is also tracking. */
router.get("/", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let accessToken: string;
  try {
    const payload = jwt.verify(token, config.api.jwtSecret) as {
      accessToken: string;
    };
    accessToken = payload.accessToken;
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    // Fetch user's guilds from Discord
    const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!guildsRes.ok) {
      res.status(502).json({ error: "Failed to fetch guilds from Discord" });
      return;
    }

    const userGuilds = (await guildsRes.json()) as DiscordGuild[];

    // Filter to guilds where user has Administrator permission
    const adminGuilds = userGuilds.filter(
      (g) => (parseInt(g.permissions) & ADMINISTRATOR) === ADMINISTRATOR
    );

    // Get guild IDs the bot is tracking
    const trackedGuilds = await prisma.guild.findMany({
      where: {
        discordId: { in: adminGuilds.map((g) => g.id) },
      },
      select: { discordId: true },
    });

    const trackedSet = new Set(trackedGuilds.map((g) => g.discordId));

    // Return admin guilds with a flag indicating if the bot is present
    const result = adminGuilds.map((g) => ({
      id: g.id,
      name: g.name,
      iconUrl: g.icon
        ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
        : null,
      tracked: trackedSet.has(g.id),
    }));

    res.json(result);
  } catch (error) {
    console.error("Failed to fetch guilds:", error);
    res.status(500).json({ error: "Failed to fetch guilds" });
  }
});

export default router;
