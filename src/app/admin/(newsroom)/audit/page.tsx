import { requireAdmin } from "@/lib/auth";
import { Pagination } from "@/components/archive";
export default async function AuditPage({
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
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((page - 1) * 50, page * 50 - 1);
  if (error) throw new Error("Unable to load the audit log.");
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Editorial audit</h1>
          <p className="muted">
            Append-only database activity. Null actors indicate controlled
            system or ingestion operations.
          </p>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time (UTC)</th>
              <th>Action</th>
              <th>Record type</th>
              <th>Record ID</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((log) => (
              <tr key={log.id}>
                <td>
                  {new Date(log.created_at)
                    .toISOString()
                    .replace("T", " ")
                    .slice(0, 19)}
                </td>
                <td>{log.action}</td>
                <td>{log.table_name}</td>
                <td>{log.record_id}</td>
                <td>{log.actor_id || "System"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        count={count || 0}
        size={50}
        path="/admin/audit"
      />
    </>
  );
}
