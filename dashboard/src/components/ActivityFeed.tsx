import type { GuildOverview } from "../api";

interface FeedItem {
  icon: "spike" | "user" | "milestone" | "drop";
  color: string;
  title: string;
  description: string;
}

const iconSvgs: Record<string, JSX.Element> = {
  spike: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  user: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  milestone: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  drop: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  ),
};

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
        icon: "spike",
        color: "bg-accent-blue/15 text-accent-blue",
        title: "Spike in messages",
        description: `Activity is up ${growth}% compared to yesterday.`,
      });
    } else if (growth < -20) {
      items.push({
        icon: "drop",
        color: "bg-accent-red/15 text-accent-red",
        title: "Activity drop",
        description: `Messages are down ${Math.abs(growth)}% vs yesterday.`,
      });
    }

    if (overview.today.activeUsers > 0) {
      items.push({
        icon: "user",
        color: "bg-accent-purple/15 text-accent-purple",
        title: `${overview.today.activeUsers} active today`,
        description: `${overview.today.messages} messages sent so far today.`,
      });
    }

    const milestones = [1000000, 500000, 100000, 50000, 10000, 5000, 1000];
    for (const m of milestones) {
      if (overview.totalMessages >= m) {
        items.push({
          icon: "milestone",
          color: "bg-accent-green/15 text-accent-green",
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
        icon: "spike",
        color: "bg-accent-orange/15 text-accent-orange",
        title: "Peak activity day",
        description: `${peak.date} had ${peak.messages.toLocaleString()} messages — ${Math.round(((peak.messages - avg) / avg) * 100)}% above average.`,
      });
    }
  }

  if (items.length === 0) {
    items.push({
      icon: "user",
      color: "bg-accent-blue/15 text-accent-blue",
      title: "All quiet",
      description: "No notable activity events to report.",
    });
  }

  return items.slice(0, 4);
}

export function ActivityFeed({ overview, timeSeries }: Props) {
  const items = generateFeed(overview, timeSeries);

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Activity Feed</h3>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
              {iconSvgs[item.icon]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{item.title}</p>
              <p className="text-xs text-text-muted leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
