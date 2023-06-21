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
 * @returns
 */
function setupAndRegister(userIdentifier, password, identifiers = undefined) {
  const serverSetup = opaque.createServerSetup();
  const { clientRegistration, registrationRequest } =
    opaque.clientRegistrationStart(password);
  const registrationResponse = opaque.serverRegistrationStart({
    serverSetup,
    userIdentifier,
    registrationRequest,
  });
  const { registrationUpload, exportKey, serverStaticPublicKey } =
    opaque.clientRegistrationFinish({
      clientRegistration,
      registrationResponse,
      password,
      identifiers,
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

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { serverLogin, credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    userIdentifier,
    passwordFile,
    credentialRequest,
  });

  const loginResult = opaque.clientLoginFinish({
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

  const serverSessionKey = opaque.serverLoginFinish({
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
    opaque.clientLoginStart("hunter42");

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    userIdentifier,
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
  const userIdentifier = "user123";
  const client = "client123";
  const password = "hunter2";

  const { serverSetup, passwordFile } = setupAndRegister(
    userIdentifier,
    password,
    { client }
  );

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    userIdentifier,
    passwordFile,
    credentialRequest,
    identifiers: {
      client,
    },
  });

  const loginResult = opaque.clientLoginFinish({
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

  const { clientLogin, credentialRequest } = opaque.clientLoginStart(password);

  const { credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    passwordFile,
    credentialRequest,
    userIdentifier,
    identifiers: {
      server: "server-ident-abc",
    },
  });

  const loginResult = opaque.clientLoginFinish({
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
      opaque.clientRegistrationStart();
    }).toThrow("password must be a string");
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.clientRegistrationStart(123);
    }).toThrow("password must be a string");
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.clientRegistrationStart({});
    }).toThrow("password must be a string");
  });
});

describe("clientLoginStart", () => {
  test("invalid argument type", () => {
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.clientLoginStart();
    }).toThrow("password must be a string");
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.clientLoginStart(123);
    }).toThrow("password must be a string");
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.clientLoginStart({});
    }).toThrow("password must be a string");
  });
});

describe("serverRegistrationFinish", () => {
  test("invalid argument type", () => {
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.serverRegistrationFinish();
    }).toThrow("message must be a string");
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.serverRegistrationFinish(123);
    }).toThrow("message must be a string");
    expect(() => {
      // @ts-expect-error intentional test of invalid input
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
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.serverRegistrationStart()
    ).toThrow(
      "invalid type: unit value, expected struct ServerRegistrationStartParams"
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.serverRegistrationStart(123)
    ).toThrow(
      "invalid type: floating point `123`, expected struct ServerRegistrationStartParams"
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.serverRegistrationStart("test")
    ).toThrow(
      'invalid type: string "test", expected struct ServerRegistrationStartParams'
    );
  });

  test("incomplete params object", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.serverRegistrationStart({})
    ).toThrow("missing field `serverSetup`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.serverRegistrationStart({ serverSetup: "" })
    ).toThrow("missing field `userIdentifier`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.serverRegistrationStart({
        serverSetup: "",
        userIdentifier: "",
      })
    ).toThrow("missing field `registrationRequest`");
  });

  test("serverSetup invalid", () => {
    expect(() => {
      const { registrationRequest } = opaque.clientRegistrationStart("hunter2");
      opaque.serverRegistrationStart({
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
      const { registrationRequest } = opaque.clientRegistrationStart("hunter2");
      opaque.serverRegistrationStart({
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
      const serverSetup = opaque.createServerSetup();
      opaque.serverRegistrationStart({
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
      const serverSetup = opaque.createServerSetup();
      opaque.serverRegistrationStart({
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
      opaque.serverLoginStart()
    ).toThrow(
      "invalid type: unit value, expected struct ServerLoginStartParams"
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.serverLoginStart(123)
    ).toThrow(
      "invalid type: floating point `123`, expected struct ServerLoginStartParams"
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.serverLoginStart("test")
    ).toThrow(
      'invalid type: string "test", expected struct ServerLoginStartParams'
    );
  });

  test("incomplete params object", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.serverLoginStart({})
    ).toThrow("missing field `serverSetup`");

    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.serverLoginStart({ serverSetup: "" })
    ).toThrow("missing field `credentialRequest`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.serverLoginStart({
        serverSetup: "",
        credentialRequest: "",
      })
    ).toThrow("missing field `userIdentifier`");
  });

  test("serverSetup invalid", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.serverLoginStart({
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
      opaque.serverLoginStart({
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
      opaque.serverLoginStart({
        serverSetup: opaque.createServerSetup(),
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
      opaque.serverLoginStart({
        serverSetup: opaque.createServerSetup(),
        credentialRequest: "a",
        userIdentifier: "",
      })
    ).toThrow(
      'base64 decoding failed at "credentialRequest"; Encoded text cannot have a 6-bit remainder.'
    );
  });

  test("dummy server login credential response", () => {
    const password = "hunter2";
    const serverSetup = opaque.createServerSetup();
    const { credentialRequest, clientLogin } =
      opaque.clientLoginStart(password);
    const { credentialResponse } = opaque.serverLoginStart({
      userIdentifier: "user1",
      serverSetup,
      credentialRequest,
      passwordFile: undefined,
    });
    const result = opaque.clientLoginFinish({
      clientLogin,
      credentialResponse,
      password,
    });
    expect(result).toBeUndefined();
  });
});
