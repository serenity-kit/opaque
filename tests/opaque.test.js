import * as opaque from "../build";

function setupAndRegister(
  clientIdentifier,
  password,
  serverIdentifier = undefined
) {
  const serverSetup = opaque.serverSetup();
  const { clientRegistration, registrationRequest } =
    opaque.clientRegistrationStart(password);
  const registrationResponse = opaque.serverRegistrationStart({
    serverSetup,
    clientIdentifier,
    registrationRequest,
  });
  const { registrationUpload, exportKey, serverStaticPublicKey } =
    opaque.clientRegistrationFinish({
      clientRegistration,
      registrationResponse,
      password,
      clientIdentifier,
      serverIdentifier,
    });
  const passwordFile = opaque.serverRegistrationFinish(registrationUpload);
  return {
    serverSetup,
    passwordFile,
    registrationUpload,
    exportKey,
    serverStaticPublicKey,
  };
}

test("full registration & login flow", () => {
  const clientIdentifier = "user123";
  const password = "hunter42";

  const {
    serverSetup,
    passwordFile,
    registrationUpload,
    exportKey: registrationExportKey,
    serverStaticPublicKey: registrationServerStaticPublicKey,
  } = setupAndRegister(clientIdentifier, password);

  expect(registrationUpload).toEqual(passwordFile);

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { serverLogin, credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    clientIdentifier,
    passwordFile,
    credentialRequest,
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
    clientIdentifier,
  });

  expect(loginResult).not.toBeUndefined();

  const {
    sessionKey: clientSessionKey,
    credentialFinalization,
    exportKey: loginExportKey,
    serverStaticPublicKey: loginServerStaticPublicKey,
  } = loginResult;

  expect(registrationExportKey).toEqual(loginExportKey);
  expect(registrationServerStaticPublicKey).toEqual(loginServerStaticPublicKey);

  const serverSessionKey = opaque.serverLoginFinish({
    serverSetup,
    serverLogin,
    credentialFinalization,
  });

  expect(serverSessionKey).toEqual(clientSessionKey);
});

test("full registration & login with bad password", () => {
  const clientIdentifier = "user123";

  const { serverSetup, passwordFile } = setupAndRegister(
    clientIdentifier,
    "hunter42"
  );
  const { clientLogin, credentialRequest } =
    opaque.clientLoginStart("hunter42");

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    clientIdentifier,
    passwordFile,
    credentialRequest,
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password: "hunter23",
    clientIdentifier,
  });

  expect(loginResult).toBeUndefined();
});

test("full registration & login flow with mismatched custom client identifier on server login", () => {
  const clientIdentifier = "user123";
  const password = "hunter2";

  const { serverSetup, passwordFile } = setupAndRegister(
    clientIdentifier,
    password
  );

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    clientIdentifier,
    passwordFile,
    credentialRequest,
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
    clientIdentifier: clientIdentifier + "abc",
  });

  expect(loginResult).toBeUndefined();
});

test("full registration & login attempt with mismatched serverIdentifier", () => {
  const clientIdentifier = "user123";
  const password = "hunter2";

  const { serverSetup, passwordFile } = setupAndRegister(
    clientIdentifier,
    password,
    "server-ident"
  );

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    clientIdentifier,
    passwordFile,
    credentialRequest,
    serverIdentifier: "server-ident-abc",
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
    clientIdentifier,
    serverIdentifier: "server-ident",
  });

  expect(loginResult).toBeUndefined();
});
