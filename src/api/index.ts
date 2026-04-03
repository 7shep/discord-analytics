import express from "express";
import { config } from "../config.js";
import guildRoutes from "./routes/guild.js";

const app = express();

app.use(express.json());
app.use("/guild", guildRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export function startApi() {
  app.listen(config.api.port, () => {
    console.log(`API server listening on port ${config.api.port}`);
  });
}
