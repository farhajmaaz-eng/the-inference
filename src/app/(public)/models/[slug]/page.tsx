import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getModel, getCompanies, getStories, getEvents } from "@/lib/data";
import { Facts, Timeline } from "@/components/intelligence";
import { SectionTitle, StoryRow, EmptyState } from "@/components/news";
import { Pagination } from "@/components/archive";
import { dateLabel, knownBoolean, money } from "@/lib/format";
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};
export async function generateMetadata({ params }: Props) {
  const m = await getModel((await params).slug);
  return {
    title: m?.name || "Model not found",
    description: m?.description,
    alternates: { canonical: `/models/${m?.slug}` },
  };
}
export default async function ModelPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const model = await getModel(slug);
  if (!model) notFound();
  const page = Math.max(
    1,
    Number.parseInt((await searchParams).page || "1") || 1,
  );
  const [companies, { stories, count }, events] = await Promise.all([
    getCompanies(),
    getStories({ model: slug, page }),
    getEvents("model_id", model.id),
  ]);
  const company = companies.find((c) => c.id === model.company_id);
  return (
    <>
      <header className="page-heading">
        <h1>{model.name}</h1>
        <p>
          {model.description ||
            "A model description has not yet been published."}
        </p>
        {company && (
          <Link className="text-link" href={`/companies/${company.slug}`}>
            Developed by {company.name} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        )}
      </header>
      <div className="entity-layout">
        <aside>
          <SectionTitle>Known specifications</SectionTitle>
          <Facts
            items={[
              [
                "Developer",
                company ? (
                  <Link href={`/companies/${company.slug}`}>
                    {company.name}
                  </Link>
                ) : null,
              ],
              ["Release date", dateLabel(model.release_date, true)],
              ["Model type", model.model_type],
              [
                "Context window",
                model.context_window === null
                  ? null
                  : `${model.context_window.toLocaleString("en-US")} tokens`,
              ],
              ["Input / 1M tokens", money(model.input_price_per_million)],
              ["Output / 1M tokens", money(model.output_price_per_million)],
              ["Pricing notes", model.pricing_notes],
              [
                "API availability",
                knownBoolean(model.api_available, "Available", "Not available"),
              ],
              ["Open weights", knownBoolean(model.open_weights, "Yes", "No")],
              ["License", model.license],
              [
                "Official page",
                model.website ? (
                  <a
                    href={model.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit the developer <ArrowRight size={14} aria-hidden="true" />
                  </a>
                ) : null,
              ],
            ]}
          />
        </aside>
        <div>
          <section className="entity-section">
            <SectionTitle>Update history</SectionTitle>
            <Timeline events={events} />
          </section>
          <section>
            <SectionTitle>Related reporting</SectionTitle>
            {stories.length ? (
              stories.map((s) => <StoryRow key={s.id} story={s} summary />)
            ) : (
              <EmptyState />
            )}
            <Pagination page={page} count={count} path={`/models/${slug}`} />
          </section>
        </div>
      </div>
    </>
  );
}
