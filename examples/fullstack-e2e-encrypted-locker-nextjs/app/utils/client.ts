import * as opaque from "@serenity-kit/opaque";
import { createRecoveryLockbox } from "./locker/client/createRecoveryLockbox";
import isLockerObject from "./isLockerObject";
import isRecoveryLockboxObject from "./isRecoveryLockboxObject";

export async function request(
  method: string,
  path: string,
  body: any = undefined,
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
    },
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

export async function logout() {
  await request("POST", "/api/logout");
}

export function deleteRecovery() {
  return request("DELETE", "/api/recovery");
}

export async function registerRecovery({
  recoveryKey,
  exportKey,
}: {
  recoveryKey: string;
  exportKey: string;
}) {
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password: recoveryKey });
  const { registrationResponse } = await request(
    "POST",
    `/api/recovery/register/start`,
    {
      registrationRequest,
    },
  ).then((res) => res.json());

  console.log("registrationResponse", registrationResponse);

  const { registrationRecord, exportKey: recoveryExportKey } =
    opaque.client.finishRegistration({
      clientRegistrationState,
      registrationResponse,
      password: recoveryKey,
    });

  const recoveryLockbox = createRecoveryLockbox({
    exportKey,
    recoveryExportKey,
  });

  const res = await request("POST", `/api/recovery/register/finish`, {
    recoveryLockbox,
    registrationRecord,
  });
  console.log("finish successful", res.ok);
  return res.ok;
}

export async function loginRecovery(userIdentifier: string, password: string) {
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  const { loginResponse } = await request("POST", "/api/recovery/login/start", {
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
  const { finishLoginRequest, exportKey: recoveryExportKey } = loginResult;
  const res = await request("POST", "/api/recovery/login/finish", {
    userIdentifier,
    finishLoginRequest,
  });
  const { locker, recoveryLockbox } = await res.json();
  if (!isLockerObject(locker) || !isRecoveryLockboxObject(recoveryLockbox)) {
    throw new Error("unexpected response data");
  }
  return res.ok ? { recoveryExportKey, locker, recoveryLockbox } : null;
}
