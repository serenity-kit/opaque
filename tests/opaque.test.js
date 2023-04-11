import * as opaque from "../build";

test("full registration & login flow", () => {
  const server = opaque.serverSetup();
  const { state: clientRegistrationStart, registrationRequest } =
    opaque.clientRegistrationStart("hunter42");
  const registrationResponse = opaque.serverRegistrationStart({
    server,
    username: "user123",
    registrationRequest,
  });

  const registrationMessage = opaque.clientRegistrationFinish({
    state: clientRegistrationStart,
    registrationResponse,
    password: "hunter42",
  });

  const passwordFile = opaque.serverRegistrationFinish(registrationMessage);

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
  const server = opaque.serverSetup();
  const { state: clientRegistrationStart, registrationRequest } =
    opaque.clientRegistrationStart("hunter42");
  const registrationResponse = opaque.serverRegistrationStart({
    server,
    username: "user123",
    registrationRequest,
  });

  const registrationMessage = opaque.clientRegistrationFinish({
    state: clientRegistrationStart,
    registrationResponse,
    password: "hunter42",
  });

  const passwordFile = opaque.serverRegistrationFinish(registrationMessage);

  expect(registrationMessage).toEqual(passwordFile);

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

  expect(loginResult).toBe(null);
});
