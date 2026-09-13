import { getModels } from "@/lib/data";
import { Directory } from "@/components/intelligence";
export const metadata = {
  title: "Model directory",
  description:
    "AI models, known specifications, pricing, release histories and related reporting.",
  alternates: { canonical: "/models" },
};
export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const models = await getModels(typeof q === "string" ? q : "");
  return (
    <>
      <header className="page-heading">
        <h1>The model directory</h1>
        <p>
          Known specifications. Attributed claims. A living record of what each
          model can do—and what has changed.
        </p>
      </header>
      <form className="search-form">
        <label htmlFor="model-search" className="sr-only">
          Search models
        </label>
        <input
          id="model-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Find a model…"
          maxLength={100}
        />
        <button className="button">Search</button>
      </form>
      <Directory items={models} type="models" />
    </>
  );
}
