export const brand = {
  name: "The Inference",
  shortName: "Inference",
  mastheadPrefix: "THE",
  mastheadName: "INFERENCE",
  description:
    "Independent AI news and intelligence. What happened, what changed, and the evidence behind it.",
  tagline: "Intelligence on artificial intelligence.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  editorialByline: "The Inference newsroom",
} as const;
