import express from "express";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { config } from "../config.js";
import guildRoutes from "./routes/guild.js";
import authRoutes from "./routes/auth.js";
import guildsRoutes from "./routes/guilds.js";
import presenceRoutes from "./routes/presence.js";
import { setupWebSocket } from "./ws.js";

const app = express();

// Trust the first proxy hop (required on Railway / behind reverse proxies)
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());

// CORS for cross-domain requests (Vercel frontend -> Railway backend)
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", config.api.frontendUrl);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Global rate limit: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

// Strict rate limit for auth routes: 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many auth requests, please try again later" },
});

app.use(globalLimiter);
app.use("/auth", authLimiter, authRoutes);
app.use("/guilds", guildsRoutes);
app.use("/guild", guildRoutes);
app.use("/bot/presence", presenceRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export function startApi() {
  const server = app.listen(config.api.port, () => {
    console.log(`API server listening on port ${config.api.port}`);
  });
  setupWebSocket(server);
  return server;
}
