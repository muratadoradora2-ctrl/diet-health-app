/**
 * このアプリの利用者は日本在住の2名のみのため、日付・時刻の入力/表示は
 * 常にAsia/Tokyo(JST)基準で扱う。
 */

function toJst(date: Date): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function jstDateString(date: Date = new Date()): string {
  const jst = toJst(date);
  return `${jst.getFullYear()}-${pad(jst.getMonth() + 1)}-${pad(jst.getDate())}`;
}

export function jstTimeString(date: Date = new Date()): string {
  const jst = toJst(date);
  return `${pad(jst.getHours())}:${pad(jst.getMinutes())}`;
}

/** 日付入力(YYYY-MM-DD)と時刻入力(HH:mm)をJSTとして解釈し、UTCのISO文字列にする */
export function jstDateTimeToISOString(date: string, time: string): string {
  return new Date(`${date}T${time}:00+09:00`).toISOString();
}

/** JSTでのその日(00:00〜翌日00:00)の範囲を、DBクエリ用のISO文字列で返す */
export function jstDayRangeToISOStrings(dateStr: string): {
  startIso: string;
  endIso: string;
} {
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

/**
 * timestamptz(ISO文字列)をJSTとして表示用にフォーマットする。
 * サーバー(Vercel)はUTCで動作するため、timeZoneを明示しないと
 * 実際に入力・保存した時刻と異なる時刻が表示されてしまう。
 */
export function formatJstDateTime(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleString("ja-JP", { ...options, timeZone: "Asia/Tokyo" });
}

/**
 * date型(YYYY-MM-DD、時刻情報を持たない)の文字列を表示用にフォーマットする。
 * タイムゾーンの影響を受けないよう、Dateオブジェクトのローカルコンストラクタで
 * 組み立ててからtimeZone指定なしでフォーマットする(値が往復して一致する)。
 */
/**
 * 直近の「完了した週」(月曜始まり、日曜終わり)をJST基準で返す。
 * 今週はまだ終わっていないため、常に先週(月〜日)を指す。
 */
export function jstMostRecentCompletedWeek(referenceDate: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  const jst = toJst(referenceDate);
  const dayOfWeek = jst.getDay(); // 0=日, 1=月, ..., 6=土
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  const thisMonday = new Date(jst);
  thisMonday.setDate(thisMonday.getDate() - daysSinceMonday);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastSunday.getDate() + 6);

  const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { startDate: toYmd(lastMonday), endDate: toYmd(lastSunday) };
}

/** date型(YYYY-MM-DD)文字列同士の日数差(endDate - startDate)を計算する */
export function daysBetweenDates(startDate: string, endDate: string): number {
  const [ay, am, ad] = startDate.split("-").map(Number);
  const [by, bm, bd] = endDate.split("-").map(Number);
  const a = new Date(ay, am - 1, ad);
  const b = new Date(by, bm - 1, bd);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDateOnly(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { month: "numeric", day: "numeric" },
): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("ja-JP", options);
}
