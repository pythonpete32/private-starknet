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
    <nav className="ink:flex ink:flex-col ink:gap-3 ink:p-6">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button 
            variant={pathname === item.href ? "primary" : "secondary"}
            className="ink:w-full ink:justify-start ink:py-3 ink:text-sm"
          >
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  );
}