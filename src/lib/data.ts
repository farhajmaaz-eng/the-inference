import "server-only";
import { cache } from "react";
import { publicDatabase, databaseConfigured } from "./supabase";
import type {
  Story,
  StoryDetail,
  Company,
  Model,
  Briefing,
  Category,
  EntityEvent,
} from "./types";

export const storyFields =
  "id,slug,headline,subheadline,summary,body,category,status,importance,breaking,featured,what_changed,verification_status,hero_image_url,hero_image_alt,hero_image_credit,published_at,created_at,updated_at" as const;
export const listFields =
  "id,slug,headline,subheadline,summary,category,status,importance,breaking,featured,what_changed,verification_status,hero_image_url,hero_image_alt,hero_image_credit,published_at,created_at,updated_at" as const;
export type StoryCard = Omit<Story, "body">;
export type Filters = {
  q?: string;
  category?: string;
  company?: string;
  model?: string;
  from?: string;
  to?: string;
  page?: number;
};
export type Trend = {
  id: string;
  name: string;
  slug: string;
  mentions: number;
};
function fail(error: { message: string } | null) {
  if (error) {
    console.error("Database query failed:", error.message);
    throw new Error("The newsroom could not be loaded. Please try again.");
  }
}

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!databaseConfigured()) return [];
  const { data, error } = await publicDatabase()
    .from("categories")
    .select("*")
    .order("sort_order");
  fail(error);
  return data ?? [];
});
export async function getStories(
  filters: Filters = {},
  size = 20,
): Promise<{ stories: StoryCard[]; count: number }> {
  if (!databaseConfigured()) return { stories: [], count: 0 };
  const db = publicDatabase();
  const validDate = (v: string | undefined) =>
    v &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v
      ? v
      : undefined;
  const from = validDate(filters.from),
    to = validDate(filters.to);
  const query = db
    .rpc(
      "search_stories",
      {
        search_query: filters.q?.slice(0, 200),
        category_slug: filters.category,
        company_slug: filters.company,
        model_slug: filters.model,
        date_from: from ? `${from}T00:00:00.000Z` : undefined,
        date_to: to ? `${to}T23:59:59.999Z` : undefined,
      },
      { count: "exact" },
    )
    .select(listFields);
  const page = Math.max(1, Math.min(filters.page || 1, 500));
  const { data, error, count } = await query
    .order("published_at", { ascending: false })
    .order("id")
    .range((page - 1) * size, page * size - 1);
  fail(error);
  return { stories: (data ?? []) as StoryCard[], count: count ?? 0 };
}
export const getStory = cache(
  async (slug: string): Promise<StoryDetail | null> => {
    if (!databaseConfigured()) return null;
    const { data, error } = await publicDatabase()
      .from("stories")
      .select(
        `${storyFields},sources(*),story_companies(companies(*)),story_models(models(*))`,
      )
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();
    fail(error);
    if (!data) return null;
    const row = data as unknown as Story & {
      sources: StoryDetail["sources"];
      story_companies: { companies: Company | null }[];
      story_models: { models: Model | null }[];
    };
    return {
      ...row,
      companies: row.story_companies.flatMap((x) =>
        x.companies ? [x.companies] : [],
      ),
      models: row.story_models.flatMap((x) => (x.models ? [x.models] : [])),
    };
  },
);
export const getCompanies = cache(async (q = ""): Promise<Company[]> => {
  if (!databaseConfigured()) return [];
  let query = publicDatabase()
    .from("companies")
    .select("*")
    .eq("status", "published")
    .order("name")
    .limit(100);
  if (q)
    query = query.ilike("name", `%${q.replace(/[%_]/g, "").slice(0, 100)}%`);
  const { data, error } = await query;
  fail(error);
  return data ?? [];
});
export const getModels = cache(async (q = "", companyId?: string): Promise<Model[]> => {
  if (!databaseConfigured()) return [];
  let query = publicDatabase()
    .from("models")
    .select("*")
    .eq("status", "published")
    .order("release_date", { ascending: false, nullsFirst: false })
    .order("name")
    .limit(100);
  if (companyId) query = query.eq("company_id", companyId);
  if (q)
    query = query.ilike("name", `%${q.replace(/[%_]/g, "").slice(0, 100)}%`);
  const { data, error } = await query;
  fail(error);
  return data ?? [];
});
export const getCompany = cache(async (slug: string) => {
  if (!databaseConfigured()) return null;
  const { data, error } = await publicDatabase()
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  fail(error);
  return data;
});
export const getModel = cache(async (slug: string) => {
  if (!databaseConfigured()) return null;
  const { data, error } = await publicDatabase()
    .from("models")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  fail(error);
  return data;
});
export async function getEvents(
  kind: "company_id" | "model_id",
  id: string,
): Promise<EntityEvent[]> {
  const { data, error } = await publicDatabase()
    .from("entity_events")
    .select("*")
    .eq(kind, id)
    .eq("status", "published")
    .order("occurred_at", { ascending: false })
    .limit(30);
  fail(error);
  return data ?? [];
}
export async function getBriefings(): Promise<Briefing[]> {
  if (!databaseConfigured()) return [];
  const { data, error } = await publicDatabase()
    .from("daily_briefings")
    .select("*")
    .eq("status", "published")
    .lte("briefing_date", new Date().toISOString().slice(0, 10))
    .order("briefing_date", { ascending: false })
    .limit(30);
  fail(error);
  return data ?? [];
}
export async function getBriefingStories(id: string): Promise<StoryCard[]> {
  const { data, error } = await publicDatabase()
    .from("briefing_stories")
    .select(`position,stories(${listFields})`)
    .eq("briefing_id", id)
    .order("position");
  fail(error);
  return ((data ?? []) as unknown as { stories: StoryCard | null }[]).flatMap(
    (x) => (x.stories ? [x.stories] : []),
  );
}
export async function getTrends(): Promise<{
  companies: Trend[];
  models: Trend[];
}> {
  if (!databaseConfigured()) return { companies: [], models: [] };
  const { data, error } = await publicDatabase().rpc("directory_trends");
  fail(error);
  return data as unknown as { companies: Trend[]; models: Trend[] };
}
