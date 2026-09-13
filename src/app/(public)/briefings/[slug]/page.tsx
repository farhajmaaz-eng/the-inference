import { notFound } from "next/navigation";
import { cache } from "react";
import { publicDatabase, databaseConfigured } from "@/lib/supabase";
import { getBriefingStories } from "@/lib/data";
import { dateLabel } from "@/lib/format";
import { StoryRow } from "@/components/news";
const getBrief = cache(async (slug: string) => {
  if (!databaseConfigured()) return null;
  const { data, error } = await publicDatabase()
    .from("daily_briefings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error("Unable to load this briefing. Please try again.");
  return data;
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getBrief(slug);
  return {
    title: b?.title || "Briefing not found",
    description: b?.introduction,
    alternates: { canonical: `/briefings/${slug}` },
  };
}
export default async function BriefingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const b = await getBrief((await params).slug);
  if (!b) notFound();
  const stories = await getBriefingStories(b.id);
  return (
    <>
      <header className="page-heading">
        <h1>{b.title}</h1>
        <p>{b.introduction}</p>
        <p className="small-caption">
          The Daily Brief · {dateLabel(b.briefing_date, true)} ·{" "}
          {stories.length} essential reads
        </p>
      </header>
      {stories.map((s) => (
        <StoryRow key={s.id} story={s} summary />
      ))}
    </>
  );
}
