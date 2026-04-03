import { useEffect, useState } from "react";
import { fetchMyGuilds } from "../api";
import type { GuildListItem } from "../api";

interface Props {
  onSelect: (guildId: string) => void;
}

export function ServerPicker({ onSelect }: Props) {
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

  const tracked = guilds.filter((g) => g.tracked);
  const untracked = guilds.filter((g) => !g.tracked);

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
        {untracked.map((guild) => (
          <div key={guild.id} className="server-card disabled">
            <img
              className="server-icon"
              src={
                guild.iconUrl ??
                `https://cdn.discordapp.com/embed/avatars/${parseInt(guild.id) % 5}.png`
              }
              alt=""
            />
            <span className="server-name">{guild.name}</span>
            <span className="server-badge untracked">Bot not added</span>
          </div>
        ))}
      </div>
    </div>
  );
}
