import express from "express";
import cookieParser from "cookie-parser";
import { config } from "../config.js";
import guildRoutes from "./routes/guild.js";
import authRoutes from "./routes/auth.js";
import guildsRoutes from "./routes/guilds.js";
import presenceRoutes from "./routes/presence.js";

const app = express();

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
app.use("/auth", authRoutes);
app.use("/guilds", guildsRoutes);
app.use("/guild", guildRoutes);
app.use("/bot/presence", presenceRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export function startApi() {
  app.listen(config.api.port, () => {
    console.log(`API server listening on port ${config.api.port}`);
  });
}
