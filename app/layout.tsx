import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Renderz - AI Hyperrealistic Image Generation",
  description: "Transform your reference images into hyperrealistic renders with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${jetbrainsMono.variable}`}>
      <body className="antialiased" style={{ fontFamily: "'Funnel Display', system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}







