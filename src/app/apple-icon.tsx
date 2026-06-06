import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: 100,
            height: 100,
            gap: 6,
          }}
        >
          {["#fef3c7", "#fde68a", "#fbbf24", "#f59e0b"].map((color, i) => (
            <div
              key={i}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: color,
                border: "2px solid rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
