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
    // Hosts externos liberados pro next/image:
    //   - ddragon: avatares Riot e splash defaults
    //   - api.bdrn.com.br: storage dos splashes processados
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/cdn/**",
      },
      {
        protocol: "https",
        hostname: "api.bdrn.com.br",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
