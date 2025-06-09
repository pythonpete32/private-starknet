"use client";

import { useState, useEffect } from "react";
import { Typography, SegmentedControl } from "@inkonchain/ink-kit";
import { Logo } from "./Logo";
import { SimpleWalletButton } from "../../components/SimpleWalletButton";
import { usePathname } from "next/navigation";

interface CustomAppShellProps {
  children: React.ReactNode;
}

export function CustomAppShell({ children }: CustomAppShellProps) {
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
    <div className="min-h-screen flex flex-col">
      {/* Non-sticky header */}
      <div className="ink:bg-background-container border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Logo />
              <Typography variant="h4" className="ml-3">
                Private DAI
              </Typography>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              {isClient ? (
                <SegmentedControl
                  options={navOptions}
                  onOptionChange={handleNavChange}
                />
              ) : (
                <div className="h-10 w-64 ink:bg-background-light animate-pulse rounded" />
              )}
            </div>

            {/* Wallet Button */}
            <div>
              <SimpleWalletButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}