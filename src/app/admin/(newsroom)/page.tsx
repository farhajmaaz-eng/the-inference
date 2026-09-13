import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { dateLabel } from "@/lib/format";
import { Pagination } from "@/components/archive";
export default async function NewsroomPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  const { db } = await requireAdmin();
  const params = await searchParams;
  const status = ["draft", "review", "published", "archived"].includes(
    params.status || "",
  )
    ? params.status
    : null;
  const page = Math.max(
    1,
    Math.min(500, Number.parseInt(params.page || "1") || 1),
  );
  let query = db
    .from("stories")
    .select("id,headline,status,category,updated_at,verification_status", {
      count: "exact",
    })
    .order("updated_at", { ascending: false });
  if (status)
    query = query.eq("status", status as import("@/lib/types").StoryStatus);
  if (params.q)
    query = query.ilike(
      "headline",
      `%${params.q.replace(/[%_]/g, "").slice(0, 150)}%`,
    );
  const {
    data: stories,
    error,
    count,
  } = await query.range((page - 1) * 30, page * 30 - 1);
  if (error) throw new Error("Unable to load newsroom stories.");
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Story desk</h1>
          <p className="muted">
            {count ?? 0} stories · Published records update the public edition
            immediately.
          </p>
        </div>
        <Link className="button" href="/admin/stories/new">
          Create story
        </Link>
      </div>
      <nav className="admin-nav" aria-label="Story status">
        {["all", "review", "draft", "published", "archived"].map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin" : `/admin?status=${s}`}
            aria-current={(status || "all") === s ? "page" : undefined}
          >
            {s[0].toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </nav>
      <form className="search-form">
        <input type="hidden" name="status" value={status || ""} />
        <label className="sr-only" htmlFor="admin-query">
          Search headlines
        </label>
        <input
          id="admin-query"
          name="q"
          defaultValue={params.q}
          placeholder="Search all editorial headlines…"
        />
        <button className="button secondary">Search</button>
      </form>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Headline</th>
              <th>Status</th>
              <th>Desk</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {stories?.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/admin/stories/${s.id}`}>{s.headline}</Link>
                </td>
                <td>
                  <span className={`status status-${s.status}`}>
                    {s.status}
                  </span>
                </td>
                <td>{s.category}</td>
                <td>{dateLabel(s.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!stories?.length && (
        <p className="notice" style={{ marginTop: 20 }}>
          No stories match this view. Create a story or check the AI review
          queue.
        </p>
      )}
      <Pagination
        page={page}
        count={count || 0}
        size={30}
        path="/admin"
        filters={{ q: params.q, ...(status ? { status } : {}) }}
      />
    </>
  );
}
