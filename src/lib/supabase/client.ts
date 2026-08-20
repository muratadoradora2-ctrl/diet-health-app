import { createBrowserClient } from "@supabase/ssr";

/**
 * ブラウザ（クライアントコンポーネント）から使うSupabaseクライアント。
 * anon keyのみを使用し、Service Role Keyはここでは絶対に扱わない。
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
