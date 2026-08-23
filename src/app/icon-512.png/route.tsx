import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/app-icon";

const SIZE = 512;

export async function GET() {
  return new ImageResponse(<AppIconMark size={SIZE} />, {
    width: SIZE,
    height: SIZE,
  });
}
