export type Page = "dashboard" | "presence" | "settings";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  guildId?: string | null;
  onServerList?: () => void;
  onLogout?: () => void;
  isAdmin?: boolean;
}

export function Sidebar({
  activePage,
  onNavigate,
  guildId,
  onServerList,
  onLogout,
}: SidebarProps) {
  const isServerListActive = activePage === "dashboard" && !guildId;
  const isAnalyticsActive = activePage === "dashboard" && !!guildId;
  const isSettingsActive = activePage === "settings";

  const navItem = (
    active: boolean,
    icon: string,
    label: string,
    onClick: () => void,
    iconFilled = false,
  ) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-3 text-left transition-all ${
        active
          ? "bg-[#201f1f] text-[#D4FF33] rounded-r-lg border-l-4 border-[#D4FF33] pl-5 pr-6"
          : "text-[#adaaaa] hover:bg-[#262626] hover:text-[#D4FF33] pl-6 pr-6 border-l-4 border-transparent"
      }`}
    >
      <span
        className="material-symbols-outlined text-[20px]"
        style={iconFilled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
      <span className={`font-label text-sm ${active ? "font-bold" : "font-medium"}`}>
        {label}
      </span>
    </button>
  );

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-[#1a1919] py-6 shadow-xl lg:flex">
      {/* Brand */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#D4FF33] flex items-center justify-center flex-shrink-0">
          <span
            className="material-symbols-outlined text-black text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            bolt
          </span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#D4FF33] leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Andromeda
          </h2>
          <p className="text-[10px] text-[#adaaaa] uppercase tracking-widest mt-1">
            v1.0.2 Active
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItem(
          isServerListActive,
          "dns",
          "Server List",
          () => { onServerList ? onServerList() : onNavigate("dashboard"); },
        )}
        {navItem(
          isAnalyticsActive,
          "insights",
          "Analytics",
          () => onNavigate("dashboard"),
          isAnalyticsActive,
        )}
        {navItem(
          isSettingsActive,
          "settings",
          "Settings",
          () => onNavigate("settings"),
        )}
      </nav>

      {/* Bottom */}
      <div className="px-6 mt-auto flex flex-col gap-4">
        <a
          href="https://discord.com/oauth2/authorize?client_id=1422053050909986916&permissions=8&integration_type=0&scope=bot+applications.commands"
          target="_blank"
          rel="noreferrer"
          className="block w-full bg-[#D4FF33] text-black px-4 py-3 rounded-xl font-bold text-sm text-center hover:opacity-90 active:scale-95 transition-all"
        >
          Invite Bot
        </a>
        <div className="flex flex-col gap-1">
          <button className="flex items-center gap-3 text-[#adaaaa] py-2 hover:text-white transition-colors text-left">
            <span className="material-symbols-outlined text-[18px]">help</span>
            <span className="text-sm">Help</span>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-3 text-[#ff7351]/80 py-2 hover:text-[#ff7351] transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="text-sm">Logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
