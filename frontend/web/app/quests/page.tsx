import { QuestsClient } from "./client";
import { PrivateGate } from "@/lib/private-gate";

export default function QuestsPage() {
  return (
    <PrivateGate>
      <QuestsClient />
    </PrivateGate>
  );
}
