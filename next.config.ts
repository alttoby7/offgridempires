import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
