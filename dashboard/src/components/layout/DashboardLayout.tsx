import type { ReactNode } from "react";
import type { UserInfo } from "../../api";
import { Sidebar } from "./Sidebar";
import type { Page } from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  user: UserInfo;
  onLogout: () => void;
  activePage: Page;
  onNavigate: (page: Page) => void;
  guildId?: string | null;
  onServerList?: () => void;
  days: number;
  onDaysChange: (days: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isAdmin?: boolean;
}

export function DashboardLayout({
  children,
  onLogout,
  activePage,
  onNavigate,
  guildId,
  onServerList,
  isAdmin = false,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        guildId={guildId}
        onServerList={onServerList}
        onLogout={onLogout}
        isAdmin={isAdmin}
      />
      <main className="lg:pl-64 pb-12 min-h-screen pt-6">
        {children}
      </main>
    </div>
  );
}
