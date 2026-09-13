import { getStories } from "@/lib/data";
import { brand } from "@/lib/brand";
import { xml } from "@/lib/xml";
export const dynamic = "force-dynamic";
export async function GET() {
  const { stories } = await getStories({}, 50);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${xml(brand.name)}</title><link>${xml(brand.url)}</link><description>${xml(brand.description)}</description><language>en</language><atom:link href="${xml(brand.url)}/feed.xml" rel="self" type="application/rss+xml"/>${stories.map((s) => `<item><title>${xml(s.headline)}</title><link>${xml(brand.url)}/stories/${s.slug}</link><guid isPermaLink="true">${xml(brand.url)}/stories/${s.slug}</guid><description>${xml(s.summary)}</description><category>${xml(s.category)}</category><pubDate>${new Date(s.published_at!).toUTCString()}</pubDate></item>`).join("")}</channel></rss>`,
    {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
