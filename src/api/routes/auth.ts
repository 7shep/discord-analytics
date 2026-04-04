import { Router } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config.js";

const router = Router();

const DISCORD_API = "https://discord.com/api/v10";
const REDIRECT_URI = config.api.publicUrl
  ? `${config.api.publicUrl}/auth/callback`
  : `http://localhost:${config.api.port}/auth/callback`;
const SCOPES = "identify guilds";

/** Redirect user to Discord OAuth2 authorization page. */
router.get("/discord", (_req, res) => {
  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

/** Handle OAuth2 callback — exchange code for tokens, create JWT session. */
router.get("/callback", async (req, res) => {
  const code = String(req.query.code ?? "");
  if (!code) {
    res.status(400).json({ error: "Missing code" });
    return;
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.discord.clientId,
        client_secret: config.discord.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      res.status(401).json({ error: "Failed to exchange code" });
      return;
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      token_type: string;
    };

    // Fetch Discord user info
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const user = (await userRes.json()) as {
      id: string;
      username: string;
      avatar: string | null;
    };

    // Create JWT with user info and access token (needed to fetch guilds later)
    const token = jwt.sign(
      {
        discordId: user.id,
        username: user.username,
        avatar: user.avatar,
        accessToken: tokenData.access_token,
      },
      config.api.jwtSecret,
      { expiresIn: "7d" }
    );

    // Set cookie and redirect to frontend
    const isProduction = !!config.api.publicUrl;
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(config.api.frontendUrl);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

/** Get current user info from JWT. */
router.get("/me", (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.api.jwtSecret) as {
      discordId: string;
      username: string;
      avatar: string | null;
    };

    res.json({
      discordId: payload.discordId,
      username: payload.username,
      avatarUrl: payload.avatar
        ? `https://cdn.discordapp.com/avatars/${payload.discordId}/${payload.avatar}.png`
        : null,
    });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

/** Log out — clear the cookie. */
router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

export default router;
