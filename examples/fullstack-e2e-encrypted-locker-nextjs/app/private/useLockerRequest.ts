import { useMemo, useSyncExternalStore } from "react";
import FetchRequest from "./FetchRequest";
import { Locker } from "../utils/locker";

function isValidLockerResponse(data: unknown): data is Locker {
  return (
    data != null &&
    typeof data === "object" &&
    "ciphertext" in data &&
    "nonce" in data &&
    typeof data.ciphertext === "string" &&
    typeof data.nonce === "string"
  );
}

async function fetchLocker(): Promise<Locker | null> {
  const res = await fetch("/api/locker", { cache: "no-store" });
  if (res.status === 404) {
    return null;
  }
  if (res.status !== 200) throw new Error("unexpected locker response");
  const json: unknown = await res.json();
  if (!isValidLockerResponse(json)) {
    throw new TypeError("malformed locker object");
  }
  return json;
}

export default function useLockerRequestState() {
  const lockerRequest = useMemo(() => new FetchRequest(fetchLocker), []);
  const lockerState = useSyncExternalStore(
    lockerRequest.subscribe,
    lockerRequest.getSnapshot
  );
  return lockerState;
}
