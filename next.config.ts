import type { NextConfig } from "next";

// Static export: this app has no backend/database (everything lives in
// client state + localStorage), so it ships as plain static files. That
// maps directly onto Cloudflare Pages' free tier — unlimited static
// requests/bandwidth, no Workers/Functions invocations to meter.
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
