import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

/** Editorial serif reserved for major Archive titles (public site only). */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Matrix Strategy Archives — DeFi strategies for every market",
  description:
    "A structured, curated archive of DeFi strategies covering lending, staking, liquidity provision, delta-neutral and portfolio strategies — searchable by market regime, assets, protocols, risk and requirements.",
  keywords: ["DeFi", "strategies", "Matrix Finance", "liquidity provision", "staking", "lending"],
  authors: [{ name: "Matrix Finance" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
