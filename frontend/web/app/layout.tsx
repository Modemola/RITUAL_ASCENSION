import type { Metadata } from "next";
import { ReactNode } from "react";
import { AppShell } from "./app-shell";
import { RitualProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ritual Ascension",
  description: "Soulbound builder identity, quests, XP, reputation, and Oracle guidance for Ritual."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RitualProvider>
          <AppShell>{children}</AppShell>
        </RitualProvider>
      </body>
    </html>
  );
}
