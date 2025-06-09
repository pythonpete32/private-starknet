"use client";

import { InkLayout } from "@inkonchain/ink-kit";
import { Navigation } from "./Navigation";
import { Logo } from "./Logo";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <InkLayout
      mainIcon={<Logo />}
      sideNavigation={<Navigation />}
      mobileNavigation={<Navigation />}
    >
      <div className="min-h-[80vh] flex flex-col justify-center max-w-5xl mx-auto px-8">
        {children}
      </div>
    </InkLayout>
  );
}
