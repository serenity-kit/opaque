import * as opaque from "../build";

function setupAndRegister(username, password, identifiers) {
  const serverSetup = opaque.serverSetup();
  const { clientRegistration, registrationRequest } =
    opaque.clientRegistrationStart(password);
  const registrationResponse = opaque.serverRegistrationStart({
    serverSetup,
    username,
    registrationRequest,
  });
  const registrationMessage = opaque.clientRegistrationFinish({
    clientRegistration,
    registrationResponse,
    password,
    identifiers,
  });
  const passwordFile = opaque.serverRegistrationFinish(registrationMessage);
  return { serverSetup, passwordFile, registrationMessage };
}

test("full registration & login flow", () => {
  const { serverSetup, passwordFile, registrationMessage } = setupAndRegister(
    "user123",
    "hunter42"
  );

  expect(registrationMessage).toEqual(passwordFile);

  const { clientLogin, credentialRequest } =
    opaque.clientLoginStart("hunter42");

  const { serverLogin, credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    username: "user123",
    passwordFile,
    credentialRequest,
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password: "hunter42",
  });

  expect(loginResult).not.toBe(null);

  const { sessionKey: clientSessionKey, credentialFinalization } = loginResult;

  const serverSessionKey = opaque.serverLoginFinish({
    serverSetup,
    serverLogin,
    credentialFinalization,
  });

  expect(serverSessionKey).toEqual(clientSessionKey);
});

test("full registration & login with bad password", () => {
  const { serverSetup, passwordFile } = setupAndRegister("user123", "hunter42");
  const { clientLogin, credentialRequest } =
    opaque.clientLoginStart("hunter42");

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    username: "user123",
    passwordFile,
    credentialRequest,
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password: "hunter23",
  });

  expect(loginResult).toBeUndefined();
});

test("full registration & login flow with custom client identifier", () => {
  const username = "user123";
  const password = "hunter2";

  const { serverSetup, passwordFile } = setupAndRegister(username, password, {
    client: username,
  });

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { serverLogin, credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    username,
    passwordFile,
    credentialRequest,
    identifiers: {
      client: username,
    },
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
    identifiers: {
      client: username,
    },
  });

  expect(loginResult).not.toBe(null);

  const { sessionKey: clientSessionKey, credentialFinalization } = loginResult;

  const serverSessionKey = opaque.serverLoginFinish({
    serverSetup,
    serverLogin,
    credentialFinalization,
  });

  expect(serverSessionKey).toEqual(clientSessionKey);
});

test("full registration & login flow mismatched custom client identifier on server login", () => {
  const username = "user123";
  const password = "hunter2";

  const { serverSetup, passwordFile } = setupAndRegister(username, password, {
    client: username,
  });

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    username,
    passwordFile,
    credentialRequest,
    identifiers: {
      client: username + "abc",
    },
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
    identifiers: {
      client: username,
    },
  });

  expect(loginResult).toBeUndefined();
});
