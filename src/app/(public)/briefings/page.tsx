import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBriefings, getBriefingStories } from "@/lib/data";
import { dateLabel } from "@/lib/format";
import { EmptyState } from "@/components/news";
export const metadata = {
  title: "The Daily Brief",
  description:
    "A concise, source-backed reading list of the day's AI developments.",
  alternates: { canonical: "/briefings" },
};
export default async function BriefingsPage() {
  const briefs = await getBriefings();
  const current = briefs[0];
  const stories = current ? await getBriefingStories(current.id) : [];
  return (
    <>
      <header className="page-heading">
        <h1>The Daily Brief</h1>
        <p>
          Your essential reading. The developments that matter, the concrete
          changes, and the original sources.
        </p>
      </header>
      {briefs.length ? (
        <div className="briefing-index">
          <section className="briefing-current">
            <div>
              <small>Latest edition · {dateLabel(current.briefing_date, true)}</small>
              <h2><Link href={`/briefings/${current.slug}`}>{current.title}</Link></h2>
              <p>{current.introduction}</p>
              <Link className="brief-read" href={`/briefings/${current.slug}`}>Read the full briefing <ArrowRight size={16} /></Link>
            </div>
            <ol aria-label="Latest briefing running order">
              {stories.map((story, index) => <li key={story.id}><span>{String(index + 1).padStart(2, "0")}</span><Link href={`/stories/${story.slug}`}>{story.headline}</Link><ArrowRight size={14} /></li>)}
            </ol>
          </section>
          <section className="briefing-archive">
            <h2>Previous editions</h2>
            <div className="directory-grid">
          {briefs.slice(1).map((b) => (
            <article className="directory-entry" key={b.id}>
              <h2>
                <Link href={`/briefings/${b.slug}`}>{b.title}</Link>
              </h2>
              <p>{b.introduction}</p>
              <small>{dateLabel(b.briefing_date, true)}</small>
            </article>
          ))}
            {briefs.length === 1 && <p className="muted">The archive begins with this edition. New daily briefings will appear here automatically.</p>}
            </div>
          </section>
        </div>
      ) : (
        <EmptyState title="The next briefing is on its way." />
      )}
    </>
  );
}
