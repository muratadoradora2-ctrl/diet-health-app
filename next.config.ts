import type { NextConfig } from "next";

// Content-Security-Policyはリクエストごとにnonceを生成する必要があるため
// src/proxy.ts + src/lib/csp.ts で設定する。ここでは静的に決まる
// その他のセキュリティヘッダーのみを設定する。
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
