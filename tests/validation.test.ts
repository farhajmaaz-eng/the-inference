import { describe, it, expect } from "vitest";
import {
  storyInputSchema,
  ingestionSchema,
  normalizeSourceUrl,
  safeUrl,
  modelReferenceSchema,
} from "@/lib/validation";
import { knownBoolean, money } from "@/lib/format";
import { jsonLd } from "@/lib/seo";
export const proposal = {
  slug: "synthetic-test-proposal",
  headline: "Synthetic newsroom validation proposal",
  summary: "This is synthetic test content, not a production news article.",
  body: "This synthetic test report exists only to exercise validation. It is never used as the site's production article database.",
  category: "models",
  sources: [
    {
      source_name: "Synthetic primary source",
      source_url: "https://example.org/announcement",
      source_type: "announcement",
      primary_source: true,
    },
  ],
};
describe("Editorial validation", () => {
  it("defaults agent proposals to private review", () => {
    const p = ingestionSchema.parse({
      idempotency_key: "test-key-12345",
      agent_name: "Test agent",
      story: proposal,
    });
    expect(p.story.status).toBe("review");
    expect(p.story.verification_status).toBe("unverified");
  });
  it("rejects unknown fields", () =>
    expect(
      storyInputSchema.safeParse({ ...proposal, admin: true }).success,
    ).toBe(false));
  it("requires primary evidence for source-confirmed reporting", () =>
    expect(
      storyInputSchema.safeParse({
        ...proposal,
        sources: [],
        verification_status: "source_confirmed",
      }).success,
    ).toBe(false));
  it("blocks unverified publication", () =>
    expect(
      storyInputSchema.safeParse({ ...proposal, status: "published" }).success,
    ).toBe(false));
  it("requires two domains for corroboration", () =>
    expect(
      storyInputSchema.safeParse({
        ...proposal,
        verification_status: "corroborated",
      }).success,
    ).toBe(false));
  it("accepts qualified publication with independent domains", () =>
    expect(
      storyInputSchema.safeParse({
        ...proposal,
        status: "published",
        verification_status: "corroborated",
        sources: [
          ...proposal.sources,
          {
            source_name: "Synthetic secondary source",
            source_url: "https://example.net/report",
            source_type: "reporting",
            primary_source: false,
          },
        ],
      }).success,
    ).toBe(true));
  it("normalizes tracking parameters before duplicate checking", () =>
    expect(
      normalizeSourceUrl(
        "https://example.org/news/?utm_source=test&b=2&a=1#heading",
      ),
    ).toBe("https://example.org/news?a=1&b=2"));
  it("rejects repeated normalized sources", () =>
    expect(
      storyInputSchema.safeParse({
        ...proposal,
        sources: [
          ...proposal.sources,
          {
            ...proposal.sources[0],
            source_url: "https://example.org/announcement?utm_campaign=other",
          },
        ],
      }).success,
    ).toBe(false));
  it.each([
    "http://example.org",
    "javascript:alert(1)",
    "https://localhost/a",
    "https://127.0.0.1/a",
    "https://10.1.2.3/a",
    "https://192.168.1.2/a",
    "https://169.254.169.254/a",
    "https://[::1]/a",
    "https://user:pass@example.org/a",
  ])("rejects unsafe URL %s", (url) =>
    expect(safeUrl.safeParse(url).success).toBe(false),
  );
  it("requires accessible image descriptions", () =>
    expect(
      storyInputSchema.safeParse({
        ...proposal,
        hero_image_url: "https://example.org/photo.jpg",
      }).success,
    ).toBe(false));
  it("limits importance and change bullets", () =>
    expect(
      storyInputSchema.safeParse({
        ...proposal,
        importance: 6,
        what_changed: Array(9).fill("Synthetic change"),
      }).success,
    ).toBe(false));
  it("preserves unknown model specifications", () => {
    const m = modelReferenceSchema.parse({
      name: "Synthetic model",
      slug: "synthetic-model",
    });
    expect(m.context_window).toBeNull();
    expect(m.api_available).toBeNull();
    expect(m.open_weights).toBeNull();
  });
  it("distinguishes unknown, false, and free", () => {
    expect(knownBoolean(null)).toBe("Not disclosed");
    expect(knownBoolean(false)).toBe("Unavailable");
    expect(money(0)).toBe("$0");
    expect(money(null)).toBe("Not disclosed");
  });
  it("escapes structured-data script termination", () =>
    expect(
      jsonLd({ headline: "</script><script>alert(1)</script>" }),
    ).not.toContain("<"));
});
