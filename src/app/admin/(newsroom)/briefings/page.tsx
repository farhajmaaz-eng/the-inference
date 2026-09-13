import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ManagedForm, Field, StatusSelect } from "@/components/admin/forms";
import { BriefOrder } from "@/components/admin/brief-order";
import { saveBriefingAction } from "@/app/admin/actions";
import { dateLabel } from "@/lib/format";
export default async function BriefingsAdmin({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; saved?: string }>;
}) {
  const { db } = await requireAdmin();
  const q = await searchParams;
  if (q.edit && q.edit !== "new" && !z.uuid().safeParse(q.edit).success)
    notFound();
  const [briefs, stories] = await Promise.all([
    db
      .from("daily_briefings")
      .select("*")
      .order("briefing_date", { ascending: false })
      .limit(100),
    db
      .from("stories")
      .select("id,headline,status")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);
  if (briefs.error || stories.error)
    throw new Error("Unable to load briefings.");
  const brief = briefs.data?.find((b) => b.id === q.edit);
  if (q.edit && q.edit !== "new" && !brief) notFound();
  const { data: links, error } = brief
    ? await db
        .from("briefing_stories")
        .select("story_id")
        .eq("briefing_id", brief.id)
        .order("position")
    : { data: [], error: null };
  if (error) throw new Error("Unable to load the reading list.");
  return (
    <>
      <div className="admin-title">
        <h1>Daily briefings</h1>
        <Link className="button" href="/admin/briefings?edit=new">
          Create briefing
        </Link>
      </div>
      {q.saved && (
        <p className="notice" role="status">
          Briefing saved.
        </p>
      )}
      {q.edit ? (
        <ManagedForm action={saveBriefingAction} label="Save briefing">
          <input type="hidden" name="id" value={brief?.id || ""} />
          <div className="form-grid">
            <Field
              label="Title"
              name="title"
              value={brief?.title}
              required
              wide
            />
            <Field label="Slug" name="slug" value={brief?.slug} required />
            <Field
              label="Edition date (UTC)"
              name="briefing_date"
              type="date"
              value={
                brief?.briefing_date || new Date().toISOString().slice(0, 10)
              }
              required
            />
            <Field
              label="Introduction"
              name="introduction"
              value={brief?.introduction}
              rows={3}
              wide
              required
            />
            <StatusSelect value={brief?.status} />
          </div>
          <BriefOrder
            stories={stories.data || []}
            initial={links?.map((l) => l.story_id) || []}
          />
        </ManagedForm>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Edition</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {briefs.data?.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link href={`/admin/briefings?edit=${b.id}`}>
                      {b.title}
                    </Link>
                  </td>
                  <td>{dateLabel(b.briefing_date, true)}</td>
                  <td>
                    <span className={`status status-${b.status}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
