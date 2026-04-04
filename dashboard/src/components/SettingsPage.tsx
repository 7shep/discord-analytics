import { useState } from "react";
import type { UserInfo } from "../api";

interface Props {
  user: UserInfo;
  onLogout: () => void;
}

export function SettingsPage({ user, onLogout }: Props) {
  const [defaultDays, setDefaultDays] = useState(
    () => Number(localStorage.getItem("defaultDays")) || 7
  );
  const [leaderboardLimit, setLeaderboardLimit] = useState(
    () => Number(localStorage.getItem("leaderboardLimit")) || 10
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("defaultDays", String(defaultDays));
    localStorage.setItem("leaderboardLimit", String(leaderboardLimit));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-text-primary mb-1">Settings</h1>
      <p className="text-sm text-text-muted mb-8">
        Manage your account and dashboard preferences.
      </p>

      {/* Account section */}
      <section className="rounded-xl border border-border bg-bg-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Account</h2>
        <div className="flex items-center gap-4 mb-4">
          <img
            className="h-12 w-12 rounded-full ring-2 ring-border"
            src={
              user.avatarUrl ??
              `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`
            }
            alt=""
          />
          <div>
            <p className="text-sm font-medium text-text-primary">{user.username}</p>
            <p className="text-xs text-text-muted">Discord ID: {user.discordId}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg border border-accent-red/30 bg-accent-red/10 px-4 py-2 text-sm font-medium text-accent-red hover:bg-accent-red/20 transition-colors"
        >
          Sign Out
        </button>
      </section>

      {/* Preferences section */}
      <section className="rounded-xl border border-border bg-bg-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Preferences</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Default date range
            </label>
            <select
              value={defaultDays}
              onChange={(e) => setDefaultDays(Number(e.target.value))}
              className="h-9 w-48 rounded-lg border border-border bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-accent-blue/50 cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Leaderboard size
            </label>
            <select
              value={leaderboardLimit}
              onChange={(e) => setLeaderboardLimit(Number(e.target.value))}
              className="h-9 w-48 rounded-lg border border-border bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-accent-blue/50 cursor-pointer"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={25}>Top 25</option>
              <option value={50}>Top 50</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-5 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-blue/80 transition-colors"
        >
          {saved ? "Saved!" : "Save Preferences"}
        </button>
      </section>
    </div>
  );
}
