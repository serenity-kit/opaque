"use client";

import * as opaque from "@serenity-kit/opaque";
import { useState } from "react";
import { Locker } from "./utils/locker";
import { createLocker } from "./utils/locker/client/createLocker";
import { decryptLocker } from "./utils/locker/client/decryptLocker";

async function request(method: string, path: string, body: any = undefined) {
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

async function register(userIdentifier: string, password: string) {
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

async function login(userIdentifier: string, password: string) {
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
  const res = await fetch("/api/locker");
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
    <div className="px-12 space-y-4">
      <h2 className="text-xl font-semibold">Locker</h2>

      <form
        className="flex flex-col items-start space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
      >
        <textarea
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

type LoginState = { sessionKey: string; exportKey: string } | null;

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loginState, setLoginState] = useState<LoginState>(null);
  const [lockerSecret, setLockerSecret] = useState<string>("");

  return (
    <>
      <form
        id="form"
        className="p-12 space-y-4 max-w-xl"
        onSubmit={async (
          e: React.FormEvent<HTMLFormElement> & {
            nativeEvent: { submitter: HTMLButtonElement };
          }
        ) => {
          e.preventDefault();
          const action = e.nativeEvent.submitter.value;
          try {
            if (action === "login") {
              const loginResult = await login(username, password);
              if (loginResult) {
                alert(
                  `User "${username}" logged in successfully; sessionKey = ${loginResult.sessionKey}`
                );
                const locker = await fetchLocker();
                if (locker != null) {
                  const secret = decryptLocker({
                    locker,
                    exportKey: loginResult.exportKey,
                  });
                  if (typeof secret !== "string") throw new TypeError();
                  console.log("decrypted locker:", secret);
                  setLockerSecret(secret);
                } else {
                  console.log("no locker content found");
                }
                setLoginState(loginResult);
              } else {
                alert(`User "${username}" login failed`);
                setLoginState(null);
              }
            } else if (action === "register") {
              const ok = await register(username, password);
              if (ok) {
                alert(`User "${username}" registered successfully`);
              } else {
                alert(`Failed to register user "${username}"`);
              }
            }
          } catch (err) {
            console.error(err);
            alert(err);
          }
        }}
      >
        <h1 className="text-xl font-semibold">Login/Register</h1>

        <div className="space-y-2 flex flex-col">
          <input
            required
            className="border border-slate-300 p-2 rounded"
            name="username"
            placeholder="Username"
            type="text"
            autoComplete="off"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />

          <input
            required
            className="border border-slate-300 p-2 rounded"
            name="password"
            placeholder="Password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />

          <div className="space-x-2">
            <Button name="action" value="login">
              Login
            </Button>
            <Button name="action" value="register">
              Register
            </Button>
          </div>
        </div>
      </form>

      {loginState != null && (
        <LockerForm
          secret={lockerSecret}
          onChange={(secret) => {
            setLockerSecret(secret);
          }}
          onSubmit={async () => {
            console.log(loginState);
            const locker = createLocker({
              data: lockerSecret,
              exportKey: loginState.exportKey,
              sessionKey: loginState.sessionKey,
            });
            console.log(locker);
            const res = await request("POST", "/api/locker", locker);

            //TODO send to server
          }}
        />
      )}

      <div className="p-12 space-y-4 max-w-xl">
        <p className="text-gray-500 text-sm">
          Run full flow in-memory demo (check console.log output).
        </p>
        <Button
          name="login"
          onClick={() => {
            runFullFlowDemo();
          }}
        >
          Demo
        </Button>
      </div>
    </>
  );
}

type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
>;

function Button(props: ButtonProps) {
  return (
    <button
      className="bg-blue-500 py-1 px-3 text-white font-semibold rounded hover:bg-blue-600 shadow"
      {...props}
    />
  );
}

function runFullFlowDemo() {
  const serverSetup = opaque.server.createSetup();
  const username = "user@example.com";
  const password = "hunter2";
  runFullServerClientFlow(serverSetup, username, password);
}

function runFullServerClientFlow(
  serverSetup: string,
  username: string,
  password: string
) {
  console.log("############################################");
  console.log("#                                          #");
  console.log("#   Running Demo Registration/Login Flow   #");
  console.log("#                                          #");
  console.log("############################################");

  console.log({ serverSetup, username, password });

  console.log();
  console.log("client.startRegistration");
  console.log("-----------------------");
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password });

  console.log({ clientRegistrationState, registrationRequest });

  console.log();
  console.log("server.createRegistrationResponse");
  console.log("-----------------------");
  const { registrationResponse } = opaque.server.createRegistrationResponse({
    serverSetup,
    registrationRequest,
    userIdentifier: username,
  });

  console.log({ registrationResponse });

  console.log();
  console.log("client.finishRegistration");
  console.log("------------------------");
  const {
    registrationRecord,
    exportKey: clientRegExportKey,
    serverStaticPublicKey: clientRegServerStaticPublicKey,
  } = opaque.client.finishRegistration({
    password,
    clientRegistrationState,
    registrationResponse,
  });

  console.log({
    clientRegExportKey,
    clientRegServerStaticPublicKey,
    registrationRecord,
  });

  console.log();
  console.log("client.startLogin");
  console.log("----------------");
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  console.log({ clientLoginState, startLoginRequest });

  console.log();
  console.log("server.startLogin");
  console.log("----------------");
  const { loginResponse, serverLoginState } = opaque.server.startLogin({
    userIdentifier: username,
    registrationRecord,
    serverSetup,
    startLoginRequest,
  });

  console.log({ loginResponse, serverLoginState });

  console.log();
  console.log("client.finishLogin");
  console.log("-----------------");
  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
  });

  if (loginResult == null) {
    console.log("loginResult is NULL; login failed");
    return;
  }

  const {
    finishLoginRequest,
    exportKey: clientLoginExportKey,
    serverStaticPublicKey: clientLoginServerStaticPublicKey,
    sessionKey: clientSessionKey,
  } = loginResult;

  console.log({
    clientLoginExportKey,
    clientSessionKey,
    clientLoginServerStaticPublicKey,
    finishLoginRequest,
  });

  console.log();
  console.log("server.finishLogin");
  console.log("-----------------");
  const serverSessionKey = opaque.server.finishLogin({
    finishLoginRequest,
    serverLoginState,
  });

  console.log({ serverSessionKey });
}
