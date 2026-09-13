"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { sessionDatabase, databaseConfigured } from "@/lib/supabase";
import {
  storyInputSchema,
  slugSchema,
  safeUrl,
  modelReferenceSchema,
  companyReferenceSchema,
} from "@/lib/validation";
import type { Json } from "@/lib/types";
export type ActionState = { error?: string; success?: string };
const text = (f: FormData, key: string) => String(f.get(key) ?? "").trim();
const nullable = (f: FormData, key: string) => text(f, key) || null;
const timestamp = (f: FormData, key: string) =>
  text(f, key)
    ? new Date(
        `${text(f, key)}${/[zZ]|[+-]\\d{2}:\\d{2}$/.test(text(f, key)) ? "" : "Z"}`,
      ).toISOString()
    : null;
const idSchema = z.uuid();
function validationError(error: z.ZodError) {
  return error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join(" → ")}: ${i.message}`)
    .join(" · ");
}
function databaseError(code: string) {
  return code === "23505"
    ? "This slug, event identifier, or date is already in use. Choose a unique value or edit the existing record."
    : code === "23503"
      ? "A linked record no longer exists. Reload the editor and check your selections."
      : "The record could not be saved. Check the sources, verification state, and required fields, then try again.";
}
export async function loginAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!databaseConfigured())
    return { error: "The newsroom database is not configured." };
  const input = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(200) })
    .safeParse({
      email: text(form, "email"),
      password: String(form.get("password") ?? ""),
    });
  if (!input.success)
    return { error: "Enter your email address and password." };
  const db = await sessionDatabase();
  const { error } = await db.auth.signInWithPassword(input.data);
  if (error)
    return {
      error: "Unable to sign in. Check your credentials or try again later.",
    };
  const { data: admin } = await db.rpc("is_admin");
  if (!admin) {
    await db.auth.signOut();
    return {
      error:
        "This account does not have newsroom access. Contact the project owner.",
    };
  }
  redirect("/admin");
}
export async function logoutAction() {
  const db = await sessionDatabase();
  await db.auth.signOut();
  redirect("/admin/login");
}
export async function changePasswordAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db, user } = await requireAdmin();
  const password = String(form.get("new_password") || "");
  if (password.length < 12 || password.length > 200)
    return { error: "Use a password between 12 and 200 characters." };
  const { error: check } = await db.auth.signInWithPassword({
    email: user.email!,
    password: String(form.get("current_password") || ""),
  });
  if (check) return { error: "The current password could not be verified." };
  const { error } = await db.auth.updateUser({ password });
  if (error)
    return {
      error:
        "The password could not be updated. Try a different password or retry shortly.",
    };
  await db.auth.signOut({ scope: "others" });
  return { success: "Password updated. Other sessions have been signed out." };
}
export async function saveStoryAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db } = await requireAdmin();
  const id = nullable(form, "id");
  if (id && !idSchema.safeParse(id).success)
    return { error: "Invalid story identifier." };
  let raw: unknown;
  try {
    raw = {
      slug: text(form, "slug"),
      headline: text(form, "headline"),
      subheadline: nullable(form, "subheadline"),
      summary: text(form, "summary"),
      body: text(form, "body"),
      category: text(form, "category"),
      status: text(form, "status"),
      importance: Number(text(form, "importance")),
      breaking: form.has("breaking"),
      featured: form.has("featured"),
      what_changed: text(form, "what_changed")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      verification_status: text(form, "verification_status"),
      hero_image_url: nullable(form, "hero_image_url"),
      hero_image_alt: nullable(form, "hero_image_alt"),
      hero_image_credit: nullable(form, "hero_image_credit"),
      published_at: timestamp(form, "published_at"),
      sources: JSON.parse(text(form, "sources") || "[]"),
      companies: [],
      models: [],
      event_key: nullable(form, "event_key"),
      internal_notes: text(form, "internal_notes"),
    };
  } catch {
    return { error: "Check the source entries and publication date." };
  }
  const parsed = storyInputSchema.safeParse(raw);
  if (!parsed.success) return { error: validationError(parsed.error) };
  const companyIds = form.getAll("company_ids").map(String);
  const modelIds = form.getAll("model_ids").map(String);
  if (
    !z.array(idSchema).max(20).safeParse(companyIds).success ||
    !z.array(idSchema).max(20).safeParse(modelIds).success
  )
    return { error: "Select up to 20 valid companies and models." };
  const [companies, models, allCompanies] = await Promise.all([
    companyIds.length
      ? db.from("companies").select("*").in("id", companyIds)
      : Promise.resolve({ data: [], error: null }),
    modelIds.length
      ? db.from("models").select("*").in("id", modelIds)
      : Promise.resolve({ data: [], error: null }),
    modelIds.length
      ? db.from("companies").select("id,slug")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (companies.error || models.error || allCompanies.error)
    return { error: "Unable to validate related records. Try again." };
  parsed.data.companies = (companies.data ?? []).map((c) =>
    companyReferenceSchema.parse({
      name: c.name,
      slug: c.slug,
      description: c.description,
      website: c.website,
    }),
  );
  parsed.data.models = (models.data ?? []).map((m) =>
    modelReferenceSchema.parse({
      name: m.name,
      slug: m.slug,
      company_slug:
        allCompanies.data?.find((c) => c.id === m.company_id)?.slug ?? null,
    }),
  );
  const submission = nullable(form, "submission_id");
  if (submission && !idSchema.safeParse(submission).success)
    return { error: "Invalid submission identifier." };
  const { data, error } = submission
    ? await db.rpc("save_reviewed_story", {
        payload: parsed.data as Json,
        target_id: id || undefined,
        submission_id: submission,
      })
    : await db.rpc("save_story", {
        payload: parsed.data as Json,
        target_id: id || undefined,
      });
  if (error) return { error: databaseError(error.code) };
  revalidatePath("/", "layout");
  redirect(`/admin/stories/${data}?saved=1`);
}
export async function reviewAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db } = await requireAdmin();
  const id = text(form, "id"),
    decision = text(form, "decision");
  if (
    !idSchema.safeParse(id).success ||
    !["publish", "reject", "archive"].includes(decision)
  )
    return { error: "Invalid review action." };
  const { error } = await db.rpc("review_submission", {
    submission_id: id,
    decision,
  });
  if (error)
    return {
      error:
        "This proposal cannot be processed. It may already be reviewed, lack verified sources, or have unresolved duplicates. Open the editor to resolve it.",
    };
  revalidatePath("/", "layout");
  return {
    success: `Proposal ${decision === "publish" ? "published" : decision === "reject" ? "rejected" : "archived"}.`,
  };
}
const optionalNumber = (f: FormData, key: string) =>
  text(f, key) === "" ? null : Number(text(f, key));
const optionalBoolean = (f: FormData, key: string) =>
  text(f, key) === "" ? null : text(f, key) === "true";
export async function saveEntityAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db } = await requireAdmin();
  const kind = text(form, "kind"),
    id = nullable(form, "id");
  if (
    !["companies", "models"].includes(kind) ||
    (id && !idSchema.safeParse(id).success)
  )
    return { error: "Invalid entity." };
  const common = z
    .object({
      name: z.string().min(1).max(160),
      slug: slugSchema,
      description: z.string().max(3000).nullable(),
      website: safeUrl.nullable(),
      status: z.enum(["draft", "published", "archived"]),
    })
    .safeParse({
      name: text(form, "name"),
      slug: text(form, "slug"),
      description: nullable(form, "description"),
      website: nullable(form, "website"),
      status: text(form, "status"),
    });
  if (!common.success) return { error: validationError(common.error) };
  if (kind === "companies") {
    const extra = z
      .object({
        logo_url: safeUrl.nullable(),
        headquarters: z.string().max(200).nullable(),
        founded_year: z
          .number()
          .int()
          .min(1600)
          .max(new Date().getUTCFullYear())
          .nullable(),
      })
      .safeParse({
        logo_url: nullable(form, "logo_url"),
        headquarters: nullable(form, "headquarters"),
        founded_year: optionalNumber(form, "founded_year"),
      });
    if (!extra.success) return { error: validationError(extra.error) };
    const query = id
      ? db
          .from("companies")
          .update({ ...common.data, ...extra.data })
          .eq("id", id)
      : db.from("companies").insert({ ...common.data, ...extra.data });
    const { error } = await query;
    if (error) return { error: databaseError(error.code) };
  } else {
    const extra = modelReferenceSchema.safeParse({
      name: common.data.name,
      slug: common.data.slug,
      release_date: nullable(form, "release_date"),
      model_type: nullable(form, "model_type"),
      context_window: optionalNumber(form, "context_window"),
      input_price_per_million: optionalNumber(form, "input_price_per_million"),
      output_price_per_million: optionalNumber(
        form,
        "output_price_per_million",
      ),
      pricing_notes: nullable(form, "pricing_notes"),
      api_available: optionalBoolean(form, "api_available"),
      open_weights: optionalBoolean(form, "open_weights"),
      license: nullable(form, "license"),
    });
    if (!extra.success) return { error: validationError(extra.error) };
    const companyId = nullable(form, "company_id");
    if (companyId && !idSchema.safeParse(companyId).success)
      return { error: "Select a valid developer." };
    const { company_slug: unused, ...model } = extra.data;
    void unused;
    const payload = { ...model, ...common.data, company_id: companyId };
    const query = id
      ? db.from("models").update(payload).eq("id", id)
      : db.from("models").insert(payload);
    const { error } = await query;
    if (error) return { error: databaseError(error.code) };
  }
  revalidatePath("/", "layout");
  redirect(`/admin/entities?kind=${kind}&saved=1`);
}
export async function saveBriefingAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db } = await requireAdmin();
  const id = nullable(form, "id");
  if (id && !idSchema.safeParse(id).success)
    return { error: "Invalid briefing." };
  const parsed = z
    .object({
      slug: slugSchema,
      title: z.string().min(3).max(200),
      introduction: z.string().min(10).max(3000),
      briefing_date: z.iso.date(),
      status: z.enum(["draft", "review", "published", "archived"]),
      story_ids: z.array(idSchema).max(30),
    })
    .safeParse({
      slug: text(form, "slug"),
      title: text(form, "title"),
      introduction: text(form, "introduction"),
      briefing_date: text(form, "briefing_date"),
      status: text(form, "status"),
      story_ids: form.getAll("story_ids").map(String),
    });
  if (!parsed.success) return { error: validationError(parsed.error) };
  const { error } = await db.rpc("save_briefing", {
    payload: parsed.data,
    target_id: id || undefined,
  });
  if (error) return { error: databaseError(error.code) };
  revalidatePath("/", "layout");
  redirect("/admin/briefings?saved=1");
}
export async function saveEventAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db } = await requireAdmin();
  let occurred: string | null;
  try {
    occurred = timestamp(form, "occurred_at");
  } catch {
    return { error: "Enter a valid event date." };
  }
  const parsed = z
    .object({
      id: z.uuid().optional(),
      title: z.string().min(3).max(240),
      description: z.string().max(3000).nullable(),
      company_id: idSchema.nullable(),
      model_id: idSchema.nullable(),
      story_id: idSchema.nullable(),
      event_type: z.string().min(2).max(80),
      occurred_at: z.iso.datetime(),
      source_url: safeUrl.nullable(),
      status: z.enum(["draft", "review", "published", "archived"]),
    })
    .refine((p) => p.company_id || p.model_id, {
      message: "Associate at least one company or model.",
    })
    .safeParse({
      id: nullable(form, "id") || undefined,
      title: text(form, "title"),
      description: nullable(form, "description"),
      company_id: nullable(form, "company_id"),
      model_id: nullable(form, "model_id"),
      story_id: nullable(form, "story_id"),
      event_type: text(form, "event_type"),
      occurred_at: occurred,
      source_url: nullable(form, "source_url"),
      status: text(form, "status"),
    });
  if (!parsed.success) return { error: validationError(parsed.error) };
  const { error } = await db.from("entity_events").upsert(parsed.data);
  if (error) return { error: databaseError(error.code) };
  revalidatePath("/", "layout");
  redirect("/admin/events?saved=1");
}
