import * as opaque from "@serenity-kit/opaque";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export async function request(
  method: string,
  path: string,
  body: any = undefined
) {
  console.log(`${method} ${path}`, body);
  const res = await fetch(`${path}`, {
    method,
    body: body && JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const { error } = await res.json();
    console.log(error);
    throw new Error(error);
  }
  return res;
}

export async function register(userIdentifier: string, password: string) {
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password });
  const { registrationResponse } = await request(
    "POST",
    `/api/register/start`,
    {
      userIdentifier,
      registrationRequest,
    }
  ).then((res) => res.json());

  console.log("registrationResponse", registrationResponse);
  const { registrationRecord } = opaque.client.finishRegistration({
    clientRegistrationState,
    registrationResponse,
    password,
  });

  const res = await request("POST", `/api/register/finish`, {
    userIdentifier,
    registrationRecord,
  });
  console.log("finish successful", res.ok);
  return res.ok;
}

export async function login(userIdentifier: string, password: string) {
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  const { loginResponse } = await request("POST", "/api/login/start", {
    userIdentifier,
    startLoginRequest,
  }).then((res) => res.json());

  console.log({ loginResponse });

  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
  });
  console.log({ loginResult });
  if (!loginResult) {
    return null;
  }
  const { sessionKey, finishLoginRequest, exportKey } = loginResult;
  const res = await request("POST", "/api/login/finish", {
    userIdentifier,
    finishLoginRequest,
  });
  return res.ok ? { sessionKey, exportKey } : null;
}

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
