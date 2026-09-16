import type { NextConfig } from "next";

// Static export for `next build` / Cloudflare Pages. `next dev` must NOT
// use `output: "export"` — that mode rejects POST route handlers, and the
// ATS rewrite at /api/optimize is a POST. Production still ships static
// files; Groq is served by functions/api/optimize.ts on Pages.
const isDevCommand = process.argv.includes("dev");

const nextConfig: NextConfig = {
  ...(!isDevCommand ? { output: "export" as const } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
