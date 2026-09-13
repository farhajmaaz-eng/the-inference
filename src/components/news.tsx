import Link from "next/link";
import Image from "next/image";
import { brand } from "@/lib/brand";
import { ArrowRight, ArrowUpRight, Check, FileText } from "lucide-react";
import type { StoryCard } from "@/lib/data";
import type { StoryDetail, VerificationStatus } from "@/lib/types";
import { dateLabel, deskName, relativeDate, timeLabel } from "@/lib/format";

export function Verification({ state }: { state: VerificationStatus }) {
  const names = {
    unverified: "Awaiting verification",
    source_confirmed: "Primary source confirmed",
    corroborated: "Corroborated",
    disputed: "Claims disputed",
  };
  return (
    <span
      className={`verification verification-${state}`}
      title="Verification describes the evidence reviewed, not a guarantee of a vendor’s claims."
    >
      <Check size={12} />
      {names[state]}
    </span>
  );
}
export function Meta({ story }: { story: StoryCard }) {
  return (
    <div className="story-meta">
      <Link href={`/category/${story.category}`}>
        {deskName(story.category)}
      </Link>
      <span className="meta-dot" />
      <time dateTime={story.published_at ?? undefined}>
        {relativeDate(story.published_at)}
      </time>
      {story.breaking && <span className="breaking-label">Breaking</span>}
    </div>
  );
}
export function WhatChanged({
  changes,
  compact = false,
}: {
  changes: string[];
  compact?: boolean;
}) {
  if (!changes.length) return null;
  return (
    <div className={`what-changed ${compact ? "what-changed-compact" : ""}`}>
      <div className="change-heading">
        <span className="change-mark">Δ</span> What changed?
      </div>
      <ul>
        {(compact ? changes.slice(0, 1) : changes).map((change, i) => (
          <li key={i}>
            <ArrowUpRight size={15} aria-hidden="true" />
            <span>{change}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
export function StoryRow({
  story,
  summary = false,
}: {
  story: StoryCard;
  summary?: boolean;
}) {
  return (
    <article className="story-row">
      <div className="row-time">
        <time dateTime={story.published_at ?? undefined}>
          {dateLabel(story.published_at)}
        </time>
        <span>{timeLabel(story.published_at)} UTC</span>
      </div>
      <div className="row-content">
        <Meta story={story} />
        <h3>
          <Link href={`/stories/${story.slug}`}>{story.headline}</Link>
        </h3>
        {summary && <p>{story.summary}</p>}
        {story.what_changed[0] && (
          <p className="row-change">
            <span>Δ</span> {story.what_changed[0]}
          </p>
        )}
      </div>
      <Link
        href={`/stories/${story.slug}`}
        className="row-arrow"
        aria-label={`Read: ${story.headline}`}
      >
        <ArrowUpRight size={19} />
      </Link>
    </article>
  );
}
export function SectionTitle({
  children,
  href,
  label = "View all",
}: {
  children: React.ReactNode;
  href?: string;
  label?: string;
}) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {href && (
        <Link href={href}>
          {label} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
export function EmptyState({
  title = "No reporting here yet.",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <FileText size={26} strokeWidth={1.2} />
      <h2>{title}</h2>
      <p>
        {children ??
          "Coverage will appear here as the newsroom publishes. Explore another desk or return to the front page."}
      </p>
      <Link href="/archive" className="text-link">
        Explore the archive <ArrowRight size={15} />
      </Link>
    </div>
  );
}
export function StoryArticle({
  story,
  preview = false,
}: {
  story: StoryDetail;
  preview?: boolean;
}) {
  const primary = story.sources.filter((s) => s.primary_source);
  const secondary = story.sources.filter((s) => !s.primary_source);
  return (
    <article className="article-layout">
      <header className="article-header">
        {preview && (
          <div className="preview-notice">
            Editorial preview · {story.status} · Not a public article
          </div>
        )}
        <h1>{story.headline}</h1>
        {story.subheadline && (
          <p className="article-deck">{story.subheadline}</p>
        )}
        <div className="article-meta">
          <Meta story={story} />
          <Verification state={story.verification_status} />
        </div>
        <div className="article-byline">
          <span>{brand.editorialByline}</span>
          <span>
            Published {dateLabel(story.published_at, true)}{" "}
            {timeLabel(story.published_at)} UTC
            {story.updated_at !== story.created_at && (
              <>
                {" "}
                · Updated {dateLabel(story.updated_at)}{" "}
                {timeLabel(story.updated_at)} UTC
              </>
            )}
          </span>
        </div>
      </header>
      <aside className="article-rail">
        <a href="#what-changed">What changed</a>
        <a href="#report">The report</a>
        <a href="#sources">
          Sources <span>{story.sources.length}</span>
        </a>
        {(story.companies.length > 0 || story.models.length > 0) && (
          <div className="related-entities">
            <h2>In this story</h2>
            {story.companies.map((c) => (
              <Link href={`/companies/${c.slug}`} key={c.id}>
                {c.name}
                <ArrowUpRight size={12} />
              </Link>
            ))}
            {story.models.map((m) => (
              <Link href={`/models/${m.slug}`} key={m.id}>
                {m.name}
                <ArrowUpRight size={12} />
              </Link>
            ))}
          </div>
        )}
      </aside>
      <div className="article-content">
        <p className="article-summary">{story.summary}</p>
        <div id="what-changed">
          <WhatChanged changes={story.what_changed} />
        </div>
        {story.hero_image_url && (
          <figure className="article-image">
            <Image
              src={story.hero_image_url}
              alt={story.hero_image_alt || ""}
              width={1200}
              height={760}
              sizes="(max-width: 760px) 100vw, 760px"
              priority
            />
            {story.hero_image_credit && (
              <figcaption>{story.hero_image_credit}</figcaption>
            )}
          </figure>
        )}
        <div className="article-body" id="report">
          {story.body
            .split(/\n\s*\n/)
            .map((paragraph, i) =>
              paragraph.startsWith("## ") ? (
                <h2 key={i}>{paragraph.slice(3)}</h2>
              ) : (
                <p key={i}>{paragraph}</p>
              ),
            )}
        </div>
        <section className="source-section" id="sources">
          <SectionTitle>Follow the evidence</SectionTitle>
          <p className="source-explainer">
            Primary material documents the event. Secondary reporting provides
            independent context. A source’s claims remain attributed to that
            source.
          </p>
          {[
            { name: "Primary sources", items: primary },
            { name: "Secondary reporting", items: secondary },
          ].map((group) => (
            <div className="source-group" key={group.name}>
              <h3>
                {group.name} <span>{group.items.length}</span>
              </h3>
              {group.items.length ? (
                <ol>
                  {group.items.map((s) => (
                    <li key={s.id}>
                      <div>
                        <a
                          href={s.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {s.source_name} <ArrowUpRight size={14} />
                        </a>
                        <span>
                          {s.source_type}
                          {s.author ? ` · ${s.author}` : ""}
                          {s.published_at
                            ? ` · ${dateLabel(s.published_at, true)}`
                            : ""}
                        </span>
                        <small>{new URL(s.source_url).hostname}</small>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="muted">
                  No {group.name.toLowerCase()} attached to this report.
                </p>
              )}
            </div>
          ))}
        </section>
      </div>
    </article>
  );
}
