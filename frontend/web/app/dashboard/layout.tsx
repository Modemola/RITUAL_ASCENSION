import { ReactNode } from "react";

export const metadata = {
  title: "Dashboard | Ritual Ascension",
  description: "View your Ritual Ascension passport, XP, evolution stage, and linked identity."
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
