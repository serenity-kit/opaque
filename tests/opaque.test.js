import * as opaque from "../build";

function setupAndRegister(username, password, identifiers) {
  const server = opaque.serverSetup();
  const { state: clientRegistrationStart, registrationRequest } =
    opaque.clientRegistrationStart(password);
  const registrationResponse = opaque.serverRegistrationStart({
    server,
    username,
    registrationRequest,
  });
  const registrationMessage = opaque.clientRegistrationFinish({
    state: clientRegistrationStart,
    registrationResponse,
    password,
    identifiers,
  });
  const passwordFile = opaque.serverRegistrationFinish(registrationMessage);
  return { server, passwordFile, registrationMessage };
}

test("full registration & login flow", () => {
  const { server, passwordFile, registrationMessage } = setupAndRegister(
    "user123",
    "hunter42"
  );

  expect(registrationMessage).toEqual(passwordFile);

  const { state: clientLoginStart, credentialRequest } =
    opaque.clientLoginStart("hunter42");

  const { state: serverLoginStart, credentialResponse } =
    opaque.serverLoginStart({
      server,
      username: "user123",
      passwordFile,
      credentialRequest,
    });

  const loginResult = opaque.clientLoginFinish({
    state: clientLoginStart,
    credentialResponse,
    password: "hunter42",
  });

  expect(loginResult).not.toBe(null);

  const { sessionKey: clientSessionKey, credentialFinalization } = loginResult;

  const serverSessionKey = opaque.serverLoginFinish({
    server,
    state: serverLoginStart,
    credentialFinalization,
  });

  expect(serverSessionKey).toEqual(clientSessionKey);
});

test("full registration & login with bad password", () => {
  const { server, passwordFile } = setupAndRegister("user123", "hunter42");
  const { state: clientLoginStart, credentialRequest } =
    opaque.clientLoginStart("hunter42");

  const { credentialResponse } = opaque.serverLoginStart({
    server,
    username: "user123",
    passwordFile,
    credentialRequest,
  });

  const loginResult = opaque.clientLoginFinish({
    state: clientLoginStart,
    credentialResponse,
    password: "hunter23",
  });

  expect(loginResult).toBeUndefined();
});

test("full registration & login flow with custom client identifier", () => {
  const username = "user123";
  const password = "hunter2";

  const { server, passwordFile } = setupAndRegister(username, password, {
    client: username,
  });

  const { state: clientLoginStart, credentialRequest } =
    opaque.clientLoginStart(password);

  const { state: serverLoginStart, credentialResponse } =
    opaque.serverLoginStart({
      server,
      username,
      passwordFile,
      credentialRequest,
      identifiers: {
        client: username,
      },
    });

  const loginResult = opaque.clientLoginFinish({
    state: clientLoginStart,
    credentialResponse,
    password,
    identifiers: {
      client: username,
    },
  });

  expect(loginResult).not.toBe(null);

  const { sessionKey: clientSessionKey, credentialFinalization } = loginResult;

  const serverSessionKey = opaque.serverLoginFinish({
    server,
    state: serverLoginStart,
    credentialFinalization,
  });

  expect(serverSessionKey).toEqual(clientSessionKey);
});

test("full registration & login flow mismatched custom client identifier on server login", () => {
  const username = "user123";
  const password = "hunter2";

  const { server, passwordFile } = setupAndRegister(username, password, {
    client: username,
  });

  const { state: clientLoginStart, credentialRequest } =
    opaque.clientLoginStart(password);

  const { credentialResponse } = opaque.serverLoginStart({
    server,
    username,
    passwordFile,
    credentialRequest,
    identifiers: {
      client: username + "abc",
    },
  });

  const loginResult = opaque.clientLoginFinish({
    state: clientLoginStart,
    credentialResponse,
    password,
    identifiers: {
      client: username,
    },
  });

  expect(loginResult).toBeUndefined();
});
