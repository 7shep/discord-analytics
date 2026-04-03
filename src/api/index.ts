import express from "express";
import cookieParser from "cookie-parser";
import { config } from "../config.js";
import guildRoutes from "./routes/guild.js";
import authRoutes from "./routes/auth.js";
import guildsRoutes from "./routes/guilds.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/guilds", guildsRoutes);
app.use("/guild", guildRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export function startApi() {
  app.listen(config.api.port, () => {
    console.log(`API server listening on port ${config.api.port}`);
  });
}
