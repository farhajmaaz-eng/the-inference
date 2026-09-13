import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, getModels, getStories, getEvents } from "@/lib/data";
import { Facts, Timeline, Directory } from "@/components/intelligence";
import { SectionTitle, StoryRow, EmptyState } from "@/components/news";
import { Pagination } from "@/components/archive";
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};
export async function generateMetadata({ params }: Props) {
  const c = await getCompany((await params).slug);
  return {
    title: c?.name || "Company not found",
    description: c?.description,
    alternates: { canonical: `/companies/${c?.slug}` },
  };
}
export default async function CompanyPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();
  const page = Math.max(
    1,
    Number.parseInt((await searchParams).page || "1") || 1,
  );
  const [models, { stories, count }, events] = await Promise.all([
    getModels("", company.id),
    getStories({ company: slug, page }),
    getEvents("company_id", company.id),
  ]);
  return (
    <>
      <header className="page-heading">
        <h1>{company.name}</h1>
        <p>
          {company.description ||
            "A company description has not yet been published."}
        </p>
      </header>
      <div className="entity-layout">
        <aside>
          <SectionTitle>Company record</SectionTitle>
          <Facts
            items={[
              [
                "Website",
                company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {new URL(company.website).hostname}
                  </a>
                ) : null,
              ],
              ["Headquarters", company.headquarters],
              ["Founded", company.founded_year],
              ["Coverage", `${count} reports`],
            ]}
          />
          <Link
            href={`/archive?company=${slug}`}
            className="text-link"
            style={{ marginTop: 20 }}
          >
            Filter the full archive <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </aside>
        <div>
          <section className="entity-section">
            <SectionTitle>Models</SectionTitle>
            <Directory
              items={models}
              type="models"
            />
          </section>
          <section className="entity-section">
            <SectionTitle>Important events</SectionTitle>
            <Timeline events={events} />
          </section>
          <section>
            <SectionTitle>Latest coverage</SectionTitle>
            {stories.length ? (
              stories.map((s) => <StoryRow key={s.id} story={s} summary />)
            ) : (
              <EmptyState />
            )}
            <Pagination page={page} count={count} path={`/companies/${slug}`} />
          </section>
        </div>
      </div>
    </>
  );
}
