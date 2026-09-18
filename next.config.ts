import type { NextConfig } from "next";

// Static export for `next build` / Cloudflare Workers assets. `next dev`
// must NOT use `output: "export"` — that mode rejects POST route handlers,
// and `/api/optimize` plus `/api/import` are POSTs. Production ships static
// files; Groq is served by workers/index.ts (`run_worker_first`: /api/*).
const isDevCommand = process.argv.includes("dev");

const nextConfig: NextConfig = {
  ...(!isDevCommand ? { output: "export" as const } : {}),
  images: {
    unoptimized: true,
  },
  transpilePackages: ["pdfjs-dist"],
};

export default nextConfig;
