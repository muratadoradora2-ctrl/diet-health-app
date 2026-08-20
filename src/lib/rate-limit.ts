import "server-only";
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Rate Limit用の識別子は、生のメールアドレスや体重・食事・生理などの
 * 個人データを一切含めず、常に一方向ハッシュに変換してからUpstashへ送る。
 * scopeを含めてハッシュ化するため、同じ利用者でも用途（ログイン試行/
 * AI呼び出しなど）ごとに別々の匿名トークンになる。
 */
function hashIdentifier(rawIdentifier: string, scope: string): string {
  return createHash("sha256").update(`${scope}:${rawIdentifier}`).digest("hex");
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(
  scope: string,
  limit: number,
  windowSeconds: number,
): Ratelimit | null {
  if (!redis) return null;

  const cacheKey = `${scope}:${limit}:${windowSeconds}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      // slidingWindowは各識別子のカウンタにwindowと同じTTLを自動設定するため、
      // Upstash側に古いRate Limitデータが長期間残ることはない。
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: "ratelimit",
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * @param rawIdentifier ハッシュ化前の識別子（Supabase user_idやログイン試行時の
 *   メールアドレスなど）。この関数の外に平文のまま渡す・保存することはない。
 * @param scope 用途ラベル（例: "login", "ai-body-scan"）。
 * @param options limit: window内の許容回数, windowSeconds: 時間窓（秒）
 */
export async function checkRateLimit(
  rawIdentifier: string,
  scope: string,
  options: { limit: number; windowSeconds: number },
): Promise<{ success: boolean }> {
  const limiter = getLimiter(scope, options.limit, options.windowSeconds);
  if (!limiter) {
    // Upstash未設定（Phase 2のセットアップ完了前など）の場合はfail-openとし、
    // アプリ自体は引き続き使えるようにする。設定後は自動的に有効になる。
    return { success: true };
  }

  const identifier = hashIdentifier(rawIdentifier, scope);
  const { success } = await limiter.limit(identifier);
  return { success };
}
