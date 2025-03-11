"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Button from "../Button";
import { requireExportKey, requireSessionKey } from "../utils/auth";
import { logout } from "../utils/client";
import { createLocker } from "../utils/locker/client/createLocker";
import { decryptLocker } from "../utils/locker/client/decryptLocker";
import useLockerRequestState from "./useLockerRequest";

function LockerForm({
  secret,
  onSubmit,
  onChange,
}: {
  secret: string;
  onSubmit?: () => void;
  onChange?: (secret: string) => void;
}) {
  return (
    <div className="space-y-4 w-full h-60">
      <h2 className="text-xl font-semibold">Locker</h2>

      <form
        className="flex flex-col items-start space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
      >
        <textarea
          rows={5}
          className="w-full max-w-xl border border-gray-300 p-2 rounded"
          value={secret}
          onChange={(e) => {
            onChange?.(e.target.value);
          }}
        />
        <Button>Save</Button>
      </form>
    </div>
  );
}

function useRequireExportKeyOrRedirect() {
  const router = useRouter();
  const requireOrRedirect = useCallback(() => {
    try {
      return requireExportKey();
    } catch (err) {
      logout().finally(() => router.replace("/"));
    }
  }, [router]);
  return requireOrRedirect;
}

export default function Locker() {
  const lockerState = useLockerRequestState();
  const [secret, setSecret] = useState("");
  const requireExportKeyOrRedirect = useRequireExportKeyOrRedirect();
  const router = useRouter();

  useEffect(() => {
    if (lockerState.isLoading) return;
    if (lockerState.data) {
      const exportKey = requireExportKeyOrRedirect();
      if (!exportKey) return;
      console.log("decrypting locker payload", exportKey, lockerState.data);
      const secret = decryptLocker({ locker: lockerState.data, exportKey });
      if (typeof secret !== "string") throw new TypeError();
      setSecret(secret);
    } else {
      setSecret("");
    }
  }, [lockerState, requireExportKeyOrRedirect]);

  if (lockerState.isLoading)
    return (
      <div className="animate-pulse text-2xl text-gray-300 flex flex-col space-y-4 justify-center items-center h-60 bg-gray-50 w-full">
        loading locker &hellip;
      </div>
    );

  if (lockerState.error) {
    return (
      <div className="text-rose-500">
        ERROR: {"" + (lockerState.error ?? "UNKNOWN")}
      </div>
    );
  }

  return (
    <LockerForm
      secret={secret}
      onChange={setSecret}
      onSubmit={async () => {
        const exportKey = requireExportKey();
        const sessionKey = requireSessionKey();
        const locker = createLocker({
          data: secret,
          exportKey,
          sessionKey,
        });
        console.log("sending encrypted locker payload", locker);
        const res = await fetch("/api/locker", {
          method: "POST",
          body: JSON.stringify(locker),
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        if (res.ok) {
          alert("Locker updated");
          router.refresh();
        } else {
          alert("Something went wrong");
        }
      }}
    />
  );
}
