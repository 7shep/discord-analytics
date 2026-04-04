import type { UserInfo } from "../../api";

interface TopbarProps {
  user: UserInfo;
  onLogout: () => void;
  days: number;
  onDaysChange: (days: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const rangeOptions = [
  { label: "Last 7 Days", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

export function Topbar({
  user,
  onLogout,
  days,
  onDaysChange,
  search,
  onSearchChange,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg-primary/80 backdrop-blur-sm px-6">
      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-56 rounded-lg border border-border bg-bg-input pl-9 pr-3 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue/50"
        />
        {!search && (
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-bg-card px-1.5 py-0.5 text-[10px] text-text-muted">
            /
          </kbd>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Date range pills */}
        <div className="flex items-center rounded-lg border border-border bg-bg-card">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onDaysChange(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                days === opt.value
                  ? "rounded-lg bg-accent-blue/15 text-accent-blue"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* User avatar */}
        <button onClick={onLogout} title="Logout" className="group relative">
          <img
            className="h-8 w-8 rounded-full ring-2 ring-border group-hover:ring-accent-blue/50 transition-all"
            src={
              user.avatarUrl ??
              `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`
            }
            alt={user.username}
          />
        </button>
      </div>
    </header>
  );
}
