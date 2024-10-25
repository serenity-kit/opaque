import * as opaque from "@serenity-kit/opaque";

const host = "/api";

const form = requireFormElement("form");
const runFullFlowDemoButton = requireElement("run_full_flow_demo");

form.addEventListener("submit", handleSubmit);
runFullFlowDemoButton.addEventListener("click", runFullFlowDemo);

/**
 * @param {string} key
 * @returns {HTMLFormElement}
 */
function requireFormElement(key) {
  const elem = document.getElementById(key);
  if (elem && elem.tagName === "FORM")
    return /** @type {HTMLFormElement} */ (elem);
  throw new Error(`no form element found with id "${key}"`);
}

/**
 * @param {string} key
 * @returns {HTMLElement}
 */
function requireElement(key) {
  const elem = document.getElementById(key);
  if (elem) return elem;
  throw new Error(`no element found with id "${key}"`);
}

/**
 * @param {string} method
 * @param {string} path
 * @param {any} body
 */
async function request(method, path, body = undefined) {
  console.log(`${method} ${host}${path}`, body);
  const res = await fetch(`${host}${path}`, {
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

/**
 * @param {string} userIdentifier
 * @param {string} password
 */
async function register(userIdentifier, password) {
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password });
  const { registrationResponse } = await request("POST", `/register/start`, {
    userIdentifier,
    registrationRequest,
  }).then((res) => res.json());

  console.log("registrationResponse", registrationResponse);
  const { registrationRecord } = opaque.client.finishRegistration({
    clientRegistrationState,
    registrationResponse,
    password,
    keyStretchingFunctionConfig: "memory-constrained",
  });

  const res = await request("POST", `/register/finish`, {
    userIdentifier,
    registrationRecord,
  });
  console.log("finish successful", res.ok);
  return res.ok;
}

/**
 * @param {string} userIdentifier
 * @param {string} password
 */
async function login(userIdentifier, password) {
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  const { loginResponse } = await request("POST", "/login/start", {
    userIdentifier,
    startLoginRequest,
  }).then((res) => res.json());

  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
    keyStretchingFunctionConfig: "memory-constrained",
  });

  if (!loginResult) {
    return null;
  }
  const { sessionKey, finishLoginRequest } = loginResult;
  const res = await request("POST", "/login/finish", {
    userIdentifier,
    finishLoginRequest,
  });
  return res.ok ? sessionKey : null;
}

/**
 * @this {HTMLFormElement}
 * @param {SubmitEvent} e
 */
async function handleSubmit(e) {
  e.preventDefault();
  const username = this.username.value;
  const password = this.password.value;
  const action = e.submitter
    ? /** @type {HTMLButtonElement} */ (e.submitter).name
    : "";

  try {
    if (action === "login") {
      const sessionKey = await login(username, password);
      if (sessionKey) {
        alert(
          `User "${username}" logged in successfully; sessionKey = ${sessionKey}`,
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

function runFullFlowDemo() {
  const serverSetup = opaque.server.createSetup();
  const username = "user@example.com";
  const password = "hunter2";
  runFullServerClientFlow(serverSetup, username, password);
}

/**
 * @param {string} serverSetup
 * @param {string} username
 * @param {string} password
 */
function runFullServerClientFlow(serverSetup, username, password) {
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
    keyStretchingFunctionConfig: "memory-constrained",
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
    keyStretchingFunctionConfig: "memory-constrained",
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
  const { sessionKey: serverSessionKey } = opaque.server.finishLogin({
    finishLoginRequest,
    serverLoginState,
  });

  console.log({ serverSessionKey });
}
