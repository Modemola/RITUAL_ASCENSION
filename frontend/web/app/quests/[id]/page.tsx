import { QuestDetailClient } from "./client";

export default async function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuestDetailClient questId={id} />;
}
