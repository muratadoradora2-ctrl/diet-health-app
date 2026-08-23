/**
 * Content-Security-Policyをリクエストごとに生成する。
 *
 * script-srcは 'nonce-xxx' + 'strict-dynamic' 方式にしている。これにより
 * Next.js自体が挿入するインラインスクリプト(ハイドレーション用のデータ転送)
 * だけを安全に許可しつつ、それ以外の任意のインラインスクリプト・外部スクリプトは
 * 引き続きブロックする(単純に 'unsafe-inline' を許可するより安全)。
 */
export function buildContentSecurityPolicy(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    "font-src 'self' https://fonts.gstatic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
