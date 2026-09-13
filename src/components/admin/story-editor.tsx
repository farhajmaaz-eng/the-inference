"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveStoryAction } from "@/app/admin/actions";
import type { StoryInput, SourceInput } from "@/lib/validation";
import type { Company, Model, Category } from "@/lib/types";
import { ManagedForm, Field, SelectField, StatusSelect } from "./forms";
type Props = {
  id?: string;
  initial: StoryInput | null;
  companies: Company[];
  models: Model[];
  categories: Category[];
  submissionId?: string;
};
function localDate(value: string | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}
const newSource = (): SourceInput => ({
  source_name: "",
  source_url: "",
  author: null,
  source_type: "announcement",
  primary_source: true,
  published_at: null,
});
export function StoryEditor({
  id,
  initial,
  companies,
  models,
  categories,
  submissionId,
}: Props) {
  const [sources, setSources] = useState<SourceInput[]>(
    initial?.sources || [newSource()],
  );
  const update = (index: number, patch: Partial<SourceInput>) =>
    setSources((current) =>
      current.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  return (
    <ManagedForm action={saveStoryAction} label="Save story">
      <input type="hidden" name="id" value={id || ""} />
      <input type="hidden" name="submission_id" value={submissionId || ""} />
      <input type="hidden" name="sources" value={JSON.stringify(sources)} />
      <div className="form-grid">
        <Field
          label="Headline"
          name="headline"
          value={initial?.headline}
          required
          wide
        />
        <Field
          label="Subheadline"
          name="subheadline"
          value={initial?.subheadline}
          wide
        />
        <Field
          label="URL slug"
          name="slug"
          value={initial?.slug}
          required
          hint="Stable public address. Use lowercase words separated by hyphens."
        />
        <SelectField
          label="Desk"
          name="category"
          value={initial?.category || categories[0]?.slug}
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <Field
          label="Summary"
          name="summary"
          value={initial?.summary}
          rows={3}
          required
          wide
          hint="A concise, factual overview. At least 30 characters."
        />
        <Field
          label="Report body"
          name="body"
          value={initial?.body}
          rows={16}
          required
          wide
          hint="Separate paragraphs with a blank line. Start section headings with ##. HTML is not rendered."
        />
      </div>
      <section className="form-section">
        <h2>What changed?</h2>
        <Field
          label="Concrete differences"
          name="what_changed"
          value={initial?.what_changed.join("\n")}
          rows={4}
          hint="One change per line, up to eight. Be specific; retain qualifications and attribution."
        />
      </section>
      <section className="form-section">
        <h2>Sources & verification</h2>
        <SelectField
          label="Verification state"
          name="verification_status"
          value={initial?.verification_status || "unverified"}
        >
          <option value="unverified">Awaiting verification</option>
          <option value="source_confirmed">Primary source confirmed</option>
          <option value="corroborated">
            Corroborated — primary + two domains
          </option>
          <option value="disputed">Claims disputed — explain in body</option>
        </SelectField>
        {sources.map((s, i) => (
          <fieldset className="source-editor" key={i}>
            <legend className="sr-only">Source {i + 1}</legend>
            <div className="source-editor-header">
              <strong>Source {i + 1}</strong>
              <button
                type="button"
                onClick={() =>
                  setSources((current) => current.filter((_, n) => n !== i))
                }
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
            <div className="form-grid">
              <label className="field">
                Source name
                <input
                  required
                  value={s.source_name}
                  maxLength={120}
                  onChange={(e) => update(i, { source_name: e.target.value })}
                />
              </label>
              <label className="field">
                Public HTTPS URL
                <input
                  required
                  type="url"
                  value={s.source_url}
                  onChange={(e) => update(i, { source_url: e.target.value })}
                />
              </label>
              <label className="field">
                Author, if known
                <input
                  value={s.author || ""}
                  onChange={(e) =>
                    update(i, { author: e.target.value || null })
                  }
                />
              </label>
              <label className="field">
                Source type
                <select
                  value={s.source_type}
                  onChange={(e) =>
                    update(i, {
                      source_type: e.target.value as SourceInput["source_type"],
                    })
                  }
                >
                  {[
                    "announcement",
                    "paper",
                    "documentation",
                    "repository",
                    "filing",
                    "reporting",
                    "other",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Source publication time (UTC)
                <input
                  type="datetime-local"
                  value={localDate(s.published_at)}
                  onChange={(e) =>
                    update(i, {
                      published_at: e.target.value
                        ? `${e.target.value}:00.000Z`
                        : null,
                    })
                  }
                />
              </label>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={s.primary_source}
                  onChange={(e) =>
                    update(i, { primary_source: e.target.checked })
                  }
                />{" "}
                Primary source / original material
              </label>
            </div>
          </fieldset>
        ))}
        <button
          className="button secondary"
          type="button"
          style={{ marginTop: 16 }}
          disabled={sources.length >= 30}
          onClick={() => setSources((current) => [...current, newSource()])}
        >
          <Plus size={15} /> Add source
        </button>
      </section>
      <section className="form-section">
        <h2>Connected intelligence</h2>
        <p className="field-hint">
          Manage records in{" "}
          <Link href="/admin/entities">Companies & models</Link>. Draft entities
          remain private until published separately.
        </p>
        <h3 style={{ marginTop: 16, fontSize: 14 }}>Companies</h3>
        <div className="check-list">
          {companies.map((c) => (
            <label key={c.id} className="check-field">
              <input
                type="checkbox"
                name="company_ids"
                value={c.id}
                defaultChecked={initial?.companies.some(
                  (x) => x.slug === c.slug,
                )}
              />
              {c.name}
              <span className={`status status-${c.status}`}>{c.status}</span>
            </label>
          ))}
        </div>
        <h3 style={{ marginTop: 22, fontSize: 14 }}>Models</h3>
        <div className="check-list">
          {models.map((m) => (
            <label key={m.id} className="check-field">
              <input
                type="checkbox"
                name="model_ids"
                value={m.id}
                defaultChecked={initial?.models.some((x) => x.slug === m.slug)}
              />
              {m.name}
              <span className={`status status-${m.status}`}>{m.status}</span>
            </label>
          ))}
        </div>
      </section>
      <section className="form-section">
        <h2>Publication</h2>
        <div className="form-grid">
          <StatusSelect value={initial?.status || "draft"} />
          <Field
            label="Publication time (UTC)"
            name="published_at"
            type="datetime-local"
            value={localDate(initial?.published_at)}
            hint="Blank uses the publication time. A future time schedules public visibility."
          />
          <SelectField
            label="Importance"
            name="importance"
            value={String(initial?.importance || 3)}
          >
            <option value="1">1 — Routine</option>
            <option value="2">2 — Notable</option>
            <option value="3">3 — Significant</option>
            <option value="4">4 — Major</option>
            <option value="5">5 — Lead development</option>
          </SelectField>
          <div className="check-list">
            <label className="check-field">
              <input
                type="checkbox"
                name="breaking"
                defaultChecked={initial?.breaking}
              />{" "}
              Breaking news
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={initial?.featured}
              />{" "}
              Featured lead
            </label>
          </div>
        </div>
        <p className="field-hint">
          Unpublish by saving as Draft. Archive removes the report from public
          views without deleting its record.
        </p>
      </section>
      <details className="form-section">
        <summary>Image & private editorial notes</summary>
        <div className="form-grid" style={{ marginTop: 18 }}>
          <Field
            label="Hero image HTTPS URL"
            name="hero_image_url"
            type="url"
            value={initial?.hero_image_url}
          />
          <Field
            label="Image alternative text"
            name="hero_image_alt"
            value={initial?.hero_image_alt}
          />
          <Field
            label="Image credit / license"
            name="hero_image_credit"
            value={initial?.hero_image_credit}
          />
          <Field
            label="Event identifier — private"
            name="event_key"
            value={initial?.event_key}
            hint="A stable identifier shared by reports about the same event."
          />
          <Field
            label="Internal notes — never public"
            name="internal_notes"
            value={initial?.internal_notes}
            rows={4}
            wide
          />
        </div>
      </details>
    </ManagedForm>
  );
}
