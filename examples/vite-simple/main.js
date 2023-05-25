import * as opaque from "@serenity-kit/opaque";

const host = "http://localhost:8089";

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

async function register(credentialIdentifier, password) {
  const { clientRegistration, registrationRequest } =
    opaque.clientRegistrationStart(password);
  const { registrationResponse } = await request("POST", `/register/start`, {
    credentialIdentifier,
    registrationRequest,
  }).then((res) => res.json());

  console.log("registrationResponse", registrationResponse);
  const { registrationUpload } = opaque.clientRegistrationFinish({
    credentialIdentifier,
    clientRegistration,
    registrationResponse,
    password,
  });

  const res = await request("POST", `/register/finish`, {
    credentialIdentifier,
    registrationUpload,
  });
  console.log("finish successful", res.ok);
  return res.ok;
}

async function login(credentialIdentifier, password) {
  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = await request("POST", "/login/start", {
    credentialIdentifier,
    credentialRequest,
  }).then((res) => res.json());

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    credentialIdentifier,
    password,
  });

  if (!loginResult) {
    return null;
  }
  const { sessionKey, credentialFinalization } = loginResult;
  const res = await request("POST", "/login/finish", {
    credentialIdentifier,
    credentialFinalization,
  });
  return res.ok ? sessionKey : null;
}

window.runFullFlowDemo = function () {
  const serverSetup = opaque.serverSetup();
  const username = "user@example.com";
  const password = "hunter2";
  runFullServerClientFlow(serverSetup, username, password);
};

function runFullServerClientFlow(serverSetup, username, password) {
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
    credentialIdentifier: username,
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
    credentialIdentifier: username,
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

window.handleSubmit = async function handleSubmit() {
  event.preventDefault();

  const username = event.target.username.value;
  const password = event.target.password.value;
  const action = event.submitter.name;

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
};
