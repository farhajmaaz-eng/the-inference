import { getCompanies } from "@/lib/data";
import { Directory } from "@/components/intelligence";
export const metadata = {
  title: "Company intelligence",
  description:
    "Companies shaping artificial intelligence, with sourced coverage and event histories.",
  alternates: { canonical: "/companies" },
};
export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const companies = await getCompanies(typeof q === "string" ? q : "");
  return (
    <>
      <header className="page-heading">
        <h1>Company intelligence</h1>
        <p>
          The organizations building AI. Their models, their moves, and the
          reporting that connects them.
        </p>
      </header>
      <form className="search-form">
        <label htmlFor="company-search" className="sr-only">
          Search companies
        </label>
        <input
          id="company-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Find a company…"
          maxLength={100}
        />
        <button className="button">Search</button>
      </form>
      <Directory items={companies} type="companies" />
    </>
  );
}
