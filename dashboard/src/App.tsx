import { useEffect, useState } from "react";
import {
  fetchOverview,
  fetchMessagesOverTime,
  fetchTopUsers,
} from "./api";
import type {
  GuildOverview,
  MessagesOverTime,
  TopUsers,
} from "./api";
import { StatCard } from "./components/StatCard";
import { MessagesChart } from "./components/MessagesChart";
import { Leaderboard } from "./components/Leaderboard";
import "./App.css";

function App() {
  const [guildId, setGuildId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [overview, setOverview] = useState<GuildOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<MessagesOverTime | null>(null);
  const [topUsers, setTopUsers] = useState<TopUsers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!guildId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      fetchOverview(guildId),
      fetchMessagesOverTime(guildId, 30),
      fetchTopUsers(guildId, 10),
    ])
      .then(([ov, ts, tu]) => {
        setOverview(ov);
        setTimeSeries(ts);
        setTopUsers(tu);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [guildId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setGuildId(inputValue.trim());
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Discord Analytics</h1>
        <form onSubmit={handleSubmit} className="guild-form">
          <input
            type="text"
            placeholder="Enter Guild Discord ID"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit">Load</button>
        </form>
      </header>

      {loading && <p className="status">Loading...</p>}
      {error && <p className="status error">{error}</p>}

      {overview && (
        <>
          <h2>{overview.guildName}</h2>
          <div className="stats-grid">
            <StatCard label="Total Messages" value={overview.totalMessages} />
            <StatCard label="Total Members" value={overview.totalMembers} />
            <StatCard
              label="Messages Today"
              value={overview.today.messages}
            />
            <StatCard
              label="Active Users Today"
              value={overview.today.activeUsers}
            />
            <StatCard
              label="Growth vs Yesterday"
              value={`${overview.growth.messagesVsYesterday > 0 ? "+" : ""}${overview.growth.messagesVsYesterday}%`}
              subtitle="message volume"
            />
          </div>
        </>
      )}

      {timeSeries && timeSeries.data.length > 0 && (
        <MessagesChart data={timeSeries.data} />
      )}

      {topUsers && topUsers.leaderboard.length > 0 && (
        <Leaderboard data={topUsers.leaderboard} />
      )}
    </div>
  );
}

export default App;
