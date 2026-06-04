import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Police mono (badges, boutons techniques, labels uppercase).
// Sans liste de poids, Next ne charge que le 400 → font-semibold/bold rend mal (fake-bold).
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Renderz - AI Hyperrealistic Image Generation",
  description: "Transform your reference images into hyperrealistic renders with AI",
  icons: {
    icon: "/logo-renderz.svg",
    apple: "/logo-renderz.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable}`}>
      <head>
        {/* Police principale (UI). Funnel Display n'est pas (encore) dans la liste statique
            de next/font pour cette version de Next, donc on la charge ainsi : preconnect + <link>
            non render-blocking, plus efficace que @import en CSS. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@400;500;600;700;800;900&display=swap"
        />
      </head>
      <body
        className="antialiased"
        style={{ fontFamily: "'Funnel Display', system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}







