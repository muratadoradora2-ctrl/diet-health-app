/**
 * ホーム画面アイコン等で使う共通のマーク。globals.cssのデザイントークン
 * (--accent, --bg)と同じ配色を、ImageResponse用に直接値として使う。
 */
export function AppIconMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#6c8060",
      }}
    >
      <span
        style={{
          fontSize: size * 0.56,
          color: "#f6f4ef",
          fontFamily: "serif",
          lineHeight: 1,
        }}
      >
        健
      </span>
    </div>
  );
}
