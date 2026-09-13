import {
  authorizedBearer,
  readBoundedJson,
  ingestValidated,
} from "@/lib/ingestion";
import { databaseConfigured } from "@/lib/supabase";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const json = (
  body: unknown,
  status: number,
  extra: Record<string, string> = {},
) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...extra,
    },
  });
export async function POST(request: Request) {
  const token = process.env.INGESTION_API_KEY;
  if (!token || !databaseConfigured())
    return json(
      {
        error: { code: "unavailable", message: "Ingestion is not configured." },
      },
      503,
    );
  if (!authorizedBearer(request.headers.get("authorization"), token))
    return json(
      {
        error: {
          code: "unauthorized",
          message: "A valid ingestion credential is required.",
        },
      },
      401,
    );
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return json(
      {
        error: {
          code: "unsupported_media_type",
          message: "Send application/json.",
        },
      },
      415,
    );
  let input: unknown;
  try {
    input = await readBoundedJson(request);
  } catch (error) {
    return json(
      {
        error: {
          code:
            error instanceof Error && error.message === "body_too_large"
              ? "body_too_large"
              : "invalid_json",
          message: "Send valid JSON under 150 KB.",
        },
      },
      error instanceof Error && error.message === "body_too_large" ? 413 : 400,
    );
  }
  try {
    const { result, error } = await ingestValidated(input, token);
    if (error)
      return json(
        { error },
        error.status,
        error.status === 429 ? { "Retry-After": "60" } : {},
      );
    return json(result, result?.replayed ? 200 : 201);
  } catch {
    console.error("Ingestion transport failure");
    return json(
      {
        error: {
          code: "unavailable",
          message:
            "The newsroom database is unavailable. Retry with the same idempotency key.",
        },
      },
      503,
    );
  }
}
