interface Props {
  data: Array<{ date: string; activeUsers: number }>;
}

export function DailyActiveUsers({ data }: Props) {
  const recent = data.slice(-7);
  const latest = recent[recent.length - 1]?.activeUsers ?? 0;
  const maxVal = Math.max(...recent.map((d) => d.activeUsers), 1);
  const progress = latest / maxVal;

  function formatNum(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  }

  return (
    <div className="bg-[#201f1f] rounded-2xl p-6 border border-[#484847]/5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] text-[#adaaaa] uppercase tracking-widest">Daily Active Users</p>
        <span className="material-symbols-outlined text-[#D4FF33] text-xl">person_play</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-4xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {formatNum(latest)}
        </h3>
      </div>
      <div className="w-full h-1 bg-[#0e0e0e] mt-4 rounded-full overflow-hidden">
        <div
          className="bg-[#D4FF33] h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
