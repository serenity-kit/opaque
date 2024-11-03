import * as opaque from "@serenity-kit/opaque";

const host = "/api";

const passwordResetConfirm = requireFormElement("password_reset_confirm");
const passwordResetForm = requireFormElement("password_reset_form");
const passwordReset = requireElement("password_reset");
const form = requireFormElement("form");
const showPasswordResetFormButton = requireElement("show_password_reset_form");
const runFullFlowDemoButton = requireElement("run_full_flow_demo");
const cancelPasswordResetButton = requireElement("cancel_password_reset");
const cancelPasswordResetConfirmButton = requireElement(
  "cancel_password_reset_confirm",
);

form.addEventListener("submit", handleSubmit);
showPasswordResetFormButton.addEventListener("click", () => {
  showPasswordResetForm(true);
});
runFullFlowDemoButton.addEventListener("click", runFullFlowDemo);
passwordReset.addEventListener("click", handleBackdropClick);
passwordResetForm.addEventListener("submit", handleSubmitPasswordReset);
cancelPasswordResetButton.addEventListener("click", cancelPasswordReset);
passwordResetConfirm.addEventListener(
  "submit",
  handleSubmitPasswordResetConfirm,
);
cancelPasswordResetConfirmButton.addEventListener("click", cancelPasswordReset);

showPasswordResetForm(false);

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
    keyStretching: "memory-constrained",
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
    keyStretching: "memory-constrained",
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

/**
 * @this {HTMLFormElement}
 * @param {SubmitEvent} e
 */
async function handleSubmitPasswordReset(e) {
  e.preventDefault();

  const userIdentifier = this.username.value;

  try {
    await request("POST", "/password-reset/initiate", {
      userIdentifier,
    });
    showPasswordResetConfirm(true);
  } catch (err) {
    console.error(err);
    alert(err);
  }
}

/**
 * @this {HTMLFormElement}
 * @param {SubmitEvent} e
 */
async function handleSubmitPasswordResetConfirm(e) {
  try {
    e.preventDefault();
    const password = this.password.value;
    const resetCode = this.code.value;
    const userIdentifier = passwordResetForm.username.value;

    const { clientRegistrationState, registrationRequest } =
      opaque.client.startRegistration({ password });

    const { registrationResponse } = await request(
      "POST",
      `/password-reset/confirm-start`,
      {
        userIdentifier,
        resetCode,
        registrationRequest,
      },
    ).then((res) => res.json());

    console.log("registrationResponse", registrationResponse);
    const { registrationRecord } = opaque.client.finishRegistration({
      clientRegistrationState,
      registrationResponse,
      password,
      keyStretching: "memory-constrained",
    });

    const res = await request("POST", `/password-reset/confirm-finish`, {
      userIdentifier,
      resetCode,
      registrationRecord,
    });
    console.log("finish successful", res.ok);

    cancelPasswordReset();
    alert(`Password reset for "${userIdentifier}" successful`);
  } catch (err) {
    showPasswordResetConfirm(false);
    console.error(err);
    alert(err);
  }
}

/**
 * @param {boolean} show
 */
function showPasswordResetConfirm(show) {
  if (show) {
    passwordResetConfirm.reset();
    passwordResetConfirm.classList.remove("hidden");
    passwordResetForm.classList.add("hidden");
    passwordResetConfirm.querySelector("input")?.focus();
  } else {
    passwordResetConfirm.classList.add("hidden");
    passwordResetForm.classList.remove("hidden");
  }
}

function cancelPasswordReset() {
  showPasswordResetConfirm(false);
  showPasswordResetForm(false);
}

/**
 * @param {boolean} show
 */
function showPasswordResetForm(show) {
  passwordReset.style.display = show ? "flex" : "none";
  if (show) {
    passwordResetForm.reset();
    passwordResetForm.querySelector("input")?.focus();
  }
}

/**
 * @param {Event} e
 */
function handleBackdropClick(e) {
  if (
    !passwordResetForm.contains(/** @type {Node} */ (e.target)) &&
    !passwordResetConfirm.contains(/** @type {Node} */ (e.target))
  ) {
    showPasswordResetConfirm(false);
    showPasswordResetForm(false);
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
    keyStretching: "memory-constrained",
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
    keyStretching: "memory-constrained",
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
