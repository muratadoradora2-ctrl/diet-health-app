import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { buildContentSecurityPolicy } from "@/lib/csp";

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildContentSecurityPolicy(nonce);

  const response = await updateSession(request, nonce);
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    // 静的アセット・favicon・PWAマニフェスト/アイコン以外の全パスに適用。
    // manifest.webmanifestとapple-iconは、ログイン前(ログイン画面表示中や
    // ホーム画面への追加操作時)にもブラウザ・iOSから取得されるため、
    // ログイン必須の対象から除外する(いずれも個人データを含まない)。
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
