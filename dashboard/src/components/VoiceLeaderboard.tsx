import { useState } from "react";

interface Props {
  data: Array<{
    rank: number;
    discordId: string;
    username: string;
    avatarUrl: string | null;
    totalSeconds: number;
  }>;
  search: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function barColor(rank: number): string {
  if (rank === 1) return "bg-[#D4FF33]";
  if (rank === 2) return "bg-[#D4FF33]/60";
  return "bg-[#D4FF33]/40";
}

export function VoiceLeaderboard({ data, search: globalSearch }: Props) {
  const [localSearch, setLocalSearch] = useState("");

  const query = localSearch || globalSearch;
  const filtered = query
    ? data.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()))
    : data;

  const maxSeconds = Math.max(...data.map((u) => u.totalSeconds), 1);

  return (
    <div className="bg-[#1a1919] rounded-2xl p-8 border border-[#484847]/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Voice Leaderboard
        </h4>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#767575]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search user..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-7 w-40 rounded-md border border-[#484847]/30 bg-[#0e0e0e] pl-8 pr-2 text-xs text-white placeholder-[#767575] outline-none focus:border-[#D4FF33]/50"
          />
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-6">
        {filtered.map((user) => {
          const progressWidth = Math.round((user.totalSeconds / maxSeconds) * 100);
          return (
            <div key={user.discordId} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#262626] overflow-hidden border border-[#484847]/10 flex-shrink-0">
                <img
                  className="w-full h-full object-cover"
                  src={
                    user.avatarUrl ??
                    `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`
                  }
                  alt=""
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-end mb-1">
                  <p className="text-sm font-bold text-white truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {user.username}
                  </p>
                  <p
                    className={`text-[10px] font-mono font-bold flex-shrink-0 ml-2 ${
                      user.rank === 1 ? "text-[#D4FF33]" : "text-[#adaaaa]"
                    }`}
                  >
                    {formatDuration(user.totalSeconds)}
                  </p>
                </div>
                <div className="w-full h-1.5 bg-[#0e0e0e] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor(user.rank)} ${user.rank === 1 ? "chart-glow" : ""}`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-[#767575]">
            No users found{query ? ` matching "${query}"` : ""}.
          </p>
        )}
      </div>
    </div>
  );
}
