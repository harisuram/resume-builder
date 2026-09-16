import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import { ADSENSE_CLIENT_ID, adsenseClientAttr, isAdsenseConfigured } from "@/lib/ads";
import { HOME_DESCRIPTION, HOME_TITLE, SITE_NAME } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  // Google's site-connection meta — crawlers look for this in <head> even
  // when the adsbygoogle script is still loading. Only emitted when a real
  // publisher id is configured at build time.
  ...(isAdsenseConfigured()
    ? { other: { "google-adsense-account": adsenseClientAttr(ADSENSE_CLIENT_ID) } }
    : {}),
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
        {isAdsenseConfigured() && (
          <Script
            id="adsense"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientAttr(ADSENSE_CLIENT_ID)}`}
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {children}
      </body>
    </html>
  );
}
