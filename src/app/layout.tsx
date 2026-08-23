import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ふたり健康管理",
  description: "夫婦2人専用のダイエット・体調管理アプリ",
  appleWebApp: {
    title: "ふたり健康管理",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1d19" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          next/fontはZen Old Mincho / Zen Kaku Gothic Newの日本語サブセットを
          安定して扱えないため、ルートレイアウト全体(=全ページ共通)に
          直接リンクしている。@next/next/no-page-custom-fontはPages Router
          向けの警告のため、App Routerのルートレイアウトでは無効化する。
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
