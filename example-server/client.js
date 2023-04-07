import fetch from "node-fetch";
import * as opaque from "opaque";

const host = "http://localhost:8089";

async function request(method, path, body = undefined) {
  console.log(`${method} ${host}${path}`, body);
  const res = await fetch(`${host}${path}`, {
    method,
    body: body && JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Http Status ${res.status}`);
  console.log(res.status);
  return res;
}

async function register(username, password) {
  const regStart = opaque.clientRegisterStart(password);
  const registrationRequest = regStart.getRegistrationRequest();
  const { registrationResponse } = await request("POST", `/register/start`, {
    username,
    registrationRequest,
  }).then((res) => res.json());

  console.log("registrationResponse", registrationResponse);
  const registrationMessage = regStart.finish(password, registrationResponse);
  const res = await request("POST", `/register/finish`, {
    username,
    registrationMessage,
  });
  console.log("finish successful", res.ok);
  return res.ok;
}

async function login(username, password) {
  const loginStart = opaque.clientLoginStart(password);
  const credentialRequest = loginStart.getCredentialRequest();
  const { credentialResponse } = await request("POST", "/login/start", {
    username,
    credentialRequest,
  }).then((res) => res.json());

  const loginResult = loginStart.finish(password, credentialResponse);
  const credentialFinalization = loginResult.getCredentialFinalization();
  const res = await request("POST", "/login/finish", {
    username,
    credentialFinalization,
  });
  const sessionKey = loginResult.getSessionKey();
  return res.ok ? sessionKey : null;
}

async function main() {
  const username = "user123";
  const password = "hunter42";
  await register(username, password);
  const sessionKey = await login(username, password);

  const { message } = await fetch(`${host}/private`, {
    headers: {
      Authorization: sessionKey,
    },
  }).then((res) => res.json());

  console.log(message);
}

main().catch((err) => console.error(err));
