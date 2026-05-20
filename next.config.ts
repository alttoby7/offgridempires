import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  output: "standalone",
  // Canonicalize host: 308 www.offgridempire.com -> offgridempire.com.
  // (http -> https is handled by the Cloudflare zone "Always Use HTTPS" setting.)
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.offgridempire.com" }],
        destination: "https://offgridempire.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
