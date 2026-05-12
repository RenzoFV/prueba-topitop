import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { AppHeader, type NavItem } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export function AppShell({
  section,
  nav,
  children,
}: {
  section: string;
  nav?: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <AnnouncementBar />
      <AppHeader section={section} nav={nav} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
