import Link from "next/link";
import { ArrowRight, ArrowUpRight, Radio } from "lucide-react";
import {
  getStories,
  getBriefings,
  getBriefingStories,
  getTrends,
  getModels,
} from "@/lib/data";
import {
  Meta,
  WhatChanged,
  SectionTitle,
  StoryRow,
  EmptyState,
  Verification,
} from "@/components/news";
import { dateLabel, knownBoolean } from "@/lib/format";

export const metadata = { alternates: { canonical: "/" } };
export default async function Home() {
  const [{ stories, count }, briefings, trends, models] = await Promise.all([
    getStories({}, 18),
    getBriefings(),
    getTrends(),
    getModels(),
  ]);
  const lead = stories.find((s) => s.featured) || stories[0];
  const wire = stories.filter((s) => s.id !== lead?.id);
  const breaking = stories.filter((s) => s.breaking);
  const brief = briefings[0];
  const briefStories = brief ? await getBriefingStories(brief.id) : [];
  const changes = stories
    .filter((s) => s.what_changed.length && s.importance >= 4)
    .slice(0, 3);
  return (
    <>
      <div className="news-ticker">
        <span className="ticker-label">
          <Radio size={13} />
          {breaking.length ? "Breaking" : "On the wire"}
        </span>
        <div className="ticker-stories">
          {(breaking.length ? breaking : stories.slice(0, 2)).map((s) => (
            <Link key={s.id} href={`/stories/${s.slug}`}>
              {s.headline}
              <ArrowUpRight size={13} />
            </Link>
          ))}
          {!stories.length && (
            <span>The latest verified reporting, as it happens.</span>
          )}
        </div>
        <span className="ticker-time">UTC</span>
      </div>
      <div className="edition-bar">
        <h1>The front page</h1>
        <span>AI news. In context.</span>
        <Link href="/archive">
          Explore {count ? `${count} reports` : "the archive"}{" "}
          <ArrowRight size={13} />
        </Link>
      </div>
      {lead ? (
        <div className="front-grid">
          <section className="lead-column" aria-label="Lead story">
            <article className="lead-story">
              <h2>
                <Link href={`/stories/${lead.slug}`}>{lead.headline}</Link>
              </h2>
              <p className="lead-deck">{lead.subheadline || lead.summary}</p>
              <Meta story={lead} />
              <WhatChanged changes={lead.what_changed} />
              <div className="lead-bottom">
                <Verification state={lead.verification_status} />
                <Link className="text-link" href={`/stories/${lead.slug}`}>
                  Read the report <ArrowRight size={16} />
                </Link>
              </div>
            </article>
            {wire[0] && (
              <article className="secondary-lead">
                <Meta story={wire[0]} />
                <h3>
                  <Link href={`/stories/${wire[0].slug}`}>
                    {wire[0].headline}
                  </Link>
                </h3>
                <p>{wire[0].summary}</p>
              </article>
            )}
          </section>
          <section className="wire-column">
            <SectionTitle href="/archive" label="Full wire">
              Latest news <span className="live-dot" />
            </SectionTitle>
            <div className="compact-wire">
              {wire.slice(1, 6).map((s) => (
                <article key={s.id}>
                  <Meta story={s} />
                  <h3>
                    <Link href={`/stories/${s.slug}`}>{s.headline}</Link>
                  </h3>
                  {s.what_changed[0] && (
                    <p className="wire-change">{s.what_changed[0]}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
          <aside className="intelligence-column">
            <section className="daily-brief">
              <div className="brief-top">
                <span>The Daily Brief</span>
                <span>
                  {brief
                    ? dateLabel(brief.briefing_date)
                    : "Daily intelligence"}
                </span>
              </div>
              <h2>
                Today in AI<span>.</span>
              </h2>
              <p>
                {brief?.introduction ||
                  "A concise reading list of the developments that matter."}
              </p>
              <ol>
                {(briefStories.length ? briefStories : stories)
                  .slice(0, 3)
                  .map((s, i) => (
                    <li key={s.id}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <Link href={`/stories/${s.slug}`}>{s.headline}</Link>
                    </li>
                  ))}
              </ol>
              <Link
                className="brief-read"
                href={brief ? `/briefings/${brief.slug}` : "/briefings"}
              >
                Read the full briefing <ArrowRight size={16} />
              </Link>
            </section>
            <section className="trending">
              <SectionTitle href="/companies" label="Directory">
                In focus
              </SectionTitle>
              <p className="small-caption">Most covered · Last 30 days</p>
              {trends.companies.map((c, i) => (
                <Link
                  className="trend-row"
                  href={`/companies/${c.slug}`}
                  key={c.id}
                >
                  <span className="trend-rank">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <strong>{c.name}</strong>
                  <span>{c.mentions} reports</span>
                  <ArrowUpRight size={13} />
                </Link>
              ))}
            </section>
          </aside>
        </div>
      ) : (
        <EmptyState title="The newsroom is getting ready.">
          The first edition will appear here when reporting is published. Every
          article is backed by a source record and an editorial review.
        </EmptyState>
      )}
      {changes.length > 0 && (
        <section className="changes-desk">
          <SectionTitle href="/archive" label="Follow the developments">
            <span className="delta">Δ</span> What changed?
          </SectionTitle>
          <div className="changes-grid">
            {changes.map((s) => (
              <article key={s.id}>
                <h3>
                  <Link href={`/stories/${s.slug}`}>{s.what_changed[0]}</Link>
                </h3>
                <p>{s.headline}</p>
                <Link className="text-link" href={`/stories/${s.slug}`}>
                  The context <ArrowUpRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
      <div className="lower-grid">
        <section>
          <SectionTitle href="/archive">Across the desks</SectionTitle>
          {stories.slice(0, 8).map((s) => (
            <StoryRow key={s.id} story={s} summary />
          ))}
        </section>
        <aside className="release-desk">
          <SectionTitle href="/models" label="All models">
            Release monitor
          </SectionTitle>
          <p className="small-caption">Known releases and model records</p>
          {models.slice(0, 6).map((m) => (
            <Link className="release-row" href={`/models/${m.slug}`} key={m.id}>
              <div>
                <strong>{m.name}</strong>
                <ArrowUpRight size={14} />
              </div>
              <span>{dateLabel(m.release_date, true)}</span>
              <small>
                {m.model_type || "Type not disclosed"} ·{" "}
                {knownBoolean(m.open_weights, "Open weights", "Closed weights")}
              </small>
            </Link>
          ))}
          <div className="standards-note">
            <h3>The source matters.</h3>
            <p>
              Every report links to its evidence. We distinguish original
              material from secondary reporting, and what is known from what is
              claimed.
            </p>
            <Link href="/about" className="text-link">
              Our editorial standards <ArrowRight size={14} />
            </Link>
          </div>
          {trends.models.length > 0 && (
            <>
              <SectionTitle>Models in the news</SectionTitle>
              {trends.models.map((m) => (
                <Link
                  className="trend-row"
                  key={m.id}
                  href={`/models/${m.slug}`}
                >
                  <strong>{m.name}</strong>
                  <span>{m.mentions} reports</span>
                  <ArrowUpRight size={13} />
                </Link>
              ))}
            </>
          )}
        </aside>
      </div>
    </>
  );
}
