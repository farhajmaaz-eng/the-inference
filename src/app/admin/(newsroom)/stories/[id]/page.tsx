import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { editorData } from "@/lib/editorial";
import { requireAdmin } from "@/lib/auth";
import { StoryEditor } from "@/components/admin/story-editor";
import { storyInputSchema } from "@/lib/validation";
export default async function EditStoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; submission?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  if (id !== "new" && !z.uuid().safeParse(id).success) notFound();
  const data = await editorData(id === "new" ? undefined : id);
  if (id !== "new" && !data.story) notFound();
  let input = data.input;
  let submissionId: string | undefined;
  if (q.submission && z.uuid().safeParse(q.submission).success) {
    const { db } = await requireAdmin();
    const { data: submission } = await db
      .from("ingestion_submissions")
      .select("payload,status")
      .eq("id", q.submission)
      .maybeSingle();
    if (submission?.status === "pending") {
      submissionId = q.submission;
      if (id === "new") {
        const payload = submission.payload as { story?: unknown };
        const parsed = storyInputSchema.safeParse(payload?.story);
        if (parsed.success) input = { ...parsed.data, status: "review" };
      }
    }
  }
  return (
    <>
      <div className="admin-title">
        <h1>{id === "new" ? "New story" : "Edit story"}</h1>
        {data.story && (
          <Link
            className="button secondary"
            href={`/admin/stories/${id}/preview`}
            target="_blank"
          >
            Preview saved version <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>
      {q.saved && (
        <p className="notice" role="status">
          Story saved.{" "}
          {data.story?.status === "published"
            ? "The public edition now reflects this record."
            : "This story is private."}
        </p>
      )}
      {submissionId && (
        <p className="notice">
          Editing an AI proposal. If this is duplicate coverage, open the
          existing story from the queue and incorporate only verified new
          material. Saving a published story completes the review.
        </p>
      )}
      <StoryEditor
        id={id === "new" ? undefined : id}
        initial={input}
        companies={data.companies}
        models={data.models}
        categories={data.categories}
        submissionId={submissionId}
      />
    </>
  );
}
