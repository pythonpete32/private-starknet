"use client";

import { useState, useEffect } from "react";
import {
  InkLayout,
  InkPageLayout,
  InkPanel,
  SegmentedControl,
} from "@inkonchain/ink-kit";
import { Logo } from "./Logo";
import { WalletConnect } from "../../components/WalletConnect";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering for ink-kit components
  useEffect(() => {
    setIsClient(true);
  }, []);

  const navOptions = [
    {
      asChild: true,
      children: <a href="/" target="_self">Home</a>,
      selectedByDefault: pathname === "/",
      value: "/"
    },
    {
      asChild: true,
      children: <a href="/account-system" target="_self">Account</a>,
      selectedByDefault: pathname === "/account-system",
      value: "/account-system"
    },
    {
      asChild: true,
      children: <a href="/commitment-system" target="_self">Commitment</a>,
      selectedByDefault: pathname === "/commitment-system",
      value: "/commitment-system"
    }
  ];

  const handleNavChange = () => {
    // Navigation handled by the anchor tags
  };

  return (
    <InkLayout
      mainIcon={<Logo />}
      topNavigation={
        <div className="flex items-center justify-center w-full">
          {isClient ? (
            <SegmentedControl
              options={navOptions}
              onOptionChange={handleNavChange}
            />
          ) : (
            <div className="h-10 w-64 bg-gray-200 animate-pulse rounded" />
          )}
        </div>
      }
      headerContent={<WalletConnect />}
    >
      <InkPageLayout>
        <InkPanel size="auto" className="min-h-[calc(100vh-8rem)]">
          {children}
        </InkPanel>
      </InkPageLayout>
    </InkLayout>
  );
}
