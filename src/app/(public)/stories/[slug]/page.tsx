import { notFound } from "next/navigation";
import { getStory, getStories } from "@/lib/data";
import { StoryArticle, StoryRow, SectionTitle } from "@/components/news";
import { articleSchema, jsonLd } from "@/lib/seo";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const story = await getStory((await params).slug);
  if (!story) return { title: "Report not found", robots: { index: false } };
  return {
    title: story.headline,
    description: story.summary,
    alternates: { canonical: `/stories/${story.slug}` },
    openGraph: {
      type: "article",
      title: story.headline,
      description: story.summary,
      publishedTime: story.published_at || undefined,
      modifiedTime: story.updated_at,
      ...(story.hero_image_url
        ? {
            images: [
              {
                url: story.hero_image_url,
                alt: story.hero_image_alt || story.headline,
              },
            ],
          }
        : {}),
    },
  };
}
export default async function StoryPage({ params }: Props) {
  const story = await getStory((await params).slug);
  if (!story) notFound();
  const { stories } = await getStories({ category: story.category }, 5);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema(story)) }}
      />
      <StoryArticle story={story} />
      {stories.some((s) => s.id !== story.id) && (
        <section className="related-coverage">
          <SectionTitle
            href={`/category/${story.category}`}
            label="More from this desk"
          >
            Related coverage
          </SectionTitle>
          {stories
            .filter((s) => s.id !== story.id)
            .slice(0, 3)
            .map((s) => (
              <StoryRow key={s.id} story={s} />
            ))}
        </section>
      )}
    </>
  );
}
