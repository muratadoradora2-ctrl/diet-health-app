import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ふたり健康管理",
  description: "夫婦2人専用のダイエット・体調管理アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
