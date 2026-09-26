import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Fraunces, Geist, Inter, JetBrains_Mono, Playfair_Display, Source_Serif_4, Syne } from "next/font/google";
import Script from "next/script";
import {
  ADSENSE_CLIENT_ID,
  adsenseClientAttr,
  adsenseScriptSrc,
  FUNDING_CHOICES_PRESENT_SNIPPET,
  fundingChoicesScriptSrc,
  isAdsenseConfigured,
} from "@/lib/ads";
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

/* Display faces for the names and titles of a few templates. Not preloaded:
 * only a page that renders one of those templates downloads the file. The
 * PDF engine embeds the same families (components/pdf/fonts.ts). */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "300",
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: "600",
  display: "swap",
  preload: false,
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: "500",
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: "700",
  display: "swap",
  preload: false,
});

const DISPLAY_FONT_VARIABLES = [fraunces, playfair, cormorant, jetbrainsMono, syne].map((f) => f.variable).join(" ");

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
  // Search Console's HTML-tag method. Preferred over its file method here:
  // `html_handling: "auto-trailing-slash"` (wrangler.jsonc) 307s any `*.html`
  // request to its extensionless form, so a verification *file* would never
  // return 200 at the URL Google fetches, and a redirected one reads as
  // missing. A meta tag sits in every page's <head> and sidesteps that.
  verification: { google: "GFCWGpyf43Ywu3vECFLTdOx2zbeppn9f7YZazzcGFqM" },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: HOME_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["/og.png"],
  },
  // Google's site-connection meta — crawlers look for this in <head> even
  // when the adsbygoogle script is still loading. Only emitted when a real
  // publisher id is configured at build time.
  ...(isAdsenseConfigured()
    ? { other: { "google-adsense-account": adsenseClientAttr(ADSENSE_CLIENT_ID) } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: BRAND.paper,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${geist.variable} ${sourceSerif.variable} ${DISPLAY_FONT_VARIABLES} h-full`} data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* Native <script>, not next/script: Google’s snippet crawler looks for
          adsbygoogle.js on a real src= tag in the HTML. next/script rewrites
          that to a preload + __next_s inject, which Google reports as “no ad
          code”. Kept in <head> to match the snippet they issued. */}
      <head>
        {isAdsenseConfigured() && (
          <>
            {/* Funding Choices (Google-certified CMP) must load before
                adsbygoogle so EEA/UK/US-states visitors see a consent
                message before any ad request goes out.
                suppressHydrationWarning: AdSense rewrites these tags
                (managed show_*.js, fetchpriority) before React hydrates. */}
            <script async src={fundingChoicesScriptSrc()} suppressHydrationWarning />
            <script
              dangerouslySetInnerHTML={{ __html: FUNDING_CHOICES_PRESENT_SNIPPET }}
              suppressHydrationWarning
            />
            <script
              async
              src={adsenseScriptSrc()}
              crossOrigin="anonymous"
              suppressHydrationWarning
            />
          </>
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
