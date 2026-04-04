import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

// Map of guildDiscordId → Set of connected WebSocket clients
const guildClients = new Map<string, Set<WebSocket>>();

export type GuildEvent =
  | { type: "new_message"; guildId: string; username: string; timestamp: string }
  | { type: "voice_session_end"; guildId: string; username: string; channelName: string; duration: number; timestamp: string };

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    let subscribedGuild: string | null = null;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { action: string; guildId?: string };

        if (msg.action === "subscribe" && msg.guildId) {
          // Unsubscribe from previous guild if any
          if (subscribedGuild) {
            guildClients.get(subscribedGuild)?.delete(ws);
          }

          subscribedGuild = msg.guildId;
          if (!guildClients.has(subscribedGuild)) {
            guildClients.set(subscribedGuild, new Set());
          }
          guildClients.get(subscribedGuild)!.add(ws);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on("close", () => {
      if (subscribedGuild) {
        const clients = guildClients.get(subscribedGuild);
        clients?.delete(ws);
        if (clients?.size === 0) {
          guildClients.delete(subscribedGuild);
        }
      }
    });
  });

  console.log("[WebSocket] Server attached");
}

/** Broadcast an event to all clients subscribed to a guild. */
export function broadcastGuildUpdate(guildDiscordId: string, event: GuildEvent) {
  const clients = guildClients.get(guildDiscordId);
  if (!clients?.size) return;

  const data = JSON.stringify(event);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}
