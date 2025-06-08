import type { Metadata } from "next";
import { InkLayout } from "@inkonchain/ink-kit";
import { AppShell } from "./components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Private DAI Transfer",
  description: "Private DAI transfers on Starknet using zero-knowledge proofs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="ink:light-theme">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
