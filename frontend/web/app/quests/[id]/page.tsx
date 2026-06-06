import { QuestDetailClient } from "./client";
import { PrivateGate } from "@/lib/private-gate";

export default async function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PrivateGate>
      <QuestDetailClient questId={id} />
    </PrivateGate>
  );
}
