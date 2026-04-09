import { useState } from "react";

interface Props {
  data: Array<{
    rank: number;
    discordId: string;
    username: string;
    avatarUrl: string | null;
    messageCount: number;
  }>;
  search?: string;
}

export function Leaderboard({ data, search: globalSearch = "" }: Props) {
  const [localSearch, setLocalSearch] = useState("");

  const query = localSearch || globalSearch;
  const filtered = query
    ? data.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()))
    : data;

  return (
    <div className="bg-[#1a1919] rounded-2xl overflow-hidden border border-[#484847]/10">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#484847]/10">
        <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          User Leaderboard
        </h3>
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

      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#201f1f] text-[10px] font-semibold uppercase tracking-widest text-[#adaaaa]">
        <div className="col-span-1">Rank</div>
        <div className="col-span-7 md:col-span-5">User</div>
        <div className="col-span-4 md:col-span-3 text-right">Messages</div>
        <div className="hidden md:block col-span-3 text-right">Last Active</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#484847]/10">
        {filtered.map((user) => (
          <div
            key={user.discordId}
            className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#201f1f]/50 transition-colors"
          >
            <div className="col-span-1">
              <span
                className="font-bold text-sm"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: user.rank === 1 ? "#D4FF33" : "rgba(255,255,255,0.5)",
                }}
              >
                {String(user.rank).padStart(2, "0")}
              </span>
            </div>

            <div className="col-span-7 md:col-span-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#262626] border border-[#484847]/10 overflow-hidden flex-shrink-0">
                <img
                  className="w-full h-full object-cover"
                  src={
                    user.avatarUrl ??
                    `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`
                  }
                  alt=""
                />
              </div>
              <span className="text-sm font-bold text-white truncate">{user.username}</span>
            </div>

            <div className="col-span-4 md:col-span-3 text-right">
              <span className="text-sm font-mono text-white">{user.messageCount.toLocaleString()}</span>
            </div>

            <div className="hidden md:block col-span-3 text-right text-xs text-[#adaaaa]">
              —
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-[#767575]">
            No users found{query ? ` matching "${query}"` : ""}.
          </p>
        )}
      </div>
    </div>
  );
}
