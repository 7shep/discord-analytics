import { useEffect, useState } from "react";
import { fetchPresence, savePresence } from "../api";
import type { PresenceConfig, PresenceSlot } from "../api";

const ACTIVITY_TYPES = ["Playing", "Watching", "Listening", "Competing"] as const;

const STATUS_OPTIONS: { value: PresenceConfig["status"]; label: string; color: string }[] = [
  { value: "online", label: "Online", color: "#23a55a" },
  { value: "idle", label: "Idle", color: "#f0b232" },
  { value: "dnd", label: "Do Not Disturb", color: "#f23f43" },
  { value: "invisible", label: "Invisible", color: "#80848e" },
];

const VARIABLES = [
  { key: "{servers}", desc: "tracked server count" },
  { key: "{messages_today}", desc: "messages sent today" },
  { key: "{total_messages}", desc: "all-time total messages" },
  { key: "{active_users}", desc: "unique active users today" },
];

function PreviewCard({ slot, status }: { slot: PresenceSlot | null; status: PresenceConfig["status"] }) {
  const statusOption = STATUS_OPTIONS.find((s) => s.value === status)!;
  const previewName = slot
    ? slot.template
        .replace("{servers}", "5")
        .replace("{messages_today}", "1,234")
        .replace("{total_messages}", "48,291")
        .replace("{active_users}", "87")
    : "No slots configured";

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 mb-6">
      <h2 className="text-sm font-semibold text-text-primary mb-4">Live Preview</h2>
      <div className="flex items-start gap-3">
        {/* Fake bot avatar */}
        <div className="relative flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-accent-purple/20 flex items-center justify-center text-accent-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
          </div>
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-bg-card"
            style={{ background: statusOption.color }}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Discordlytics</p>
          <p className="text-xs text-text-muted">
            <span className="text-text-secondary">{slot?.type ?? "Playing"}</span>{" "}
            {previewName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: statusOption.color }}>
            {statusOption.label}
          </p>
        </div>
      </div>
    </div>
  );
}

function SlotRow({
  slot,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  disabled = false,
}: {
  slot: PresenceSlot;
  index: number;
  total: number;
  onChange: (updated: PresenceSlot) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-border last:border-0">
      {/* Reorder buttons */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="h-5 w-5 rounded flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="h-5 w-5 rounded flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Type select */}
      <select
        value={slot.type}
        onChange={(e) => onChange({ ...slot, type: e.target.value as PresenceSlot["type"] })}
        disabled={disabled}
        className={`h-9 w-32 rounded-lg border border-border bg-bg-primary px-2 text-sm text-text-primary outline-none focus:border-accent-blue/50 flex-shrink-0 ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {ACTIVITY_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Template input */}
      <input
        type="text"
        value={slot.template}
        onChange={(e) => onChange({ ...slot, template: e.target.value })}
        maxLength={128}
        disabled={disabled}
        placeholder="e.g. {servers} servers worth of drama"
        className={`flex-1 h-9 rounded-lg border border-border bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-accent-blue/50 placeholder:text-text-muted min-w-0 ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      />

      {/* Remove */}
      {!disabled && (
        <button
          onClick={onRemove}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function PresencePage({ isAdmin = false }: { isAdmin?: boolean }) {
  const [cfg, setCfg] = useState<PresenceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    fetchPresence()
      .then(setCfg)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Cycle preview through slots
  useEffect(() => {
    if (!cfg?.slots.length) return;
    const id = setInterval(
      () => setPreviewIndex((i) => (i + 1) % cfg.slots.length),
      2000
    );
    return () => clearInterval(id);
  }, [cfg?.slots.length]);

  const handleSave = async () => {
    if (!cfg) return;
    setSaving(true);
    setError(null);
    try {
      await savePresence(cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addSlot = () => {
    if (!cfg) return;
    const newSlot: PresenceSlot = {
      id: crypto.randomUUID(),
      type: "Watching",
      template: "",
    };
    setCfg({ ...cfg, slots: [...cfg.slots, newSlot] });
    setPreviewIndex(cfg.slots.length);
  };

  const updateSlot = (index: number, updated: PresenceSlot) => {
    if (!cfg) return;
    const slots = [...cfg.slots];
    slots[index] = updated;
    setCfg({ ...cfg, slots });
  };

  const removeSlot = (index: number) => {
    if (!cfg) return;
    const slots = cfg.slots.filter((_, i) => i !== index);
    setCfg({ ...cfg, slots });
    setPreviewIndex(0);
  };

  const moveSlot = (index: number, dir: -1 | 1) => {
    if (!cfg) return;
    const slots = [...cfg.slots];
    const target = index + dir;
    if (target < 0 || target >= slots.length) return;
    [slots[index], slots[target]] = [slots[target], slots[index]];
    setCfg({ ...cfg, slots });
  };

  if (loading) return <p className="status">Loading presence config...</p>;
  if (!cfg) return <p className="status error">{error ?? "Failed to load"}</p>;

  const previewSlot = cfg.slots[previewIndex % Math.max(cfg.slots.length, 1)] ?? null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-text-primary mb-1">Bot Presence</h1>
      <p className="text-sm text-text-muted mb-8">
        Customize the bot's rotating Discord status with live analytics data.
      </p>

      <PreviewCard slot={previewSlot} status={cfg.status} />

      {!isAdmin && (
        <div className="rounded-xl border border-border bg-bg-card p-4 mb-6 flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted flex-shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-sm text-text-muted">
            Only bot admins can edit presence settings. Contact an admin to request changes.
          </p>
        </div>
      )}

      {/* Status + interval */}
      <section className="rounded-xl border border-border bg-bg-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">General</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Online status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => isAdmin && setCfg({ ...cfg, status: opt.value })}
                  disabled={!isAdmin}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    cfg.status === opt.value
                      ? "border-accent-blue/50 bg-accent-blue/10 text-text-primary"
                      : "border-border bg-bg-primary text-text-secondary hover:bg-bg-card"
                  } ${!isAdmin ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: opt.color }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Rotation interval — {cfg.intervalSeconds}s
            </label>
            <input
              type="range"
              min={10}
              max={300}
              step={5}
              value={cfg.intervalSeconds}
              onChange={(e) => setCfg({ ...cfg, intervalSeconds: Number(e.target.value) })}
              disabled={!isAdmin}
              className={`w-64 accent-accent-blue ${isAdmin ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
            />
            <p className="text-xs text-text-muted mt-1">Min 10s — Max 300s</p>
          </div>
        </div>
      </section>

      {/* Rotation slots */}
      <section className="rounded-xl border border-border bg-bg-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Rotation Slots</h2>
          <span className="text-xs text-text-muted">{cfg.slots.length} slot{cfg.slots.length !== 1 ? "s" : ""}</span>
        </div>

        {cfg.slots.length === 0 && (
          <p className="text-sm text-text-muted py-2">No slots yet — add one below.</p>
        )}

        <div>
          {cfg.slots.map((slot, i) => (
            <SlotRow
              key={slot.id}
              slot={slot}
              index={i}
              total={cfg.slots.length}
              onChange={(updated) => isAdmin && updateSlot(i, updated)}
              onRemove={() => isAdmin && removeSlot(i)}
              onMove={(dir) => isAdmin && moveSlot(i, dir)}
              disabled={!isAdmin}
            />
          ))}
        </div>

        {isAdmin && (
          <button
            onClick={addSlot}
            className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-text-muted hover:border-accent-blue/50 hover:text-text-primary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add slot
          </button>
        )}
      </section>

      {/* Variable reference */}
      <section className="rounded-xl border border-border bg-bg-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Available Variables</h2>
        <div className="flex flex-col gap-2">
          {VARIABLES.map(({ key, desc }) => (
            <div key={key} className="flex items-center gap-3">
              <code className="rounded-md bg-bg-primary border border-border px-2 py-0.5 text-xs font-mono text-accent-blue">
                {key}
              </code>
              <span className="text-xs text-text-muted">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-accent-red mb-4">{error}</p>}

      {isAdmin && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-accent-blue px-5 py-2 text-sm font-medium text-white hover:bg-accent-blue/80 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Presence"}
        </button>
      )}
    </div>
  );
}
