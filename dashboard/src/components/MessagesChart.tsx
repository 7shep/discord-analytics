import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: Array<{ date: string; messages: number; activeUsers: number }>;
  days: number;
  onDaysChange: (days: number) => void;
}

const rangeLabels: Record<number, string> = {
  7: "Last 7 Days",
  30: "Last 30 Days",
  90: "Last 90 Days",
};

export function MessagesChart({ data, days, onDaysChange }: Props) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/15 text-accent-blue">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Messages Over Time</h3>
            <p className="text-xs text-text-muted">Guild Activity Volume</p>
          </div>
        </div>
        <select
          value={days}
          onChange={(e) => onDaysChange(Number(e.target.value))}
          className="rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-xs text-text-secondary outline-none hover:text-text-primary cursor-pointer"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="msgGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#151f35" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#3d4f6f"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#3d4f6f"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0c1527",
              border: "1px solid #1a2740",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#7a8ba8" }}
          />
          <Area
            type="monotone"
            dataKey="messages"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#msgGradient)"
            name="Messages"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
