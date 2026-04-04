import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Props {
  data: Array<{ date: string; activeUsers: number }>;
}

export function DailyActiveUsers({ data }: Props) {
  // Use last 7 entries
  const recent = data.slice(-7);

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Daily Active Users</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recent}>
            <XAxis
              dataKey="date"
              stroke="#3d4f6f"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return d.toLocaleDateString("en", { weekday: "short" });
              }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0c1527",
                border: "1px solid #1a2740",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#7a8ba8" }}
            />
            <Bar
              dataKey="activeUsers"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Active Users"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
