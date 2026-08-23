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
    // 静的アセット・favicon以外の全パスに適用
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
