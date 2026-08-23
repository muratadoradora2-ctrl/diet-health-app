import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ふたり健康管理",
    short_name: "ふたり健康管理",
    description: "夫婦2人専用のダイエット・体調管理アプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f4ef",
    theme_color: "#6c8060",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
