import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchOverview,
  fetchMessagesOverTime,
  fetchTopUsers,
  fetchMe,
  logout,
  connectGuildWs,
} from "./api";
import type {
  GuildOverview,
  GuildEvent,
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
import { PresencePage } from "./components/PresencePage";
import { HomePage } from "./components/HomePage";
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

  // WebSocket: live updates when viewing a guild
  const wsCleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Clean up previous connection
    wsCleanup.current?.();
    wsCleanup.current = null;

    if (!guildId) return;

    wsCleanup.current = connectGuildWs(guildId, (event: GuildEvent) => {
      if (event.type === "new_message") {
        // Increment total messages and today's messages in the overview
        setOverview((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            totalMessages: prev.totalMessages + 1,
            today: {
              ...prev.today,
              messages: prev.today.messages + 1,
            },
          };
        });
      }
    });

    return () => {
      wsCleanup.current?.();
      wsCleanup.current = null;
    };
  }, [guildId]);

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
    return <HomePage />;
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
    isAdmin: user.isAdmin ?? false,
  };

  // Settings page
  if (page === "settings") {
    return (
      <DashboardLayout {...layoutProps}>
        <SettingsPage user={user} onLogout={handleLogout} />
      </DashboardLayout>
    );
  }

  // Bot Presence page
  if (page === "presence") {
    return (
      <DashboardLayout {...layoutProps}>
        <PresencePage isAdmin={user.isAdmin ?? false} />
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
              label="Messages per User"
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
