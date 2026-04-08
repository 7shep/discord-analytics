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
    <div className="rounded-xl border border-border bg-bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Top Users</h3>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search user..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-7 w-40 rounded-md border border-border bg-bg-primary pl-8 pr-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-blue/50"
          />
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2rem_1fr_100px] gap-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        <span>#</span>
        <span>User</span>
        <span className="text-right">Messages</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-0.5">
        {filtered.map((user) => (
          <div
            key={user.discordId}
            className="grid grid-cols-[2rem_1fr_100px] gap-3 items-center rounded-lg px-3 py-2.5 hover:bg-bg-card-hover transition-colors"
          >
            <span className="text-sm font-semibold text-accent-blue">
              {user.rank}
            </span>

            <div className="flex items-center gap-2.5 min-w-0">
              <img
                className="h-8 w-8 rounded-full"
                src={
                  user.avatarUrl ??
                  `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`
                }
                alt=""
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{user.username}</div>
                <div className="text-[11px] text-text-muted truncate">@{user.username.toLowerCase()}</div>
              </div>
            </div>

            <span className="text-sm font-semibold text-text-primary text-right">
              {user.messageCount.toLocaleString()}
            </span>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-text-muted">
            No users found{query ? ` matching "${query}"` : ""}.
          </p>
        )}
      </div>
    </div>
  );
}
