import type { ReactNode } from "react";
import type { UserInfo } from "../../api";
import { Sidebar } from "./Sidebar";
import type { Page } from "./Sidebar";
import { Topbar } from "./Topbar";

interface DashboardLayoutProps {
  children: ReactNode;
  user: UserInfo;
  onLogout: () => void;
  activePage: Page;
  onNavigate: (page: Page) => void;
  days: number;
  onDaysChange: (days: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isAdmin?: boolean;
}

export function DashboardLayout({
  children,
  user,
  onLogout,
  activePage,
  onNavigate,
  days,
  onDaysChange,
  search,
  onSearchChange,
  isAdmin = false,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar activePage={activePage} onNavigate={onNavigate} isAdmin={isAdmin} />

      <div className="ml-52 flex flex-1 flex-col">
        <Topbar
          user={user}
          onLogout={onLogout}
          days={days}
          onDaysChange={onDaysChange}
          search={search}
          onSearchChange={onSearchChange}
        />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
