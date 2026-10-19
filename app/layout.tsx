import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav, Footer } from "@/components/Chrome";
import { APP } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP.name} — ${APP.tagline}`,
    template: `%s — ${APP.name}`,
  },
  description: APP.description,
  keywords: ["OSINT", "data brokers", "opt-out", "privacy", "exposure scan", "open source"],
  twitter: { card: "summary_large_image", creator: "@sohan_a11y" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
