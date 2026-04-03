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
}

export function MessagesChart({ data }: Props) {
  return (
    <div className="chart-container">
      <h3>Messages Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#888" fontSize={12} />
          <YAxis stroke="#888" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a2e",
              border: "1px solid #333",
              borderRadius: "8px",
            }}
          />
          <Area
            type="monotone"
            dataKey="messages"
            stroke="#7c3aed"
            fill="#7c3aed"
            fillOpacity={0.3}
            name="Messages"
          />
          <Area
            type="monotone"
            dataKey="activeUsers"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.2}
            name="Active Users"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
