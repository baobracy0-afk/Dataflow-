import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata={title:"DataFlow — Gestion commerciale",description:"Gérez clients, prospects, partenaires, produits et paiements dans un espace sécurisé."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}