import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { ingestionSchema, type IngestionResult } from "./validation";
import { publicDatabase } from "./supabase";
import type { Json } from "./types";
export { ingestionSchema } from "./validation";
export type {
  StoryInput,
  SourceInput,
  CompanyReference,
  ModelReference,
  IngestionResult,
} from "./validation";
export const MAX_INGESTION_BYTES = 150_000;
export function authorizedBearer(
  header: string | null,
  expected: string | undefined,
) {
  if (
    !expected ||
    expected.length < 32 ||
    !header?.startsWith("Bearer ") ||
    header.length > 512
  )
    return false;
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(header.slice(7)), digest(expected));
}
export async function readBoundedJson(request: Request) {
  if (!request.body) throw new Error("empty_body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_INGESTION_BYTES) {
        await reader.cancel();
        throw new Error("body_too_large");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } finally {
    reader.releaseLock();
  }
}
export async function ingestValidated(
  input: unknown,
  apiToken: string,
): Promise<{
  result?: IngestionResult;
  error?: {
    status: number;
    code: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
}> {
  const parsed = ingestionSchema.safeParse(input);
  if (!parsed.success)
    return {
      error: {
        status: 422,
        code: "validation_failed",
        message: "The proposal does not meet newsroom validation rules.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
    };
  if (!parsed.data.story.sources.length)
    return {
      error: {
        status: 422,
        code: "sources_required",
        message: "Agent proposals require at least one traceable source.",
      },
    };
  // Enforce review before entering the database. The RPC independently enforces it.
  parsed.data.story.status = "review";
  const { data, error } = await publicDatabase().rpc("ingest_story", {
    payload: parsed.data as Json,
    api_token: apiToken,
  });
  if (error) {
    if (error.message.includes("rate limit"))
      return {
        error: {
          status: 429,
          code: "rate_limited",
          message: "Ingestion limit reached. Retry after one minute.",
        },
      };
    if (error.message.includes("Idempotency"))
      return {
        error: {
          status: 409,
          code: "idempotency_conflict",
          message:
            "This idempotency key belongs to a different request. Reuse the original payload or choose a new key.",
        },
      };
    if (error.code === "23505")
      return {
        error: {
          status: 409,
          code: "record_conflict",
          message:
            "A slug or event identifier is already in use. Check existing coverage.",
        },
      };
    if (error.code === "42501")
      return {
        error: {
          status: 401,
          code: "unauthorized",
          message: "The ingestion credential is invalid or expired.",
        },
      };
    console.error("Ingestion database rejection", { code: error.code });
    return {
      error: {
        status: 422,
        code: "database_rejected",
        message:
          "The database rejected the proposal. Check references, sources and field constraints.",
      },
    };
  }
  return { result: data as unknown as IngestionResult };
}
