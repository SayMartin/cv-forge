import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Build, manage, and export polished CVs — your career story, beautifully told.";

export const metadata: Metadata = {
  // Required for the absolute URLs Open Graph needs; without it Next emits
  // relative ones and warns at build time.
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | CV Forge",
    default: "CV Forge",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "CV Forge",
    title: "CV Forge",
    description: DESCRIPTION,
    url: "/",
    locale: "en_GB",
  },
  twitter: {
    card: "summary",
    title: "CV Forge",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
