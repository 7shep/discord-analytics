export type Page = "dashboard" | "presence" | "settings";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  isAdmin?: boolean;
}

export function Sidebar({ activePage, onNavigate, isAdmin = false }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-52 flex-col bg-bg-secondary border-r border-border px-3 py-5">
      {/* Main Menu */}
      <div className="mb-6">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Main Menu
        </p>
        <nav className="flex flex-col gap-0.5">
          <button
            onClick={() => onNavigate("dashboard")}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activePage === "dashboard"
                ? "bg-accent-green/10 text-accent-green"
                : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </button>
        </nav>
      </div>

      {/* Settings */}
      <div>
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Settings
        </p>
        <nav className="flex flex-col gap-0.5">
          {isAdmin && (
            <button
              onClick={() => onNavigate("presence")}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activePage === "presence"
                  ? "bg-accent-green/10 text-accent-green"
                  : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                <path d="M19 8h2M3 8h2M12 3V1" />
              </svg>
              Bot Presence
            </button>
          )}
          <button
            onClick={() => onNavigate("settings")}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activePage === "settings"
                ? "bg-accent-green/10 text-accent-green"
                : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>
        </nav>
      </div>
    </aside>
  );
}
