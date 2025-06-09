import type { Metadata } from "next";
import "./globals.css";

import { AppShell } from "./components/AppShell";

import Providers from "./providers";

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
    <html lang="en" className="ink:neo-theme" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
