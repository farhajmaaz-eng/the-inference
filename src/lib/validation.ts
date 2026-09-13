import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(160)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase words separated by hyphens.",
  );
export const safeUrl = z
  .url()
  .max(2048)
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !/^(localhost|127\.|0\.|\[|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(
        url.hostname,
      )
    );
  }, "Enter a public HTTPS URL without credentials.");
export function normalizeSourceUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()])
    if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}
export const sourceInputSchema = z
  .object({
    source_name: z.string().trim().min(2).max(120),
    source_url: safeUrl.transform(normalizeSourceUrl),
    author: z.string().trim().max(160).nullable().default(null),
    source_type: z.enum([
      "announcement",
      "paper",
      "documentation",
      "repository",
      "filing",
      "reporting",
      "other",
    ]),
    primary_source: z.boolean().default(false),
    published_at: z.iso.datetime({ offset: true }).nullable().default(null),
  })
  .strict();
export const companyReferenceSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1).max(120),
    description: z.string().max(3000).nullable().default(null),
    website: safeUrl.nullable().default(null),
  })
  .strict();
export const modelReferenceSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1).max(160),
    company_slug: slugSchema.nullable().default(null),
    description: z.string().max(3000).nullable().default(null),
    release_date: z.iso.date().nullable().default(null),
    model_type: z.string().max(100).nullable().default(null),
    context_window: z
      .number()
      .int()
      .positive()
      .max(1_000_000_000)
      .nullable()
      .default(null),
    input_price_per_million: z
      .number()
      .nonnegative()
      .max(1_000_000)
      .nullable()
      .default(null),
    output_price_per_million: z
      .number()
      .nonnegative()
      .max(1_000_000)
      .nullable()
      .default(null),
    pricing_notes: z.string().max(2000).nullable().default(null),
    api_available: z.boolean().nullable().default(null),
    open_weights: z.boolean().nullable().default(null),
    website: safeUrl.nullable().default(null),
    license: z.string().max(200).nullable().default(null),
  })
  .strict();
export const storyInputSchema = z
  .object({
    slug: slugSchema,
    headline: z.string().trim().min(12).max(240),
    subheadline: z.string().trim().max(500).nullable().default(null),
    summary: z.string().trim().min(30).max(2000),
    body: z.string().trim().min(80).max(100_000),
    category: slugSchema,
    status: z
      .enum(["draft", "review", "published", "archived"])
      .default("review"),
    importance: z.number().int().min(1).max(5).default(3),
    breaking: z.boolean().default(false),
    featured: z.boolean().default(false),
    what_changed: z.array(z.string().trim().min(5).max(300)).max(8).default([]),
    verification_status: z
      .enum(["unverified", "source_confirmed", "corroborated", "disputed"])
      .default("unverified"),
    hero_image_url: safeUrl.nullable().default(null),
    hero_image_alt: z.string().max(300).nullable().default(null),
    hero_image_credit: z.string().max(300).nullable().default(null),
    published_at: z.iso.datetime({ offset: true }).nullable().default(null),
    sources: z.array(sourceInputSchema).max(30).default([]),
    companies: z.array(companyReferenceSchema).max(20).default([]),
    models: z.array(modelReferenceSchema).max(20).default([]),
    event_key: z.string().trim().min(5).max(200).nullable().default(null),
    internal_notes: z.string().max(10_000).default(""),
  })
  .strict()
  .superRefine((story, ctx) => {
    const primary = story.sources.some((s) => s.primary_source);
    if (story.verification_status === "source_confirmed" && !primary)
      ctx.addIssue({
        code: "custom",
        path: ["sources"],
        message: "Source-confirmed reporting requires a primary source.",
      });
    if (
      story.verification_status === "corroborated" &&
      (!primary ||
        new Set(story.sources.map((s) => new URL(s.source_url).hostname)).size <
          2)
    )
      ctx.addIssue({
        code: "custom",
        path: ["sources"],
        message:
          "Corroborated reporting requires a primary source and at least two source domains.",
      });
    if (
      story.status === "published" &&
      (story.sources.length === 0 || story.verification_status === "unverified")
    )
      ctx.addIssue({
        code: "custom",
        path: ["status"],
        message:
          "Publication requires sources and a reviewed verification state.",
      });
    if (story.hero_image_url && !story.hero_image_alt)
      ctx.addIssue({
        code: "custom",
        path: ["hero_image_alt"],
        message: "Add alternative text for the image.",
      });
    if (
      new Set(story.sources.map((s) => s.source_url)).size !==
      story.sources.length
    )
      ctx.addIssue({
        code: "custom",
        path: ["sources"],
        message: "Remove repeated source URLs.",
      });
  });
export const ingestionSchema = z
  .object({
    idempotency_key: z.string().min(8).max(160),
    agent_name: z.string().min(2).max(120),
    story: storyInputSchema,
  })
  .strict();
export type StoryInput = z.infer<typeof storyInputSchema>;
export type SourceInput = z.infer<typeof sourceInputSchema>;
export type CompanyReference = z.infer<typeof companyReferenceSchema>;
export type ModelReference = z.infer<typeof modelReferenceSchema>;
export interface IngestionResult {
  submission_id: string;
  story_id: string | null;
  status: "review" | "duplicate";
  duplicate_candidates: { id: string; headline: string; reason: string }[];
  replayed: boolean;
}
