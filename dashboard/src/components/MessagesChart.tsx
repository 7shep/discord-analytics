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

const dayOptions = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

export function MessagesChart({ data, days, onDaysChange }: Props) {
  return (
    <div className="bg-[#1a1919] rounded-2xl p-8 border border-[#484847]/10">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Messages Chart
          </h3>
          <p className="text-[#adaaaa] text-sm">Message distribution over time</p>
        </div>
        <div className="flex gap-2">
          {dayOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onDaysChange(opt.value)}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${
                days === opt.value
                  ? "bg-[#D4FF33] text-black"
                  : "bg-[#262626] text-[#adaaaa] hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={256}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="msgGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4FF33" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#D4FF33" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#484847" strokeOpacity={0.2} vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#484847"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#484847"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1919",
              border: "1px solid #484847",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#adaaaa" }}
          />
          <Area
            type="monotone"
            dataKey="messages"
            stroke="#D4FF33"
            strokeWidth={2}
            fill="url(#msgGradient)"
            name="Messages"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
