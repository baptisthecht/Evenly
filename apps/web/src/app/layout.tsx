import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evoly — La billetterie honnête",
  description: "Créez votre événement en 60 secondes. 0% commission sur les tickets gratuits. 5% sur les payants. Affiché clairement, toujours.",
  openGraph: {
    title: "Evoly — La billetterie honnête",
    description: "Zéro surprise, zéro arnaque. La vraie alternative à Eventbrite.",
    type: "website",
    locale: "fr_FR",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
