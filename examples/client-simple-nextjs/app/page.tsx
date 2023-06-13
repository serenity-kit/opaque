"use client";

import * as opaque from "@serenity-kit/opaque";
import { useState } from "react";

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
  const { clientRegistration, registrationRequest } =
    opaque.clientRegistrationStart(password);
  const { registrationResponse } = await request(
    "POST",
    `/api/register/start`,
    {
      userIdentifier,
      registrationRequest,
    }
  ).then((res) => res.json());

  console.log("registrationResponse", registrationResponse);
  const { registrationUpload } = opaque.clientRegistrationFinish({
    clientRegistration,
    registrationResponse,
    password,
  });

  const res = await request("POST", `/api/register/finish`, {
    userIdentifier,
    registrationUpload,
  });
  console.log("finish successful", res.ok);
  return res.ok;
}

async function login(userIdentifier: string, password: string) {
  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = await request("POST", "/login/start", {
    userIdentifier,
    credentialRequest,
  }).then((res) => res.json());

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
  });

  if (!loginResult) {
    return null;
  }
  const { sessionKey, credentialFinalization } = loginResult;
  const res = await request("POST", "/login/finish", {
    userIdentifier,
    credentialFinalization,
  });
  return res.ok ? sessionKey : null;
}

async function handleSubmit(
  action: string,
  username: string,
  password: string
) {
  try {
    if (action === "login") {
      const sessionKey = await login(username, password);
      if (sessionKey) {
        alert(
          `User "${username}" logged in successfully; sessionKey = ${sessionKey}`
        );
      } else {
        alert(`User "${username}" login failed`);
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
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <form
        id="form"
        className="p-12 space-y-4 max-w-xl"
        onSubmit={(
          e: React.FormEvent<HTMLFormElement> & {
            nativeEvent: { submitter: HTMLButtonElement };
          }
        ) => {
          e.preventDefault();
          const action = e.nativeEvent.submitter.value;
          handleSubmit(action, username, password);
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
  const serverSetup = opaque.createServerSetup();
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
  console.log("clientRegistrationStart");
  console.log("-----------------------");
  const { clientRegistration, registrationRequest } =
    opaque.clientRegistrationStart(password);

  console.log({ clientRegistration, registrationRequest });

  console.log();
  console.log("serverRegistrationStart");
  console.log("-----------------------");
  const registrationResponse = opaque.serverRegistrationStart({
    serverSetup,
    registrationRequest,
    userIdentifier: username,
  });

  console.log({ registrationResponse });

  console.log();
  console.log("clientRegistrationFinish");
  console.log("------------------------");
  const {
    registrationUpload,
    exportKey: clientRegExportKey,
    serverStaticPublicKey: clientRegServerStaticPublicKey,
  } = opaque.clientRegistrationFinish({
    password,
    clientRegistration,
    registrationResponse,
  });

  console.log({ clientRegExportKey, clientRegServerStaticPublicKey });

  console.log();
  console.log("serverRegistrationFinish");
  console.log("------------------------");
  const passwordFile = opaque.serverRegistrationFinish(registrationUpload);

  console.log({ passwordFile });

  console.log();
  console.log("clientLoginStart");
  console.log("----------------");
  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  console.log({ clientLogin, credentialRequest });

  console.log();
  console.log("serverLoginStart");
  console.log("----------------");
  const { credentialResponse, serverLogin } = opaque.serverLoginStart({
    userIdentifier: username,
    passwordFile,
    serverSetup,
    credentialRequest,
  });

  console.log({ credentialResponse, serverLogin });

  console.log();
  console.log("clientLoginFinish");
  console.log("-----------------");
  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
  });

  if (loginResult == null) {
    console.log("loginResult is NULL; login failed");
    return;
  }

  const {
    credentialFinalization,
    exportKey: clientLoginExportKey,
    serverStaticPublicKey: clientLoginServerStaticPublicKey,
    sessionKey: clientSessionKey,
  } = loginResult;

  console.log({
    clientLoginExportKey,
    clientSessionKey,
    clientLoginServerStaticPublicKey,
    credentialFinalization,
  });

  console.log();
  console.log("serverLoginFinish");
  console.log("-----------------");
  const serverSessionKey = opaque.serverLoginFinish({
    credentialFinalization,
    serverLogin,
  });

  console.log({ serverSessionKey });
}
