import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import {
  getCategories,
  getCompanies,
  getModels,
  getStories,
  type Filters,
} from "@/lib/data";
import { EmptyState, SectionTitle, StoryRow } from "./news";

export type QueryParams = Record<string, string | string[] | undefined>;
export function parseFilters(params: QueryParams): Filters {
  const value = (key: string) =>
    typeof params[key] === "string" ? params[key].slice(0, 200) : undefined;
  return {
    q: value("q"),
    category: value("category"),
    company: value("company"),
    model: value("model"),
    from: value("from"),
    to: value("to"),
    page: Math.max(
      1,
      Math.min(Number.parseInt(value("page") || "1") || 1, 500),
    ),
  };
}
export function Pagination({
  page,
  count,
  size = 20,
  path,
  filters = {},
}: {
  page: number;
  count: number;
  size?: number;
  path: string;
  filters?: Filters;
}) {
  const pages = Math.ceil(count / size);
  if (pages <= 1) return null;
  const href = (next: number) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(filters))
      if (v && k !== "page") query.set(k, String(v));
    query.set("page", String(next));
    return `${path}?${query}`;
  };
  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)}>
          <ArrowLeft size={15} /> Newer reports
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)}>
          Older reports <ArrowRight size={15} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
export async function Archive({
  filters,
  path = "/archive",
  search = false,
  fixedCategory = false,
}: {
  filters: Filters;
  path?: string;
  search?: boolean;
  fixedCategory?: boolean;
}) {
  const [
    categories,
    companies,
    models,
    { stories, count },
    matchedCompanies,
    matchedModels,
  ] = await Promise.all([
    getCategories(),
    getCompanies(),
    getModels(),
    getStories(filters),
    search && filters.q ? getCompanies(filters.q) : Promise.resolve([]),
    search && filters.q ? getModels(filters.q) : Promise.resolve([]),
  ]);
  return (
    <>
      <form action={path} role="search">
        <div className="search-form">
          <label className="sr-only" htmlFor="query">
            Search reporting
          </label>
          <input
            type="search"
            id="query"
            name="q"
            defaultValue={filters.q}
            maxLength={200}
            placeholder="Search stories, companies, models…"
          />
          <button className="button" type="submit">
            <Search size={18} />
            <span>Search</span>
          </button>
        </div>
        <div className="filters">
          {!fixedCategory && (
            <label>
              Desk
              <select name="category" defaultValue={filters.category || ""}>
                <option value="">All desks</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Company
            <select name="company" defaultValue={filters.company || ""}>
              <option value="">All companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Model
            <select name="model" defaultValue={filters.model || ""}>
              <option value="">All models</option>
              {models.map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            From
            <input type="date" name="from" defaultValue={filters.from} />
          </label>
          <label>
            To
            <input type="date" name="to" defaultValue={filters.to} />
          </label>
          <button className="button secondary" type="submit">
            Apply filters
          </button>
          <Link className="text-link" href={path}>
            Reset
          </Link>
        </div>
      </form>
      {(matchedCompanies.length > 0 || matchedModels.length > 0) && (
        <section className="entity-section" style={{ marginTop: 28 }}>
          <SectionTitle>Intelligence matches</SectionTitle>
          <div className="directory-grid">
            {matchedCompanies.map((c) => (
              <article className="directory-entry" key={c.id}>
                <small>Company</small>
                <h2>
                  <Link href={`/companies/${c.slug}`}>
                    {c.name}
                    <ArrowRight size={17} />
                  </Link>
                </h2>
                <p>{c.description}</p>
              </article>
            ))}
            {matchedModels.map((m) => (
              <article className="directory-entry" key={m.id}>
                <small>Model</small>
                <h2>
                  <Link href={`/models/${m.slug}`}>
                    {m.name}
                    <ArrowRight size={17} />
                  </Link>
                </h2>
                <p>{m.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      <div className="results-bar">
        <span>
          {count} {count === 1 ? "report" : "reports"}
          {filters.q ? ` matching “${filters.q}”` : " in the archive"}
        </span>
        <span>Newest first · UTC</span>
      </div>
      {stories.length ? (
        stories.map((s) => <StoryRow story={s} summary key={s.id} />)
      ) : (
        <EmptyState title="No reports match this view.">
          Try a broader search, a different desk, or remove the date filters.
          Company and model records are searched separately above.
        </EmptyState>
      )}
      <Pagination
        page={filters.page || 1}
        count={count}
        path={path}
        filters={filters}
      />
    </>
  );
}
