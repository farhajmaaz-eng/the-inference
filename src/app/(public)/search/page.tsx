import { Archive, parseFilters, type QueryParams } from "@/components/archive";
export const metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<QueryParams>;
}) {
  return (
    <>
      <header className="page-heading">
        <h1>Search the record</h1>
        <p>
          Reporting, companies, and models. Find the development—and the
          evidence behind it.
        </p>
      </header>
      <Archive
        path="/search"
        search
        filters={parseFilters(await searchParams)}
      />
    </>
  );
}
