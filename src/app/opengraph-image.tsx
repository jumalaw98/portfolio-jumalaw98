import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Sitewide fallback OG/Twitter image, generated at request time via Satori —
// no external asset dependency, and it automatically applies to any route
// that doesn't pass an explicit `ogImage` to pageMetadata() (Home, About,
// Community, Contact, listing pages). Routes with a real per-page image
// (project case studies, blog posts) override this via their own metadata.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1C76B5",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 9999,
            border: "6px solid #F7941D",
            fontSize: 48,
            fontWeight: 700,
            marginBottom: 40,
          }}
        >
          JLW
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, textAlign: "center" }}>
          {SITE_NAME}
        </div>
        <div
          style={{
            fontSize: 28,
            marginTop: 16,
            color: "#EAF3FA",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    { ...size },
  );
}
