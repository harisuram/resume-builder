import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import { ADSENSE_CLIENT_ID, isAdsenseConfigured } from "@/lib/ads";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://resume-builder.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Letterform — a free, private resume builder",
    template: "%s — Letterform",
  },
  description:
    "Build a resume from only the sections you need. Skip the rest, pick a template, download a PDF. Free, private, no account.",
  openGraph: {
    title: "Letterform — a free, private resume builder",
    description:
      "Build a resume from only the sections you need. Skip the rest, pick a template, download a PDF. Free, private, no account.",
    url: SITE_URL,
    siteName: "Letterform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Letterform — a free, private resume builder",
    description:
      "Build a resume from only the sections you need. Skip the rest, pick a template, download a PDF. Free, private, no account.",
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f0" },
    { media: "(prefers-color-scheme: dark)", color: "#16140f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable} h-full`} suppressHydrationWarning>
      {/* Extensions (ColorZilla's cz-shortcut-listen, Grammarly, etc.) stamp
          attributes onto html/body before React hydrates. suppressHydrationWarning
          only covers this node's own attributes — it does not hide mismatches
          in children. */}
      <body className="flex min-h-full flex-col antialiased" suppressHydrationWarning>
        {children}
        {isAdsenseConfigured() && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
