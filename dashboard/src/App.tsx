import { useEffect, useState, useCallback } from "react";
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
import type { Page } from "./components/layout/Sidebar";
import { StatCard } from "./components/StatCard";
import { MessagesChart } from "./components/MessagesChart";
import { DailyActiveUsers } from "./components/DailyActiveUsers";
import { ActivityFeed } from "./components/ActivityFeed";
import { Leaderboard } from "./components/Leaderboard";
import { ServerPicker } from "./components/ServerPicker";
import { SettingsPage } from "./components/SettingsPage";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import "./App.css";

function computeChange(
  data: Array<{ messages: number; activeUsers: number }>,
): { messagesChange: number; usersChange: number } {
  if (data.length < 2) return { messagesChange: 0, usersChange: 0 };
  const mid = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, mid);
  const secondHalf = data.slice(mid);

  const sumFirst = firstHalf.reduce((s, d) => s + d.messages, 0);
  const sumSecond = secondHalf.reduce((s, d) => s + d.messages, 0);
  const usersFirst = firstHalf.reduce((s, d) => s + d.activeUsers, 0);
  const usersSecond = secondHalf.reduce((s, d) => s + d.activeUsers, 0);

  const messagesChange = sumFirst > 0
    ? Math.round(((sumSecond - sumFirst) / sumFirst) * 1000) / 10
    : 0;
  const usersChange = usersFirst > 0
    ? Math.round(((usersSecond - usersFirst) / usersFirst) * 1000) / 10
    : 0;

  return { messagesChange, usersChange };
}

function exportCsv(
  overview: GuildOverview,
  timeSeries: MessagesOverTime | null,
  topUsers: TopUsers | null,
) {
  const lines: string[] = [];

  lines.push("Metric,Value");
  lines.push(`Guild,${overview.guildName}`);
  lines.push(`Total Messages,${overview.totalMessages}`);
  lines.push(`Total Members,${overview.totalMembers}`);
  lines.push(`Messages Today,${overview.today.messages}`);
  lines.push(`Active Users Today,${overview.today.activeUsers}`);
  lines.push(`Growth vs Yesterday,${overview.growth.messagesVsYesterday}%`);
  lines.push("");

  if (timeSeries) {
    lines.push("Date,Messages,Active Users");
    for (const d of timeSeries.data) {
      lines.push(`${d.date},${d.messages},${d.activeUsers}`);
    }
    lines.push("");
  }

  if (topUsers) {
    lines.push("Rank,Username,Discord ID,Messages");
    for (const u of topUsers.leaderboard) {
      lines.push(`${u.rank},${u.username},${u.discordId},${u.messageCount}`);
    }
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${overview.guildName.replace(/[^a-zA-Z0-9]/g, "_")}_report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState<Page>("dashboard");
  const [guildId, setGuildId] = useState<string | null>(null);
  const [days, setDays] = useState(
    () => Number(localStorage.getItem("defaultDays")) || 7
  );
  const [search, setSearch] = useState("");
  const [overview, setOverview] = useState<GuildOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<MessagesOverTime | null>(null);
  const [topUsers, setTopUsers] = useState<TopUsers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .finally(() => setAuthLoading(false));
  }, []);

  const leaderboardLimit = Number(localStorage.getItem("leaderboardLimit")) || 10;

  useEffect(() => {
    if (!guildId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      fetchOverview(guildId),
      fetchMessagesOverTime(guildId, days),
      fetchTopUsers(guildId, leaderboardLimit),
    ])
      .then(([ov, ts, tu]) => {
        setOverview(ov);
        setTimeSeries(ts);
        setTopUsers(tu);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [guildId, days, leaderboardLimit]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setGuildId(null);
    setOverview(null);
    setTimeSeries(null);
    setTopUsers(null);
  };

  const handleBack = useCallback(() => {
    setGuildId(null);
    setOverview(null);
    setTimeSeries(null);
    setTopUsers(null);
    setError(null);
    setSearch("");
  }, []);

  const handleDaysChange = useCallback((newDays: number) => {
    setDays(newDays);
  }, []);

  const handleNavigate = useCallback((p: Page) => {
    setPage(p);
    if (p === "dashboard") {
      // Going back to dashboard clears guild selection to show server picker
      setGuildId(null);
      setOverview(null);
      setTimeSeries(null);
      setTopUsers(null);
      setError(null);
    }
    setSearch("");
  }, []);

  if (authLoading) {
    return (
      <div className="app">
        <p className="status">Loading...</p>
      </div>
    );
  }

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

  // Layout props shared across all authenticated pages
  const layoutProps = {
    user,
    onLogout: handleLogout,
    activePage: page,
    onNavigate: handleNavigate,
    days,
    onDaysChange: handleDaysChange,
    search,
    onSearchChange: setSearch,
  };

  // Settings page
  if (page === "settings") {
    return (
      <DashboardLayout {...layoutProps}>
        <SettingsPage user={user} onLogout={handleLogout} />
      </DashboardLayout>
    );
  }

  // Dashboard — no guild selected: show server picker
  if (!guildId) {
    return (
      <DashboardLayout {...layoutProps}>
        <ServerPicker onSelect={setGuildId} search={search} />
      </DashboardLayout>
    );
  }

  // Dashboard — guild selected: show analytics
  const tsData = timeSeries?.data ?? [];
  const { messagesChange, usersChange } = computeChange(tsData);
  const msgsPerUser =
    overview && overview.totalMembers > 0
      ? (overview.totalMessages / overview.totalMembers).toFixed(1)
      : "0";

  return (
    <DashboardLayout {...layoutProps}>
      {loading && (
        <p className="text-center text-text-muted py-12">Loading...</p>
      )}
      {error && (
        <p className="text-center text-accent-red py-12">{error}</p>
      )}

      {overview && (
        <>
          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <button
                  onClick={handleBack}
                  className="text-text-muted hover:text-text-secondary transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" />
                    <path d="M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold text-text-primary">
                  Dashboard Overview
                </h1>
              </div>
              <p className="text-sm text-text-muted ml-8">
                Monitor your Discord server activity and growth metrics.
              </p>
            </div>
            <button
              onClick={() => exportCsv(overview, timeSeries, topUsers)}
              className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-card-hover transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Report
            </button>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Messages"
              value={overview.totalMessages}
              change={messagesChange}
              changeLabel="vs prior period"
              icon="messages"
            />
            <StatCard
              label="Active Users"
              value={overview.totalMembers}
              change={usersChange}
              changeLabel="vs prior period"
              icon="users"
            />
            <StatCard
              label="Msgs per User"
              value={msgsPerUser}
              icon="ratio"
            />
            <StatCard
              label="Growth %"
              value={`${overview.growth.messagesVsYesterday > 0 ? "+" : ""}${overview.growth.messagesVsYesterday}%`}
              change={overview.growth.messagesVsYesterday}
              changeLabel="vs yesterday"
              icon="growth"
            />
          </div>

          {/* Charts row */}
          {tsData.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
              <div className="xl:col-span-2">
                <MessagesChart
                  data={tsData}
                  days={days}
                  onDaysChange={handleDaysChange}
                />
              </div>
              <div className="flex flex-col gap-4">
                <DailyActiveUsers data={tsData} />
                <ActivityFeed overview={overview} timeSeries={tsData} />
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {topUsers && topUsers.leaderboard.length > 0 && (
            <Leaderboard data={topUsers.leaderboard} search={search} />
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default App;
