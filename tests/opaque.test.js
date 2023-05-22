import * as opaqueP256 from "../build/p256";
import * as opaqueRistretto from "../build/ristretto";

const opaque =
  process.env.OPAQUE_BUILD === "p256" ? opaqueP256 : opaqueRistretto;

function setupAndRegister(
  credentialIdentifier,
  password,
  { serverIdentifier, clientIdentifier } = {}
) {
  const serverSetup = opaque.serverSetup();
  const { clientRegistration, registrationRequest } =
    opaque.clientRegistrationStart(password);
  const registrationResponse = opaque.serverRegistrationStart({
    serverSetup,
    credentialIdentifier,
    clientIdentifier,
    registrationRequest,
  });
  const { registrationUpload, exportKey, serverStaticPublicKey } =
    opaque.clientRegistrationFinish({
      clientRegistration,
      registrationResponse,
      password,
      credentialIdentifier,
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
  const credentialIdentifier = "user123";
  const password = "hunter42";

  const {
    serverSetup,
    passwordFile,
    registrationUpload,
    exportKey: registrationExportKey,
    serverStaticPublicKey: registrationServerStaticPublicKey,
  } = setupAndRegister(credentialIdentifier, password);

  expect(registrationUpload).toEqual(passwordFile);

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { serverLogin, credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    credentialIdentifier,
    passwordFile,
    credentialRequest,
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
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
  const credentialIdentifier = "user123";

  const { serverSetup, passwordFile } = setupAndRegister(
    credentialIdentifier,
    "hunter42"
  );
  const { clientLogin, credentialRequest } =
    opaque.clientLoginStart("hunter42");

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    credentialIdentifier,
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

test("full registration & login flow with mismatched custom client identifier on server login", () => {
  const credentialIdentifier = "user123";
  const clientIdentifier = "client123";
  const password = "hunter2";

  const { serverSetup, passwordFile } = setupAndRegister(
    credentialIdentifier,
    password,
    { clientIdentifier }
  );

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    credentialIdentifier,
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
  const credentialIdentifier = "client123";
  const password = "hunter2";

  const { serverSetup, passwordFile } = setupAndRegister(
    credentialIdentifier,
    password,
    { serverIdentifier: "server-ident" }
  );

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    passwordFile,
    credentialRequest,
    credentialIdentifier,
    serverIdentifier: "server-ident-abc",
  });

  const loginResult = opaque.clientLoginFinish({
    clientLogin,
    credentialResponse,
    password,
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
  test("invalid params type", () => {
    expect(() => opaque.serverRegistrationStart()).toThrow(
      "invalid type: unit value, expected struct ServerRegistrationStartParams"
    );
    expect(() => opaque.serverRegistrationStart(123)).toThrow(
      "invalid type: floating point `123`, expected struct ServerRegistrationStartParams"
    );
    expect(() => opaque.serverRegistrationStart("test")).toThrow(
      'invalid type: string "test", expected struct ServerRegistrationStartParams'
    );
  });

  test("incomplete params object", () => {
    expect(() => opaque.serverRegistrationStart({})).toThrow(
      "missing field `serverSetup`"
    );
    expect(() => opaque.serverRegistrationStart({ serverSetup: "" })).toThrow(
      "missing field `credentialIdentifier`"
    );
    expect(() =>
      opaque.serverRegistrationStart({
        serverSetup: "",
        credentialIdentifier: "",
      })
    ).toThrow("missing field `registrationRequest`");
  });

  test("serverSetup invalid", () => {
    expect(() => {
      const { registrationRequest } = opaque.clientRegistrationStart("hunter2");
      opaque.serverRegistrationStart({
        serverSetup: "abcd",
        credentialIdentifier: "user1",
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
        credentialIdentifier: "user1",
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
        credentialIdentifier: "user1",
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
        credentialIdentifier: "user1",
        registrationRequest: "a",
      });
    }).toThrow(
      'base64 decoding failed at "registrationRequest"; Encoded text cannot have a 6-bit remainder.'
    );
  });
});
