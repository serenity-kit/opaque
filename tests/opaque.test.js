import * as opaqueP256 from "../build/p256";
import * as opaqueRistretto from "../build/ristretto";

const opaque =
  process.env.OPAQUE_BUILD === "p256" ? opaqueP256 : opaqueRistretto;

/**
 * @typedef {{client?:string;server?:string}} Identifiers
 */

/**
 * @param {string} userIdentifier
 * @param {string} password
 * @param {Identifiers|undefined} identifiers
 */
function setupAndRegister(userIdentifier, password, identifiers = undefined) {
  const serverSetup = opaque.server.createServerSetup();
  const { clientRegistration, registrationRequest } =
    opaque.client.startRegistration(password);
  const registrationResponse = opaque.server.startRegistration({
    serverSetup,
    userIdentifier,
    registrationRequest,
  });
  const { registrationUpload, exportKey, serverStaticPublicKey } =
    opaque.client.finishRegistration({
      clientRegistration,
      registrationResponse,
      password,
      identifiers,
    });
  const passwordFile = opaque.server.finishRegistration(registrationUpload);
  return {
    serverSetup,
    passwordFile,
    registrationUpload,
    exportKey,
    serverStaticPublicKey,
  };
}

beforeAll(async () => {
  await opaque.ready;
});

test("full registration & login flow", () => {
  const userIdentifier = "user123";
  const password = "hunter42";

  const {
    serverSetup,
    passwordFile,
    registrationUpload,
    exportKey: registrationExportKey,
    serverStaticPublicKey: registrationServerStaticPublicKey,
  } = setupAndRegister(userIdentifier, password);

  expect(registrationUpload).toEqual(passwordFile);

  const { clientLogin, credentialRequest } = opaque.client.startLogin(password);

  const { serverLogin, credentialResponse } = opaque.server.startLogin({
    serverSetup,
    userIdentifier,
    passwordFile,
    credentialRequest,
  });

  const loginResult = opaque.client.finishLogin({
    clientLogin,
    credentialResponse,
    password,
  });

  expect(loginResult).not.toBeUndefined();

  if (!loginResult) throw new TypeError(); // for typescript

  const {
    sessionKey: clientSessionKey,
    credentialFinalization,
    exportKey: loginExportKey,
    serverStaticPublicKey: loginServerStaticPublicKey,
  } = loginResult;

  expect(registrationExportKey).toEqual(loginExportKey);
  expect(registrationServerStaticPublicKey).toEqual(loginServerStaticPublicKey);

  const serverSessionKey = opaque.server.finishLogin({
    serverLogin,
    credentialFinalization,
  });

  expect(serverSessionKey).toEqual(clientSessionKey);
});

test("full registration & login with bad password", () => {
  const userIdentifier = "user123";

  const { serverSetup, passwordFile } = setupAndRegister(
    userIdentifier,
    "hunter42"
  );
  const { clientLogin, credentialRequest } =
    opaque.client.startLogin("hunter42");

  const { credentialResponse } = opaque.server.startLogin({
    serverSetup,
    userIdentifier,
    passwordFile,
    credentialRequest,
  });

  const loginResult = opaque.client.finishLogin({
    clientLogin,
    credentialResponse,
    password: "hunter23",
  });

  expect(loginResult).toBeUndefined();
});

test("full registration & login flow with mismatched custom client identifier on server login", () => {
  const userIdentifier = "user123";
  const client = "client123";
  const password = "hunter2";

  const { serverSetup, passwordFile } = setupAndRegister(
    userIdentifier,
    password,
    { client }
  );

  const { clientLogin, credentialRequest } = opaque.client.startLogin(password);

  const { credentialResponse } = opaque.server.startLogin({
    serverSetup,
    userIdentifier,
    passwordFile,
    credentialRequest,
    identifiers: {
      client,
    },
  });

  const loginResult = opaque.client.finishLogin({
    clientLogin,
    credentialResponse,
    password,
    identifiers: {
      client: client + "abc",
    },
  });

  expect(loginResult).toBeUndefined();
});

test("full registration & login attempt with mismatched server identifier", () => {
  const userIdentifier = "client123";
  const password = "hunter2";

  const { serverSetup, passwordFile } = setupAndRegister(
    userIdentifier,
    password,
    { server: "server-ident" }
  );

  const { clientLogin, credentialRequest } = opaque.client.startLogin(password);

  const { credentialResponse } = opaque.server.startLogin({
    serverSetup,
    passwordFile,
    credentialRequest,
    userIdentifier,
    identifiers: {
      server: "server-ident-abc",
    },
  });

  const loginResult = opaque.client.finishLogin({
    clientLogin,
    credentialResponse,
    password,
    identifiers: {
      server: "server-ident",
    },
  });

  expect(loginResult).toBeUndefined();
});

describe("clientRegistrationStart", () => {
  test("invalid argument type", () => {
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.client.startRegistration();
    }).toThrow("password must be a string");
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.client.startRegistration(123);
    }).toThrow("password must be a string");
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.client.startRegistration({});
    }).toThrow("password must be a string");
  });
});

describe("clientLoginStart", () => {
  test("invalid argument type", () => {
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.client.startLogin();
    }).toThrow("password must be a string");
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.client.startLogin(123);
    }).toThrow("password must be a string");
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.client.startLogin({});
    }).toThrow("password must be a string");
  });
});

describe("serverRegistrationFinish", () => {
  test("invalid argument type", () => {
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.server.finishRegistration();
    }).toThrow("message must be a string");
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.server.finishRegistration(123);
    }).toThrow("message must be a string");
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.server.finishRegistration({});
    }).toThrow("message must be a string");
  });

  test("invalid message", () => {
    expect(() => {
      opaque.server.finishRegistration("");
    }).toThrow(
      'opaque protocol error at "deserialize message"; Internal error encountered'
    );
  });

  test("invalid encoding", () => {
    expect(() => {
      opaque.server.finishRegistration("a");
    }).toThrow(
      'base64 decoding failed at "message"; Encoded text cannot have a 6-bit remainder.'
    );
  });
});

describe("serverRegistrationStart", () => {
  test("invalid params type", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startRegistration()
    ).toThrow(
      "invalid type: unit value, expected struct ServerRegistrationStartParams"
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startRegistration(123)
    ).toThrow(
      "invalid type: floating point `123`, expected struct ServerRegistrationStartParams"
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startRegistration("test")
    ).toThrow(
      'invalid type: string "test", expected struct ServerRegistrationStartParams'
    );
  });

  test("incomplete params object", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startRegistration({})
    ).toThrow("missing field `serverSetup`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startRegistration({ serverSetup: "" })
    ).toThrow("missing field `userIdentifier`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startRegistration({
        serverSetup: "",
        userIdentifier: "",
      })
    ).toThrow("missing field `registrationRequest`");
  });

  test("serverSetup invalid", () => {
    expect(() => {
      const { registrationRequest } =
        opaque.client.startRegistration("hunter2");
      opaque.server.startRegistration({
        serverSetup: "abcd",
        userIdentifier: "user1",
        registrationRequest,
      });
    }).toThrow(
      'opaque protocol error at "deserialize serverSetup"; Internal error encountered'
    );
  });

  test("serverSetup decoding", () => {
    expect(() => {
      const { registrationRequest } =
        opaque.client.startRegistration("hunter2");
      opaque.server.startRegistration({
        serverSetup: "a",
        userIdentifier: "user1",
        registrationRequest,
      });
    }).toThrow(
      'base64 decoding failed at "serverSetup"; Encoded text cannot have a 6-bit remainder.'
    );
  });

  test("registrationRequest invalid", () => {
    expect(() => {
      const serverSetup = opaque.server.createServerSetup();
      opaque.server.startRegistration({
        serverSetup,
        userIdentifier: "user1",
        registrationRequest: "",
      });
    }).toThrow(
      'opaque protocol error at "deserialize registrationRequest"; Internal error encountered'
    );
  });

  test("registrationRequest decoding", () => {
    expect(() => {
      const serverSetup = opaque.server.createServerSetup();
      opaque.server.startRegistration({
        serverSetup,
        userIdentifier: "user1",
        registrationRequest: "a",
      });
    }).toThrow(
      'base64 decoding failed at "registrationRequest"; Encoded text cannot have a 6-bit remainder.'
    );
  });
});

describe("serverLoginStart", () => {
  test("invalid params type", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin()
    ).toThrow(
      "invalid type: unit value, expected struct ServerLoginStartParams"
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin(123)
    ).toThrow(
      "invalid type: floating point `123`, expected struct ServerLoginStartParams"
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin("test")
    ).toThrow(
      'invalid type: string "test", expected struct ServerLoginStartParams'
    );
  });

  test("incomplete params object", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({})
    ).toThrow("missing field `serverSetup`");

    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({ serverSetup: "" })
    ).toThrow("missing field `credentialRequest`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({
        serverSetup: "",
        credentialRequest: "",
      })
    ).toThrow("missing field `userIdentifier`");
  });

  test("serverSetup invalid", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({
        serverSetup: "",
        credentialRequest: "",
        userIdentifier: "",
      })
    ).toThrow(
      'opaque protocol error at "deserialize serverSetup"; Internal error encountered'
    );
  });

  test("serverSetup encoding invalid", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({
        serverSetup: "a",
        credentialRequest: "",
        userIdentifier: "",
      })
    ).toThrow(
      'base64 decoding failed at "serverSetup"; Encoded text cannot have a 6-bit remainder.'
    );
  });

  test("credentialRequest invalid", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({
        serverSetup: opaque.server.createServerSetup(),
        credentialRequest: "",
        userIdentifier: "",
      })
    ).toThrow(
      'opaque protocol error at "deserialize credentialRequest"; Internal error encountered'
    );
  });

  test("credentialRequest encoding invalid", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({
        serverSetup: opaque.server.createServerSetup(),
        credentialRequest: "a",
        userIdentifier: "",
      })
    ).toThrow(
      'base64 decoding failed at "credentialRequest"; Encoded text cannot have a 6-bit remainder.'
    );
  });

  test("dummy server login credential response", () => {
    const password = "hunter2";
    const serverSetup = opaque.server.createServerSetup();
    const { credentialRequest, clientLogin } =
      opaque.client.startLogin(password);
    const { credentialResponse } = opaque.server.startLogin({
      userIdentifier: "user1",
      serverSetup,
      credentialRequest,
      passwordFile: undefined,
    });
    const result = opaque.client.finishLogin({
      clientLogin,
      credentialResponse,
      password,
    });
    expect(result).toBeUndefined();
  });
});
