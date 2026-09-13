import { notFound } from "next/navigation";
import { z } from "zod";
import { editorData } from "@/lib/editorial";
import { StoryArticle } from "@/components/news";
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { story } = await editorData(id);
  if (!story) notFound();
  return <StoryArticle story={story} preview />;
}
