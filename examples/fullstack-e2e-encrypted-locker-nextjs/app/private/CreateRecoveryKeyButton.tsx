"use client";

import { useRouter } from "next/navigation";
import Button from "../Button";
import { requireExportKey } from "../utils/auth";
import { registerRecovery } from "../utils/client";

export default function CreateRecoveryKeyButton() {
  const router = useRouter();
  return (
    <Button
      size="small"
      variant="muted"
      onClick={async () => {
        try {
          const recoveryKey = generateRecoveryKey();
          const exportKey = requireExportKey();
          await registerRecovery({ recoveryKey, exportKey });
          router.refresh();
          alert("Your recovery key: " + recoveryKey);
        } catch (err) {
          alert("Something went wrong: " + err);
        }
      }}
    >
      Create Recovery Key
    </Button>
  );
}

function generateRecoveryKey() {
  return crypto.getRandomValues(new Uint8Array(16)).join("");
}
