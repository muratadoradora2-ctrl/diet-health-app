export type SupportedImageMimeType = "image/png" | "image/jpeg" | "image/webp";

/**
 * ブラウザが申告するfile.typeを信用せず、ファイル先頭のマジックバイトから
 * 実際の画像形式を判定する。不正なMIME偽装によるアップロードを防ぐため。
 */
export function sniffImageMimeType(buffer: Buffer): SupportedImageMimeType | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}
