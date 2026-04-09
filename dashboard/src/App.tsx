import { useEffect, useState, useCallback, useRef, lazy, Suspense } from "react";
import {
  fetchOverview,
  fetchMessagesOverTime,
  fetchTopUsers,
  fetchVoiceOverview,
  fetchTopVoiceUsers,
  fetchMe,
  logout,
  connectGuildWs,
} from "./api";
import type {
  GuildOverview,
  GuildEvent,
  MessagesOverTime,
  TopUsers,
  VoiceOverview,
  TopVoiceUsers,
  UserInfo,
} from "./api";
import type { Page } from "./components/layout/Sidebar";
import { StatCard } from "./components/StatCard";

// Lazy-loaded pages and heavy components for code-splitting
const MessagesChart = lazy(() => import("./components/MessagesChart").then(m => ({ default: m.MessagesChart })));
const DailyActiveUsers = lazy(() => import("./components/DailyActiveUsers").then(m => ({ default: m.DailyActiveUsers })));
const ActivityFeed = lazy(() => import("./components/ActivityFeed").then(m => ({ default: m.ActivityFeed })));
const Leaderboard = lazy(() => import("./components/Leaderboard").then(m => ({ default: m.Leaderboard })));
const VoiceLeaderboard = lazy(() => import("./components/VoiceLeaderboard").then(m => ({ default: m.VoiceLeaderboard })));
const ServerPicker = lazy(() => import("./components/ServerPicker").then(m => ({ default: m.ServerPicker })));
const SettingsPage = lazy(() => import("./components/SettingsPage").then(m => ({ default: m.SettingsPage })));
const PresencePage = lazy(() => import("./components/PresencePage").then(m => ({ default: m.PresencePage })));
const HomePage = lazy(() => import("./components/HomePage").then(m => ({ default: m.HomePage })));
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

function formatVoiceTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
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
  const [voiceOverview, setVoiceOverview] = useState<VoiceOverview | null>(null);
  const [topVoiceUsers, setTopVoiceUsers] = useState<TopVoiceUsers | null>(null);
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
      fetchVoiceOverview(guildId),
      fetchTopVoiceUsers(guildId, leaderboardLimit),
    ])
      .then(([ov, ts, tu, vo, tvu]) => {
        setOverview(ov);
        setTimeSeries(ts);
        setTopUsers(tu);
        setVoiceOverview(vo);
        setTopVoiceUsers(tvu);
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
    setVoiceOverview(null);
    setTopVoiceUsers(null);
  };

  const handleBack = useCallback(() => {
    setGuildId(null);
    setOverview(null);
    setTimeSeries(null);
    setTopUsers(null);
    setVoiceOverview(null);
    setTopVoiceUsers(null);
    setError(null);
    setSearch("");
  }, []);

  const handleDaysChange = useCallback((newDays: number) => {
    setDays(newDays);
  }, []);

  const handleNavigate = useCallback((p: Page) => {
    setPage(p);
    if (p === "dashboard") {
      setGuildId(null);
      setOverview(null);
      setTimeSeries(null);
      setTopUsers(null);
      setVoiceOverview(null);
      setTopVoiceUsers(null);
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
      <Suspense fallback={<div className="app"><p className="status">Loading...</p></div>}>
        <HomePage />
      </Suspense>
    );
  }

  // Layout props shared across all authenticated pages
  const layoutProps = {
    user,
    onLogout: handleLogout,
    activePage: page,
    onNavigate: handleNavigate,
    onServerList: handleBack,
    guildId,
    days,
    onDaysChange: handleDaysChange,
    search,
    onSearchChange: setSearch,
    isAdmin: user.isAdmin ?? false,
  };

  const suspenseFallback = (
    <p className="text-center text-text-muted py-12">Loading...</p>
  );

  // Settings page
  if (page === "settings") {
    return (
      <DashboardLayout {...layoutProps}>
        <Suspense fallback={suspenseFallback}>
          <SettingsPage user={user} onLogout={handleLogout} />
        </Suspense>
      </DashboardLayout>
    );
  }

  // Bot Presence page
  if (page === "presence") {
    return (
      <DashboardLayout {...layoutProps}>
        <Suspense fallback={suspenseFallback}>
          <PresencePage isAdmin={user.isAdmin ?? false} />
        </Suspense>
      </DashboardLayout>
    );
  }

  // Dashboard — no guild selected: show server picker
  if (!guildId) {
    return (
      <DashboardLayout {...layoutProps}>
        <Suspense fallback={suspenseFallback}>
          <ServerPicker onSelect={setGuildId} search={search} />
        </Suspense>
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
      <Suspense fallback={suspenseFallback}>
      {loading && (
        <p className="text-center text-text-muted py-12">Loading...</p>
      )}
      {error && (
        <p className="text-center text-accent-red py-12">{error}</p>
      )}

      {overview && (
        <>
          {/* Page header */}
          <div className="max-w-7xl mx-auto px-6">
            <h1
              className="text-4xl font-black tracking-tighter mb-8 text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {overview.guildName}
            </h1>

            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <StatCard
                label="Total Messages"
                value={overview.totalMessages}
                change={messagesChange}
              />
              <StatCard
                label="Active Users"
                value={overview.totalMembers}
                change={usersChange}
              />
              <StatCard
                label="Messages per User"
                value={msgsPerUser}
              />
              <StatCard
                label="Growth %"
                value={`${overview.growth.messagesVsYesterday > 0 ? "+" : ""}${overview.growth.messagesVsYesterday}%`}
                change={overview.growth.messagesVsYesterday}
              />
            </div>

            {/* Charts row */}
            {tsData.length > 0 && (
              <div className="grid grid-cols-12 gap-6 mb-8">
                <div className="col-span-12 xl:col-span-8">
                  <MessagesChart
                    data={tsData}
                    days={days}
                    onDaysChange={handleDaysChange}
                  />
                </div>
                <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                  <DailyActiveUsers data={tsData} />
                  <ActivityFeed overview={overview} timeSeries={tsData} />
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {topUsers && topUsers.leaderboard.length > 0 && (
              <div className="mb-12">
                <Leaderboard data={topUsers.leaderboard} search={search} />
              </div>
            )}

            {/* Voice Activity */}
            {voiceOverview && (
              <div className="mb-12">
                <div className="mb-8">
                  <h3
                    className="text-3xl font-black text-white tracking-tighter"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Voice Activity
                  </h3>
                  <p className="text-[#adaaaa] text-sm mt-1">Real-time voice telemetry and audio engagement statistics.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#1a1919] p-6 rounded-2xl border-l-4 border-[#D4FF33] shadow-lg">
                    <p className="text-[10px] text-[#adaaaa] uppercase tracking-widest mb-1">Total Voice Time</p>
                    <h4 className="text-3xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {formatVoiceTime(voiceOverview.totalVoiceSeconds)}
                    </h4>
                  </div>
                  <div className="bg-[#1a1919] p-6 rounded-2xl border-l-4 border-[#D4FF33]/50 shadow-lg">
                    <p className="text-[10px] text-[#adaaaa] uppercase tracking-widest mb-1">Voice Sessions</p>
                    <h4 className="text-3xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {voiceOverview.totalSessions}
                    </h4>
                  </div>
                  {voiceOverview.topChannel && (
                    <div className="bg-[#1a1919] p-6 rounded-2xl border-l-4 border-[#D4FF33]/30 shadow-lg">
                      <p className="text-[10px] text-[#adaaaa] uppercase tracking-widest mb-1">Most Used Channel</p>
                      <h4 className="text-2xl font-black text-white truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        #{voiceOverview.topChannel.name}
                      </h4>
                    </div>
                  )}
                </div>

                {topVoiceUsers && topVoiceUsers.leaderboard.length > 0 && (
                  <VoiceLeaderboard data={topVoiceUsers.leaderboard} search={search} />
                )}
              </div>
            )}
          </div>

          {/* FAB */}
          <button
            onClick={() => exportCsv(overview, timeSeries, topUsers)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-[#D4FF33] text-black rounded-2xl shadow-[0_10px_30px_rgba(212,255,51,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
            title="Export Report"
          >
            <span className="material-symbols-outlined text-[28px]">download</span>
          </button>
        </>
      )}
      </Suspense>
    </DashboardLayout>
  );
}

export default App;
