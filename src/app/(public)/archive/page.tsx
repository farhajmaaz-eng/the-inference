import { Archive, parseFilters, type QueryParams } from "@/components/archive";
export const metadata = {
  title: "News archive",
  description: "Search the AI news record by desk, company, model and date.",
  alternates: { canonical: "/archive" },
};
export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<QueryParams>;
}) {
  return (
    <>
      <header className="page-heading">
        <h1>The archive</h1>
        <p>
          The AI news record. Follow a company, trace a model, or revisit the
          day something changed.
        </p>
      </header>
      <Archive filters={parseFilters(await searchParams)} />
    </>
  );
}
