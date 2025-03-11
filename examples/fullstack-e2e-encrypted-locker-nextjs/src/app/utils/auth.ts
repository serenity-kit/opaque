import { useRouter } from "next/navigation";
import { useCallback } from "react";

const OPAQUE_SESSION_KEY = "opaque:sessionKey";
const OPAQUE_EXPORT_KEY = "opaque:exportKey";

type LoginKeys = { sessionKey: string; exportKey: string };

export function storeLoginKeys({ sessionKey, exportKey }: LoginKeys) {
  sessionStorage.setItem(OPAQUE_SESSION_KEY, sessionKey);
  sessionStorage.setItem(OPAQUE_EXPORT_KEY, exportKey);
}

export function removeLoginKeys() {
  sessionStorage.removeItem(OPAQUE_SESSION_KEY);
  sessionStorage.removeItem(OPAQUE_EXPORT_KEY);
}

function requireSessionStorageItem(key: string) {
  const value = sessionStorage.getItem(key);
  if (value == null)
    throw new Error(`no value for key "${key}" in sessionStorage`);
  return value;
}

export function requireSessionKey() {
  return requireSessionStorageItem(OPAQUE_SESSION_KEY);
}

export function requireExportKey() {
  return requireSessionStorageItem(OPAQUE_EXPORT_KEY);
}

export function usePrivateRedirect() {
  const router = useRouter();
  const redirect = useCallback(() => {
    router.push("/private");
    // we are refreshing because there is a bug in the router which makes
    // it use a previously cached response even though the page should be dynamic
    // https://github.com/vercel/next.js/issues/49417#issuecomment-1546618485
    router.refresh();
  }, [router]);
  return redirect;
}
