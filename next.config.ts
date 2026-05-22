import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [70, 75, 100],
    localPatterns: [
      // Catch-all for ordinary static assets and API images without a query.
      { pathname: "/**", search: "" },
      // Splash API uses ?size=full|thumb to pick the variant.
      { pathname: "/api/champion-splash/**", search: "?size=full" },
      { pathname: "/api/champion-splash/**", search: "?size=thumb" },
    ],
  },
};

export default nextConfig;
