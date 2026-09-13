import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ReviewActions } from "@/components/admin/review-actions";
import { Verification, WhatChanged } from "@/components/news";
import { dateLabel } from "@/lib/format";
import { storyInputSchema } from "@/lib/validation";
import { Pagination } from "@/components/archive";
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { db } = await requireAdmin();
  const page = Math.max(
    1,
    Number.parseInt((await searchParams).page || "1") || 1,
  );
  const { data, error, count } = await db
    .from("ingestion_submissions")
    .select("*", { count: "exact" })
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);
  if (error) throw new Error("Unable to load the review queue.");
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>AI ingestion review</h1>
          <p className="muted">
            {count || 0} pending proposals. Verify the evidence before
            publishing.
          </p>
        </div>
      </div>
      {data?.map((sub) => {
        const parsed = storyInputSchema.safeParse(
          (sub.payload as { story?: unknown })?.story,
        );
        if (!parsed.success)
          return (
            <article key={sub.id} className="queue-item">
              <h2>Proposal requires repair</h2>
              <p>
                The stored proposal does not match the current validation rules.
              </p>
              <ReviewActions id={sub.id} canPublish={false} />
            </article>
          );
        const s = parsed.data;
        const duplicates = (sub.duplicate_candidates || []) as {
          id: string;
          headline: string;
          reason: string;
        }[];
        return (
          <article key={sub.id} className="queue-item">
            <div className="queue-meta">
              {sub.agent_name} · {dateLabel(sub.created_at, true)} ·{" "}
              <span className="status status-pending">
                {duplicates.length ? "Possible duplicate" : "Review"}
              </span>
            </div>
            <h2>{s.headline}</h2>
            <Verification state={s.verification_status} />
            <p>{s.summary}</p>
            <WhatChanged changes={s.what_changed} compact />
            {duplicates.length > 0 && (
              <div className="notice">
                <strong>Possible matches</strong>
                <ul>
                  {duplicates.map((d) => (
                    <li key={d.id}>
                      <Link
                        href={`/admin/stories/${d.id}?submission=${sub.id}`}
                      >
                        {d.headline} <ArrowRight size={14} aria-hidden="true" /> Update this story
                      </Link>
                      <div className="queue-meta">{d.reason}</div>
                    </li>
                  ))}
                </ul>
                <p className="field-hint">
                  Open an existing story to merge verified new material, or open
                  the proposal as a separate story if it is genuinely a
                  different event.
                </p>
              </div>
            )}
            <details>
              <summary>Sources, entities & proposed report</summary>
              <ul>
                {s.sources.map((source, i) => (
                  <li key={i}>
                    <span className="status">
                      {source.primary_source ? "Primary" : "Secondary"}
                    </span>{" "}
                    <a
                      href={source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source.source_name} <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                    <p className="queue-meta">{source.source_url}</p>
                  </li>
                ))}
              </ul>
              <p>
                <strong>Companies:</strong>{" "}
                {s.companies.map((c) => c.name).join(", ") || "None"}
              </p>
              <p>
                <strong>Models:</strong>{" "}
                {s.models.map((m) => m.name).join(", ") || "None"}
              </p>
              <div style={{ whiteSpace: "pre-wrap" }}>{s.body}</div>
            </details>
            <p>
              <Link
                className="text-link"
                href={`/admin/stories/${sub.story_id || "new"}?submission=${sub.id}`}
              >
                Edit proposal <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </p>
            <ReviewActions
              id={sub.id}
              canPublish={
                Boolean(sub.story_id) &&
                s.verification_status !== "unverified" &&
                !duplicates.length
              }
            />
          </article>
        );
      })}
      {!data?.length && (
        <p className="notice">
          The review queue is clear. New agent proposals will appear here
          automatically.
        </p>
      )}
      <Pagination page={page} count={count || 0} path="/admin/review" />
    </>
  );
}
