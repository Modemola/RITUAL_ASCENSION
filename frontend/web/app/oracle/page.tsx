import { OracleClient } from "./client";
import { PrivateGate } from "@/lib/private-gate";

export default function OraclePage() {
  return (
    <PrivateGate>
      <OracleClient />
    </PrivateGate>
  );
}
