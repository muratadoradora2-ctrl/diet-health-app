import type { NextConfig } from "next";

// Content-Security-Policyはリクエストごとにnonceを生成する必要があるため
// src/proxy.ts + src/lib/csp.ts で設定する。ここでは静的に決まる
// その他のセキュリティヘッダーのみを設定する。
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 体組成スクリーンショットのアップロード(Server Action)がNext.jsの
      // デフォルト上限(1MB程度)で失敗しないよう引き上げる。
      // Vercel自体のリクエストサイズ上限(約4.5MB、変更不可)を超えないよう、
      // こことscan/actions.tsのMAX_IMAGE_BYTESを両方4MBに揃えている。
      bodySizeLimit: "4mb",
    },
  },
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
