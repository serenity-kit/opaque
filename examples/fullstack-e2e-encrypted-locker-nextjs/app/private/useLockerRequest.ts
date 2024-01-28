import { useMemo, useSyncExternalStore } from "react";
import isLockerObject from "../utils/isLockerObject";
import { Locker } from "../utils/locker";
import FetchRequest from "./FetchRequest";

async function fetchLocker(): Promise<Locker | null> {
  const res = await fetch("/api/locker", { cache: "no-store" });
  if (res.status === 404) {
    return null;
  }
  if (res.status !== 200) throw new Error("unexpected locker response");
  const json: unknown = await res.json();
  if (!isLockerObject(json)) {
    throw new Error("invalid locker object response");
  }
  return json;
}

export default function useLockerRequestState() {
  const lockerRequest = useMemo(() => new FetchRequest(fetchLocker), []);
  const lockerState = useSyncExternalStore(
    lockerRequest.subscribe,
    lockerRequest.getSnapshot,
  );
  return lockerState;
}
