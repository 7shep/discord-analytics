import { useEffect, useState } from "react";
import {
  fetchOverview,
  fetchMessagesOverTime,
  fetchTopUsers,
  fetchMe,
  logout,
} from "./api";
import type {
  GuildOverview,
  MessagesOverTime,
  TopUsers,
  UserInfo,
} from "./api";
import { StatCard } from "./components/StatCard";
import { MessagesChart } from "./components/MessagesChart";
import { Leaderboard } from "./components/Leaderboard";
import { ServerPicker } from "./components/ServerPicker";
import "./App.css";

function App() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [guildId, setGuildId] = useState<string | null>(null);
  const [overview, setOverview] = useState<GuildOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<MessagesOverTime | null>(null);
  const [topUsers, setTopUsers] = useState<TopUsers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    fetchMe()
      .then(setUser)
      .finally(() => setAuthLoading(false));
  }, []);

  // Fetch analytics when a guild is selected
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

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setGuildId(null);
    setOverview(null);
    setTimeSeries(null);
    setTopUsers(null);
  };

  const handleBack = () => {
    setGuildId(null);
    setOverview(null);
    setTimeSeries(null);
    setTopUsers(null);
    setError(null);
  };

  if (authLoading) {
    return (
      <div className="app">
        <p className="status">Loading...</p>
      </div>
    );
  }

  // Not logged in — show login page
  if (!user) {
    return (
      <div className="app">
        <div className="login-page">
          <h1>Discord Analytics</h1>
          <p className="login-subtitle">
            Sign in with Discord to view your server analytics
          </p>
          <a href="/auth/discord" className="login-button">
            <svg
              className="discord-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
            </svg>
            Sign in with Discord
          </a>
        </div>
      </div>
    );
  }

  // Logged in but no guild selected — show server picker
  if (!guildId) {
    return (
      <div className="app">
        <header>
          <h1>Discord Analytics</h1>
          <div className="user-info">
            <img
              className="user-avatar"
              src={
                user.avatarUrl ??
                `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`
              }
              alt=""
            />
            <span className="user-name">{user.username}</span>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <ServerPicker onSelect={setGuildId} />
      </div>
    );
  }

  // Guild selected — show analytics
  return (
    <div className="app">
      <header>
        <div className="header-left">
          <button className="back-button" onClick={handleBack}>
            &larr; Servers
          </button>
          <h1>Discord Analytics</h1>
        </div>
        <div className="user-info">
          <img
            className="user-avatar"
            src={
              user.avatarUrl ??
              `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`
            }
            alt=""
          />
          <span className="user-name">{user.username}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
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
