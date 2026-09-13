import "server-only";
import { requireAdmin } from "./auth";
import { storyInputSchema, type StoryInput } from "./validation";
import type { Story, Source, Company, Model, StoryDetail } from "./types";
export async function editorData(id?: string) {
  const { db } = await requireAdmin();
  const [companies, models, categories, record] = await Promise.all([
    db.from("companies").select("*").order("name"),
    db.from("models").select("*").order("name"),
    db.from("categories").select("*").order("sort_order"),
    id
      ? db
          .from("stories")
          .select(
            "*,sources(*),story_companies(companies(*)),story_models(models(*)),story_editorial(*)",
          )
          .eq("id", id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (companies.error || models.error || categories.error || record.error)
    throw new Error("The editor could not load its records.");
  const row = record.data as unknown as
    | (Story & {
        sources: Source[];
        story_companies: { companies: Company }[];
        story_models: { models: Model }[];
        story_editorial: {
          internal_notes: string;
          event_key: string | null;
        } | null;
      })
    | null;
  const story: StoryDetail | null = row
    ? {
        ...row,
        companies: row.story_companies.map((x) => x.companies),
        models: row.story_models.map((x) => x.models),
      }
    : null;
  const input: StoryInput | null = row
    ? storyInputSchema.parse({
        ...Object.fromEntries(
          Object.entries(row).filter(
            ([k]) =>
              ![
                "id",
                "created_at",
                "updated_at",
                "search_document",
                "sources",
                "story_companies",
                "story_models",
                "story_editorial",
              ].includes(k),
          ),
        ),
        sources: row.sources.map(
          ({
            source_name,
            source_url,
            author,
            source_type,
            primary_source,
            published_at,
          }) => ({
            source_name,
            source_url,
            author,
            source_type,
            primary_source,
            published_at,
          }),
        ),
        companies: row.story_companies.map(({ companies: c }) => ({
          slug: c.slug,
          name: c.name,
          description: c.description,
          website: c.website,
        })),
        models: row.story_models.map(({ models: m }) => ({
          slug: m.slug,
          name: m.name,
          company_slug:
            companies.data?.find((c) => c.id === m.company_id)?.slug ?? null,
        })),
        internal_notes: row.story_editorial?.internal_notes || "",
        event_key: row.story_editorial?.event_key || null,
      })
    : null;
  return {
    story,
    input,
    companies: companies.data ?? [],
    models: models.data ?? [],
    categories: categories.data ?? [],
  };
}
