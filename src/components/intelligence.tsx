import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { dateLabel } from "@/lib/format";
import type { EntityEvent, Model, Company } from "@/lib/types";
import { EmptyState } from "./news";
export function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <>
      <dl className="facts">
        {items.map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value ?? "Not disclosed"}</dd>
          </div>
        ))}
      </dl>
      <p className="fact-note">
        Unknown values are left unknown. Specifications and pricing reflect the
        latest published record, not a guarantee of current availability.
      </p>
    </>
  );
}
export function Timeline({ events }: { events: EntityEvent[] }) {
  return events.length ? (
    <ol className="timeline">
      {events.map((e) => (
        <li key={e.id}>
          <time dateTime={e.occurred_at}>{dateLabel(e.occurred_at, true)}</time>
          <div>
            <h3>{e.title}</h3>
            {e.description && <p>{e.description}</p>}
            {e.source_url && (
              <a
                className="text-link"
                href={e.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Original source <ArrowUpRight size={13} />
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  ) : (
    <p className="muted" style={{ padding: "20px 0" }}>
      No published timeline events yet.
    </p>
  );
}
export function Directory({
  items,
  type,
}: {
  items: (Model | Company)[];
  type: "models" | "companies";
}) {
  return items.length ? (
    <div className="directory-grid">
      {items.map((item) => (
        <article key={item.id} className="directory-entry">
          <h2>
            <Link href={`/${type}/${item.slug}`}>
              {item.name}
              <ArrowUpRight size={18} />
            </Link>
          </h2>
          <p>
            {item.description || "A description has not yet been published."}
          </p>
          {"release_date" in item && (
            <small>Released {dateLabel(item.release_date, true)}</small>
          )}
        </article>
      ))}
    </div>
  ) : (
    <EmptyState title={`No ${type} in this view yet.`} />
  );
}
