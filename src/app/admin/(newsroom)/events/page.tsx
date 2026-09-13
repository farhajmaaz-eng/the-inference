import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  ManagedForm,
  Field,
  SelectField,
  StatusSelect,
} from "@/components/admin/forms";
import { saveEventAction } from "@/app/admin/actions";
import { dateLabel } from "@/lib/format";
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; saved?: string }>;
}) {
  const { db } = await requireAdmin();
  const q = await searchParams;
  if (q.edit && q.edit !== "new" && !z.uuid().safeParse(q.edit).success)
    notFound();
  const [events, companies, models, stories] = await Promise.all([
    db
      .from("entity_events")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(200),
    db.from("companies").select("id,name").order("name"),
    db.from("models").select("id,name").order("name"),
    db
      .from("stories")
      .select("id,headline")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);
  if (events.error || companies.error || models.error || stories.error)
    throw new Error("Unable to load timelines.");
  const event = events.data?.find((e) => e.id === q.edit);
  if (q.edit && q.edit !== "new" && !event) notFound();
  return (
    <>
      <div className="admin-title">
        <h1>Company & model timelines</h1>
        <Link className="button" href="/admin/events?edit=new">
          Add event
        </Link>
      </div>
      {q.saved && (
        <p className="notice" role="status">
          Timeline event saved.
        </p>
      )}
      {q.edit ? (
        <ManagedForm action={saveEventAction} label="Save event">
          <input type="hidden" name="id" value={event?.id || ""} />
          <div className="form-grid">
            <Field
              label="Event title"
              name="title"
              value={event?.title}
              required
              wide
            />
            <Field
              label="Description"
              name="description"
              value={event?.description}
              rows={3}
              wide
            />
            <Field
              label="Occurred at (UTC)"
              name="occurred_at"
              type="datetime-local"
              value={event?.occurred_at?.slice(0, 16)}
              required
            />
            <Field
              label="Event type"
              name="event_type"
              value={event?.event_type || "release"}
              required
              hint="For example: release, price_change, acquisition, policy."
            />
            <SelectField
              label="Company"
              name="company_id"
              value={event?.company_id}
            >
              <option value="">None</option>
              {companies.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Model" name="model_id" value={event?.model_id}>
              <option value="">None</option>
              {models.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Related reporting"
              name="story_id"
              value={event?.story_id}
            >
              <option value="">None</option>
              {stories.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.headline}
                </option>
              ))}
            </SelectField>
            <Field
              label="Primary source URL"
              name="source_url"
              type="url"
              value={event?.source_url}
            />
            <StatusSelect value={event?.status} />
          </div>
        </ManagedForm>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {events.data?.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/admin/events?edit=${e.id}`}>{e.title}</Link>
                  </td>
                  <td>{dateLabel(e.occurred_at, true)}</td>
                  <td>{e.event_type}</td>
                  <td>
                    <span className={`status status-${e.status}`}>
                      {e.status}
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
