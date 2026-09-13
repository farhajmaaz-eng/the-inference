import { notFound } from "next/navigation";
import { Archive, parseFilters, type QueryParams } from "@/components/archive";
import { getCategories } from "@/lib/data";
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<QueryParams>;
};
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = (await getCategories()).find((c) => c.slug === slug);
  return {
    title: category?.name || "Desk not found",
    description: category?.description,
    alternates: { canonical: `/category/${slug}` },
  };
}
export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [categories, query] = await Promise.all([
    getCategories(),
    searchParams,
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  return (
    <>
      <header className="page-heading">
        <h1>{category.name}</h1>
        <p>{category.description}</p>
      </header>
      <Archive
        filters={{ ...parseFilters(query), category: slug }}
        path={`/category/${slug}`}
        fixedCategory
      />
    </>
  );
}
