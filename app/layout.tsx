import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Restaurant — NexaSoft Africa",
  description: "Gestion complète de restaurant : commandes, tables, menu, caisse, stock et statistiques.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}