"use client";

import { useRouter } from "next/navigation";
import Button from "../Button";
import { request } from "../utils/auth";

export default function RemoveRecoveryKeyButton() {
  const router = useRouter();
  return (
    <Button
      size="small"
      variant="muted"
      onClick={async () => {
        await request("DELETE", "/api/recovery");
        alert("Recovery Key was deleted");
        router.refresh();
      }}
    >
      Remove Recovery Key
    </Button>
  );
}
