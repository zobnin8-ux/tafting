import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 96,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: 280,
            height: 280,
            gap: 12,
          }}
        >
          {[
            "#fef3c7",
            "#fde68a",
            "#fbbf24",
            "#f59e0b",
            "#fcd34d",
            "#fef08a",
            "#fde047",
            "#facc15",
            "#eab308",
          ].map((color, i) => (
            <div
              key={i}
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                backgroundColor: color,
                border: "3px solid rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
