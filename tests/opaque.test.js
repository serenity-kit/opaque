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

describe("clientRegistrationStart", () => {
  test("invalid argument type", () => {
    expect(() => {
      opaque.clientRegistrationStart();
    }).toThrow("password must be a string");
    expect(() => {
      opaque.clientRegistrationStart(123);
    }).toThrow("password must be a string");
    expect(() => {
      opaque.clientRegistrationStart({});
    }).toThrow("password must be a string");
  });
});

describe("clientLoginStart", () => {
  test("invalid argument type", () => {
    expect(() => {
      opaque.clientLoginStart();
    }).toThrow("password must be a string");
    expect(() => {
      opaque.clientLoginStart(123);
    }).toThrow("password must be a string");
    expect(() => {
      opaque.clientLoginStart({});
    }).toThrow("password must be a string");
  });
});

describe("serverRegistrationFinish", () => {
  test("invalid argument type", () => {
    expect(() => {
      opaque.serverRegistrationFinish();
    }).toThrow("message must be a string");
    expect(() => {
      opaque.serverRegistrationFinish(123);
    }).toThrow("message must be a string");
    expect(() => {
      opaque.serverRegistrationFinish({});
    }).toThrow("message must be a string");
  });

  test("invalid message", () => {
    expect(() => {
      opaque.serverRegistrationFinish("");
    }).toThrow(
      'opaque protocol error at "deserialize message"; Internal error encountered'
    );
  });

  test("invalid encoding", () => {
    expect(() => {
      opaque.serverRegistrationFinish("a");
    }).toThrow(
      'base64 decoding failed at "message"; Encoded text cannot have a 6-bit remainder.'
    );
  });
});

describe("serverRegistrationStart", () => {
  test("serverSetup invalid", () => {
    expect(() => {
      const { registrationRequest } = opaque.clientRegistrationStart("hunter2");
      opaque.serverRegistrationStart({
        serverSetup: "abcd",
        clientIdentifier: "user1",
        registrationRequest,
      });
    }).toThrow(
      'opaque protocol error at "deserialize serverSetup"; Internal error encountered'
    );
  });

  test("serverSetup decoding", () => {
    expect(() => {
      const { registrationRequest } = opaque.clientRegistrationStart("hunter2");
      opaque.serverRegistrationStart({
        serverSetup: "a",
        clientIdentifier: "user1",
        registrationRequest,
      });
    }).toThrow(
      'base64 decoding failed at "serverSetup"; Encoded text cannot have a 6-bit remainder.'
    );
  });

  test("registrationRequest invalid", () => {
    expect(() => {
      const serverSetup = opaque.serverSetup();
      opaque.serverRegistrationStart({
        serverSetup,
        clientIdentifier: "user1",
        registrationRequest: "",
      });
    }).toThrow(
      'opaque protocol error at "deserialize registrationRequest"; Internal error encountered'
    );
  });

  test("registrationRequest decoding", () => {
    expect(() => {
      const serverSetup = opaque.serverSetup();
      opaque.serverRegistrationStart({
        serverSetup,
        clientIdentifier: "user1",
        registrationRequest: "a",
      });
    }).toThrow(
      'base64 decoding failed at "registrationRequest"; Encoded text cannot have a 6-bit remainder.'
    );
  });
});
