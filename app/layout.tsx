import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qistas — Arabic hybrid search",
  description:
    "Full-text and vector hybrid search for Arabic, with orthographic normalisation and reciprocal rank fusion.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plex.variable}>
      <body className="bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
