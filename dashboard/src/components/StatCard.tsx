interface StatCardProps {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: "messages" | "users" | "ratio" | "growth";
}

const icons: Record<string, JSX.Element> = {
  messages: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  ratio: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  growth: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
};

function formatValue(value: number | string): string {
  if (typeof value === "string") return value;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function StatCard({
  label,
  value,
  change,
  changeLabel = "vs last week",
  icon,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = change === undefined
    ? ""
    : isPositive
      ? "text-accent-green"
      : "text-accent-red";

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-secondary">
          {icon && icons[icon]}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <button className="text-text-muted hover:text-text-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Value */}
      <span className="text-3xl font-bold text-text-primary tracking-tight">
        {formatValue(value)}
      </span>

      {/* Change indicator */}
      {change !== undefined && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`flex items-center gap-0.5 font-medium ${changeColor}`}>
            {isPositive ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
            {Math.abs(change)}%
          </span>
          <span className="text-text-muted">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
