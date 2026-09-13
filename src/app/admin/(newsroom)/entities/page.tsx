import { ArrowUpRight } from "lucide-react";
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
import { saveEntityAction } from "@/app/admin/actions";
export default async function EntitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; edit?: string; saved?: string }>;
}) {
  const { db } = await requireAdmin();
  const q = await searchParams;
  const kind = q.kind === "models" ? "models" : "companies";
  if (q.edit && q.edit !== "new" && !z.uuid().safeParse(q.edit).success)
    notFound();
  const [companyResult, modelResult] = await Promise.all([
    db.from("companies").select("*").order("name"),
    db.from("models").select("*").order("name"),
  ]);
  if (companyResult.error || modelResult.error)
    throw new Error("Unable to load entities.");
  const companies = companyResult.data || [];
  const models = modelResult.data || [];
  const c = companies.find((x) => x.id === q.edit),
    m = models.find((x) => x.id === q.edit);
  const entity = kind === "companies" ? c : m;
  if (q.edit && q.edit !== "new" && !entity) notFound();
  return (
    <>
      <div className="admin-title">
        <h1>Companies & models</h1>
        <Link className="button" href={`/admin/entities?kind=${kind}&edit=new`}>
          New {kind === "models" ? "model" : "company"}
        </Link>
      </div>
      <nav className="admin-nav">
        <Link href="/admin/entities?kind=companies">Companies</Link>
        <Link href="/admin/entities?kind=models">Models</Link>
      </nav>
      {q.saved && (
        <p className="notice" style={{ marginTop: 20 }} role="status">
          Entity saved. Published records are live immediately.
        </p>
      )}
      {q.edit ? (
        <>
          <div className="admin-title">
            <h2>
              {entity
                ? `Edit ${entity.name}`
                : `New ${kind === "models" ? "model" : "company"}`}
            </h2>
            <Link href={`/admin/entities?kind=${kind}`} className="text-link">
              Close editor
            </Link>
          </div>
          <ManagedForm action={saveEntityAction} label="Save record">
            <input type="hidden" name="id" value={entity?.id || ""} />
            <input type="hidden" name="kind" value={kind} />
            <div className="form-grid">
              <Field label="Name" name="name" value={entity?.name} required />
              <Field label="Slug" name="slug" value={entity?.slug} required />
              <Field
                label="Description"
                name="description"
                rows={4}
                wide
                value={entity?.description}
              />
              <Field
                label="Official website"
                name="website"
                type="url"
                value={entity?.website}
              />
              <StatusSelect value={entity?.status} entity />
              {kind === "companies" ? (
                <>
                  <Field
                    label="Logo HTTPS URL"
                    name="logo_url"
                    type="url"
                    value={c?.logo_url}
                  />
                  <Field
                    label="Headquarters"
                    name="headquarters"
                    value={c?.headquarters}
                  />
                  <Field
                    label="Founded year"
                    name="founded_year"
                    type="number"
                    value={c?.founded_year}
                    min={1600}
                    max={new Date().getUTCFullYear()}
                  />
                </>
              ) : (
                <>
                  <SelectField
                    label="Developer"
                    name="company_id"
                    value={m?.company_id}
                  >
                    <option value="">Unknown</option>
                    {companies.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name} · {x.status}
                      </option>
                    ))}
                  </SelectField>
                  <Field
                    label="Release date"
                    name="release_date"
                    type="date"
                    value={m?.release_date}
                  />
                  <Field
                    label="Model type"
                    name="model_type"
                    value={m?.model_type}
                  />
                  <Field
                    label="Context window (tokens)"
                    name="context_window"
                    type="number"
                    value={m?.context_window}
                    min={1}
                  />
                  <Field
                    label="USD input price per million tokens"
                    name="input_price_per_million"
                    type="number"
                    step="any"
                    min={0}
                    value={m?.input_price_per_million}
                  />
                  <Field
                    label="USD output price per million tokens"
                    name="output_price_per_million"
                    type="number"
                    step="any"
                    min={0}
                    value={m?.output_price_per_million}
                  />
                  <Field
                    label="Pricing notes / qualifications"
                    name="pricing_notes"
                    rows={3}
                    wide
                    value={m?.pricing_notes}
                  />
                  <SelectField
                    label="API availability"
                    name="api_available"
                    value={
                      m?.api_available === null ||
                      m?.api_available === undefined
                        ? ""
                        : String(m.api_available)
                    }
                  >
                    <option value="">Unknown</option>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </SelectField>
                  <SelectField
                    label="Open weights"
                    name="open_weights"
                    value={
                      m?.open_weights === null || m?.open_weights === undefined
                        ? ""
                        : String(m.open_weights)
                    }
                  >
                    <option value="">Unknown</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </SelectField>
                  <Field label="License" name="license" value={m?.license} />
                </>
              )}
            </div>
            <p className="field-hint" style={{ marginTop: 20 }}>
              Leave undisclosed values blank. Publishing an entity makes its
              entire record public; keep private notes in story editorial
              fields.
            </p>
          </ManagedForm>
        </>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Public record</th>
              </tr>
            </thead>
            <tbody>
              {(kind === "companies" ? companies : models).map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/admin/entities?kind=${kind}&edit=${e.id}`}>
                      {e.name}
                    </Link>
                  </td>
                  <td>{e.slug}</td>
                  <td>
                    <span className={`status status-${e.status}`}>
                      {e.status}
                    </span>
                  </td>
                  <td>
                    {e.status === "published" && (
                      <Link href={`/${kind}/${e.slug}`}>View <ArrowUpRight size={14} aria-hidden="true" /></Link>
                    )}
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
