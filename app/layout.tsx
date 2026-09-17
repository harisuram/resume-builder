import type { Metadata, Viewport } from "next";
import { Geist, Inter, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import { ADSENSE_CLIENT_ID, adsenseClientAttr, adsenseScriptSrc, isAdsenseConfigured } from "@/lib/ads";
import { BRAND } from "@/lib/brand";
import { HOME_DESCRIPTION, HOME_TITLE, SITE_KEYWORDS, SITE_NAME } from "@/lib/seo";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
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
  applicationName: SITE_NAME,
  title: {
    default: HOME_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  keywords: [...SITE_KEYWORDS],
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
    { media: "(prefers-color-scheme: light)", color: BRAND.paper },
    { media: "(prefers-color-scheme: dark)", color: BRAND.paperDark },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${geist.variable} ${sourceSerif.variable} h-full`} data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* Native <script>, not next/script: Google’s snippet crawler looks for
          adsbygoogle.js on a real src= tag in the HTML. next/script rewrites
          that to a preload + __next_s inject, which Google reports as “no ad
          code”. Kept in <head> to match the snippet they issued. */}
      <head>
        {isAdsenseConfigured() && (
          <script async src={adsenseScriptSrc()} crossOrigin="anonymous" />
        )}
      </head>
      {/* Extensions (ColorZilla's cz-shortcut-listen, Grammarly, etc.) stamp
          attributes onto html/body before React hydrates. suppressHydrationWarning
          only covers this node's own attributes — it does not hide mismatches
          in children. */}
      <body className="flex min-h-full flex-col antialiased" suppressHydrationWarning>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {THEME_BOOTSTRAP_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
