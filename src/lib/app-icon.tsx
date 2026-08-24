/**
 * ホーム画面アイコン等で使う共通のマーク。globals.cssのデザイントークン
 * (--accent, --bg)と近い配色で、丸顔のかわいいキャラクターを描く。
 */
export function AppIconMark({ size }: { size: number }) {
  const faceSize = size * 0.66;
  const eyeSize = size * 0.075;
  const blushSize = size * 0.09;
  const mouthWidth = size * 0.16;
  const mouthHeight = mouthWidth * 0.55;
  const borderWidth = Math.max(1, size * 0.018);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#c06673",
      }}
    >
      <div
        style={{
          position: "relative",
          width: faceSize,
          height: faceSize,
          borderRadius: "50%",
          background: "#fdf6ea",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: faceSize * 0.22,
            marginBottom: faceSize * 0.08,
          }}
        >
          <div
            style={{
              width: eyeSize,
              height: eyeSize,
              borderRadius: "50%",
              background: "#4a3226",
            }}
          />
          <div
            style={{
              width: eyeSize,
              height: eyeSize,
              borderRadius: "50%",
              background: "#4a3226",
            }}
          />
        </div>
        <div
          style={{
            width: mouthWidth,
            height: mouthHeight,
            borderBottomLeftRadius: mouthWidth,
            borderBottomRightRadius: mouthWidth,
            borderLeft: `${borderWidth}px solid #4a3226`,
            borderRight: `${borderWidth}px solid #4a3226`,
            borderBottom: `${borderWidth}px solid #4a3226`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: faceSize * 0.1,
            top: faceSize * 0.54,
            width: blushSize,
            height: blushSize * 0.66,
            borderRadius: "50%",
            background: "#eeaba0",
            opacity: 0.75,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: faceSize * 0.1,
            top: faceSize * 0.54,
            width: blushSize,
            height: blushSize * 0.66,
            borderRadius: "50%",
            background: "#eeaba0",
            opacity: 0.75,
          }}
        />
      </div>
    </div>
  );
}
