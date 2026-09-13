import { brand } from "./brand";
import type { StoryDetail } from "./types";
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
export function articleSchema(story: StoryDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: story.headline,
    description: story.summary,
    datePublished: story.published_at,
    dateModified: story.updated_at,
    mainEntityOfPage: `${brand.url}/stories/${story.slug}`,
    author: {
      "@type": "Organization",
      name: brand.name,
      url: `${brand.url}/about`,
    },
    publisher: { "@type": "Organization", name: brand.name, url: brand.url },
    articleSection: story.category,
    inLanguage: "en",
    ...(story.hero_image_url ? { image: [story.hero_image_url] } : {}),
    citation: story.sources.map((s) => s.source_url),
  };
}
