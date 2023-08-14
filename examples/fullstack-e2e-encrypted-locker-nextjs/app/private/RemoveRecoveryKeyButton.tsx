"use client";

import { useRouter } from "next/navigation";
import Button from "../Button";
import { deleteRecovery } from "../utils/client";

export default function RemoveRecoveryKeyButton() {
  const router = useRouter();
  return (
    <Button
      size="small"
      variant="muted"
      onClick={async () => {
        await deleteRecovery();
        alert("Recovery Key was deleted");
        router.refresh();
      }}
    >
      Remove Recovery Key
    </Button>
  );
}
