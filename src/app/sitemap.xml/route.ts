import { publicDatabase, databaseConfigured } from "@/lib/supabase";
import { brand } from "@/lib/brand";
import { xml } from "@/lib/xml";
export const dynamic = "force-dynamic";
const collections = [
  "stories",
  "companies",
  "models",
  "daily_briefings",
] as const;
const prefix = (table: string) =>
  table === "daily_briefings" ? "briefings" : table;
const response = (body: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

// Dynamic index + bounded 1,000-row shards: new coverage never needs a build.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const collection = params.get("collection");
  if (!databaseConfigured())
    return response(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>',
    );
  const db = publicDatabase();
  if (!collection) {
    const counts = await Promise.all(
      collections.map((table) =>
        db
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("status", "published"),
      ),
    );
    if (counts.some((result) => result.error))
      return new Response("Sitemap temporarily unavailable", { status: 503 });
    const urls = [`${brand.url}/sitemap.xml?collection=pages`];
    counts.forEach((result, index) => {
      for (let page = 0; page < Math.ceil((result.count || 0) / 1000); page++)
        urls.push(
          `${brand.url}/sitemap.xml?collection=${collections[index]}&page=${page}`,
        );
    });
    return response(
      `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<sitemap><loc>${xml(url)}</loc></sitemap>`).join("")}</sitemapindex>`,
    );
  }
  let routes: { url: string; modified?: string }[];
  if (collection === "pages") {
    const { data, error } = await db.from("categories").select("slug");
    if (error)
      return new Response("Sitemap temporarily unavailable", { status: 503 });
    routes = [
      "/",
      "/archive",
      "/companies",
      "/models",
      "/briefings",
      "/about",
      ...(data || []).map((c) => `/category/${c.slug}`),
    ].map((path) => ({ url: `${brand.url}${path}` }));
  } else {
    const table = collections.find((value) => value === collection);
    const rawPage = params.get("page") || "0";
    if (!table || !/^\d{1,5}$/.test(rawPage))
      return new Response("Not found", { status: 404 });
    const page = Number(rawPage);
    const { data, error } = await db
      .from(table)
      .select("slug,updated_at")
      .eq("status", "published")
      .order("id")
      .range(page * 1000, page * 1000 + 999);
    if (error)
      return new Response("Sitemap temporarily unavailable", { status: 503 });
    routes = (data || []).map((row) => ({
      url: `${brand.url}/${prefix(table)}/${row.slug}`,
      modified: row.updated_at,
    }));
  }
  return response(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((r) => `<url><loc>${xml(r.url)}</loc>${r.modified ? `<lastmod>${xml(r.modified)}</lastmod>` : ""}</url>`).join("")}</urlset>`,
  );
}
