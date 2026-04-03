import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: Array<{ rank: number; discordId: string; messageCount: number }>;
}

export function Leaderboard({ data }: Props) {
  const chartData = data.map((u) => ({
    name: u.discordId.slice(0, 8) + "...",
    messages: u.messageCount,
    fullId: u.discordId,
  }));

  return (
    <div className="chart-container">
      <h3>Top Users</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis type="number" stroke="#888" fontSize={12} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#888"
            fontSize={12}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a2e",
              border: "1px solid #333",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [value, "Messages"]}
            labelFormatter={(_label: string, payload: Array<{ payload?: { fullId?: string } }>) =>
              payload[0]?.payload?.fullId ?? _label
            }
          />
          <Bar dataKey="messages" fill="#7c3aed" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
