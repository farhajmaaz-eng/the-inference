import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";
export const alt = `${brand.name} — AI news and intelligence`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#f8f8f5",
        color: "#20211f",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "70px",
      }}
    >
      <div
        style={{
          fontSize: 30,
          display: "flex",
          borderBottom: "3px solid #20211f",
          paddingBottom: 25,
        }}
      >
        {brand.tagline}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 100,
          letterSpacing: "-4px",
          fontFamily: "serif",
          marginTop: 65,
        }}
      >
        {brand.name}
        <span style={{ color: "#aa3028" }}>.</span>
      </div>
      <div style={{ display: "flex", fontSize: 35, marginTop: 40 }}>
        The developments. The differences. The evidence.
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 24,
          borderTop: "1px solid #62645e",
          paddingTop: 22,
          marginTop: 55,
        }}
      >
        WHAT CHANGED? · Read the source. Understand the change.
      </div>
    </div>,
    size,
  );
}
