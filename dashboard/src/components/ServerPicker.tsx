import { useEffect, useState } from "react";
import { fetchMyGuilds } from "../api";
import type { GuildListItem } from "../api";

interface Props {
  onSelect: (guildId: string) => void;
  search?: string;
}

export function ServerPicker({ onSelect, search = "" }: Props) {
  const [guilds, setGuilds] = useState<GuildListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyGuilds()
      .then(setGuilds)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="status">Loading your servers...</p>;
  if (error) return <p className="status error">{error}</p>;

  const query = search.toLowerCase();
  const filtered = query
    ? guilds.filter((g) => g.name.toLowerCase().includes(query))
    : guilds;
  const tracked = filtered.filter((g) => g.tracked);
  const untracked = filtered.filter((g) => !g.tracked);

  return (
    <div className="server-picker">
      <h2>Your Servers</h2>
      {tracked.length === 0 && (
        <p className="status">
          No tracked servers found. Invite the bot to a server you admin.
        </p>
      )}
      <div className="server-grid">
        {tracked.map((guild) => (
          <button
            key={guild.id}
            className="server-card"
            onClick={() => onSelect(guild.id)}
          >
            <img
              className="server-icon"
              src={
                guild.iconUrl ??
                `https://cdn.discordapp.com/embed/avatars/${parseInt(guild.id) % 5}.png`
              }
              alt=""
            />
            <span className="server-name">{guild.name}</span>
            <span className="server-badge tracked">Tracked</span>
          </button>
        ))}
        {untracked.map((guild) => {
          const clientId = import.meta.env.VITE_BOT_CLIENT_ID;
          const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=8&guild_id=${guild.id}`;
          return (
            <a
              key={guild.id}
              className="server-card"
              href={inviteUrl}
              target="_blank"
              rel="noreferrer"
              title="Click to add the bot to this server"
            >
              <img
                className="server-icon"
                src={
                  guild.iconUrl ??
                  `https://cdn.discordapp.com/embed/avatars/${parseInt(guild.id) % 5}.png`
                }
                alt=""
              />
              <span className="server-name">{guild.name}</span>
              <span className="server-badge untracked">Add Bot</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
