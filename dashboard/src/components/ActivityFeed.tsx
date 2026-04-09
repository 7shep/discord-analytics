import type { GuildOverview } from "../api";

interface FeedItem {
  icon: string;
  title: string;
  description: string;
  colorClass: string;
}

interface Props {
  overview: GuildOverview | null;
  timeSeries: Array<{ date: string; messages: number; activeUsers: number }> | null;
}

function generateFeed(overview: GuildOverview | null, timeSeries: Props["timeSeries"]): FeedItem[] {
  const items: FeedItem[] = [];

  if (overview) {
    const growth = overview.growth.messagesVsYesterday;
    if (growth > 20) {
      items.push({
        icon: "trending_up",
        colorClass: "bg-[#D4FF33]/15 text-[#D4FF33]",
        title: "Spike in messages",
        description: `Activity is up ${growth}% compared to yesterday.`,
      });
    } else if (growth < -20) {
      items.push({
        icon: "trending_down",
        colorClass: "bg-[#ff7351]/15 text-[#ff7351]",
        title: "Activity drop",
        description: `Messages are down ${Math.abs(growth)}% vs yesterday.`,
      });
    }

    if (overview.today.activeUsers > 0) {
      items.push({
        icon: "person",
        colorClass: "bg-[#D4FF33]/10 text-[#D4FF33]",
        title: `${overview.today.activeUsers} active today`,
        description: `${overview.today.messages} messages sent so far today.`,
      });
    }

    const milestones = [1000000, 500000, 100000, 50000, 10000, 5000, 1000];
    for (const m of milestones) {
      if (overview.totalMessages >= m) {
        items.push({
          icon: "check_circle",
          colorClass: "bg-[#D4FF33]/15 text-[#D4FF33]",
          title: "Milestone reached",
          description: `Server crossed ${m.toLocaleString()} total messages.`,
        });
        break;
      }
    }
  }

  if (timeSeries && timeSeries.length >= 2) {
    const recent = timeSeries.slice(-7);
    const avg = recent.reduce((s, d) => s + d.messages, 0) / recent.length;
    const peak = recent.reduce((max, d) => (d.messages > max.messages ? d : max), recent[0]);
    if (peak.messages > avg * 1.3) {
      items.push({
        icon: "campaign",
        colorClass: "bg-[#D4FF33]/10 text-[#D4FF33]",
        title: "Peak activity day",
        description: `${peak.date} had ${peak.messages.toLocaleString()} messages — ${Math.round(((peak.messages - avg) / avg) * 100)}% above average.`,
      });
    }
  }

  if (items.length === 0) {
    items.push({
      icon: "person",
      colorClass: "bg-[#D4FF33]/10 text-[#D4FF33]",
      title: "All quiet",
      description: "No notable activity events to report.",
    });
  }

  return items.slice(0, 4);
}

export function ActivityFeed({ overview, timeSeries }: Props) {
  const items = generateFeed(overview, timeSeries);

  return (
    <div className="bg-[#1a1919] rounded-2xl p-6 border border-[#484847]/10 flex-1 min-h-[200px]">
      <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF33]" />
        Activity Feed
      </h4>
      <div className="space-y-4 max-h-[180px] overflow-y-auto pr-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 text-xs">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.colorClass}`}>
              <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
            </div>
            <div>
              <p className="text-white font-medium">{item.title}</p>
              <p className="text-[#adaaaa]">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
