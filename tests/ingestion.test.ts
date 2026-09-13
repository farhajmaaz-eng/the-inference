import { describe, it, expect, vi, beforeEach } from "vitest";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase", () => ({
  publicDatabase: () => ({ rpc }),
  databaseConfigured: () => true,
}));
import {
  authorizedBearer,
  readBoundedJson,
  ingestValidated,
  MAX_INGESTION_BYTES,
} from "@/lib/ingestion";
const story = {
  slug: "synthetic-ingestion",
  headline: "Synthetic ingestion validation story",
  summary: "This synthetic record tests the ingestion contract only.",
  body: "This is a synthetic fixture for validation and ingestion tests. It must never be published as real production reporting.",
  category: "agents",
  sources: [
    {
      source_name: "Test source",
      source_url: "https://example.org/source",
      source_type: "announcement",
      primary_source: true,
    },
  ],
  verification_status: "source_confirmed",
};
describe("Ingestion boundary", () => {
  beforeEach(() => rpc.mockReset());
  it("uses an exact, fail-closed bearer credential", () => {
    const key = "a".repeat(64);
    expect(authorizedBearer(`Bearer ${key}`, key)).toBe(true);
    expect(authorizedBearer(`Bearer ${key}x`, key)).toBe(false);
    expect(authorizedBearer(null, key)).toBe(false);
    expect(authorizedBearer("Bearer short", "short")).toBe(false);
    expect(authorizedBearer(`bearer ${key}`, key)).toBe(false);
  });
  it("bounds streaming bodies without Content-Length", async () => {
    const request = new Request("https://example.org", {
      method: "POST",
      body: "x".repeat(MAX_INGESTION_BYTES + 1),
    });
    await expect(readBoundedJson(request)).rejects.toThrow("body_too_large");
  });
  it("rejects invalid JSON", async () => {
    await expect(
      readBoundedJson(
        new Request("https://example.org", { method: "POST", body: "{" }),
      ),
    ).rejects.toThrow();
  });
  it("parses valid JSON", async () =>
    expect(
      await readBoundedJson(
        new Request("https://example.org", {
          method: "POST",
          body: '{"ok":true}',
        }),
      ),
    ).toEqual({ ok: true }));
  it("forces agent publication requests into review", async () => {
    rpc.mockResolvedValue({
      data: { status: "review", replayed: false },
      error: null,
    });
    await ingestValidated(
      {
        idempotency_key: "test-key-123",
        agent_name: "Test agent",
        story: { ...story, status: "published" },
      },
      "secret",
    );
    expect(rpc.mock.calls[0][1].payload.story.status).toBe("review");
  });
  it("does not call SQL on invalid data", async () => {
    const response = await ingestValidated(
      { story: { headline: "short" } },
      "secret",
    );
    expect(response.error?.status).toBe(422);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("maps idempotency conflicts without leaking database details", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "Idempotency key already used", code: "P0001" },
    });
    const response = await ingestValidated(
      { idempotency_key: "test-key-123", agent_name: "Test agent", story },
      "secret",
    );
    expect(response.error?.status).toBe(409);
  });
  it("returns a retryable rate limit", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "Ingestion rate limit exceeded", code: "P0001" },
    });
    const response = await ingestValidated(
      { idempotency_key: "test-key-123", agent_name: "Test agent", story },
      "secret",
    );
    expect(response.error?.status).toBe(429);
  });
});
