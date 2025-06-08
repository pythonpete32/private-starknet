"use client";

import { Button } from "@inkonchain/ink-kit";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/account-system", label: "Account System" },
    { href: "/commitment-system", label: "Commitment System" },
  ];

  return (
    <nav className="flex flex-col gap-2 p-4">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button 
            variant={pathname === item.href ? "primary" : "transparent"}
            className="w-full justify-start"
          >
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  );
}