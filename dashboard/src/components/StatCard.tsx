interface StatCardProps {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon?: "messages" | "users" | "ratio" | "growth";
}

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
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-[#1a1919] p-6 rounded-2xl border border-[#484847]/10 hover:border-[#D4FF33]/30 transition-all">
      <p className="text-[10px] text-[#adaaaa] uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-black tracking-tighter text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {formatValue(value)}
        </span>
        {change !== undefined && (
          <span className={`text-xs font-bold ${isPositive ? "text-[#D4FF33]" : "text-[#ff7351]"}`}>
            {isPositive ? "+" : ""}{change}%
          </span>
        )}
      </div>
    </div>
  );
}
