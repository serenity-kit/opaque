import * as opaqueP256 from "../build/p256";
import * as opaqueRistretto from "../build/ristretto";
import { beforeAll, describe, expect, test } from "vitest";

const opaque =
  process.env.OPAQUE_BUILD === "p256" ? opaqueP256 : opaqueRistretto;

// Ristretto255 pairs with SHA-512, P-256 with SHA-256, so the byte lengths
// reported in deserialization errors differ between the two builds.
const hashLen = process.env.OPAQUE_BUILD === "p256" ? 32 : 64;

/**
 * @typedef {{client?:string;server?:string}} Identifiers
 */

/**
 * @param {string} userIdentifier
 * @param {string} password
 * @param {Identifiers|undefined} identifiers
 * @param {any} keyStretching
 */
function setupAndRegister(
  userIdentifier,
  password,
  identifiers = undefined,
  keyStretching = undefined,
) {
  const serverSetup = opaque.server.createSetup();
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password });
  const { registrationResponse } = opaque.server.createRegistrationResponse({
    serverSetup,
    userIdentifier,
    registrationRequest,
  });
  const { registrationRecord, exportKey, serverStaticPublicKey } =
    opaque.client.finishRegistration({
      clientRegistrationState,
      registrationResponse,
      password,
      identifiers,
      keyStretching,
    });

  return {
    serverSetup,
    registrationRecord,
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
    registrationRecord,
    exportKey: registrationExportKey,
    serverStaticPublicKey: registrationServerStaticPublicKey,
  } = setupAndRegister(userIdentifier, password, undefined);

  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  const { serverLoginState, loginResponse } = opaque.server.startLogin({
    serverSetup,
    userIdentifier,
    registrationRecord,
    startLoginRequest,
  });

  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
  });

  expect(loginResult).not.toBeUndefined();

  if (!loginResult) throw new TypeError(); // for typescript

  const {
    sessionKey: clientSessionKey,
    finishLoginRequest,
    exportKey: loginExportKey,
    serverStaticPublicKey: loginServerStaticPublicKey,
  } = loginResult;

  expect(registrationExportKey).toEqual(loginExportKey);
  expect(registrationServerStaticPublicKey).toEqual(loginServerStaticPublicKey);
  expect(loginServerStaticPublicKey).toEqual(
    opaque.server.getPublicKey(serverSetup),
  );

  const { sessionKey: serverSessionKey } = opaque.server.finishLogin({
    serverLoginState,
    finishLoginRequest,
  });

  expect(serverSessionKey).toEqual(clientSessionKey);
});

test("full registration & login flow using default (memory-constrained) keyStretching ", () => {
  const userIdentifier = "user123";
  const password = "hunter42";

  const {
    serverSetup,
    registrationRecord,
    exportKey: registrationExportKey,
    serverStaticPublicKey: registrationServerStaticPublicKey,
  } = setupAndRegister(userIdentifier, password);

  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  const { serverLoginState, loginResponse } = opaque.server.startLogin({
    serverSetup,
    userIdentifier,
    registrationRecord,
    startLoginRequest,
  });

  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
  });

  expect(loginResult).not.toBeUndefined();

  if (!loginResult) throw new TypeError(); // for typescript

  const {
    sessionKey: clientSessionKey,
    finishLoginRequest,
    exportKey: loginExportKey,
    serverStaticPublicKey: loginServerStaticPublicKey,
  } = loginResult;

  expect(registrationExportKey).toEqual(loginExportKey);
  expect(registrationServerStaticPublicKey).toEqual(loginServerStaticPublicKey);
  expect(loginServerStaticPublicKey).toEqual(
    opaque.server.getPublicKey(serverSetup),
  );

  const { sessionKey: serverSessionKey } = opaque.server.finishLogin({
    serverLoginState,
    finishLoginRequest,
  });

  expect(serverSessionKey).toEqual(clientSessionKey);
});

test("full registration & login flow using rfc-recommended keyStretching", () => {
  const userIdentifier = "user123";
  const password = "hunter42";

  const {
    serverSetup,
    registrationRecord,
    exportKey: registrationExportKey,
    serverStaticPublicKey: registrationServerStaticPublicKey,
  } = setupAndRegister(userIdentifier, password, undefined, "rfc-recommended");

  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  const { serverLoginState, loginResponse } = opaque.server.startLogin({
    serverSetup,
    userIdentifier,
    registrationRecord,
    startLoginRequest,
  });

  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
    keyStretching: "rfc-recommended",
  });

  expect(loginResult).not.toBeUndefined();

  if (!loginResult) throw new TypeError(); // for typescript

  const {
    sessionKey: clientSessionKey,
    finishLoginRequest,
    exportKey: loginExportKey,
    serverStaticPublicKey: loginServerStaticPublicKey,
  } = loginResult;

  expect(registrationExportKey).toEqual(loginExportKey);
  expect(registrationServerStaticPublicKey).toEqual(loginServerStaticPublicKey);
  expect(loginServerStaticPublicKey).toEqual(
    opaque.server.getPublicKey(serverSetup),
  );

  const { sessionKey: serverSessionKey } = opaque.server.finishLogin({
    serverLoginState,
    finishLoginRequest,
  });

  expect(serverSessionKey).toEqual(clientSessionKey);
}, 30000);

test("full registration & login flow using deprecated rfc-draft-recommended keyStretching", () => {
  const userIdentifier = "user123";
  const password = "hunter42";

  const {
    serverSetup,
    registrationRecord,
    exportKey: registrationExportKey,
    serverStaticPublicKey: registrationServerStaticPublicKey,
  } = setupAndRegister(
    userIdentifier,
    password,
    undefined,
    "rfc-draft-recommended",
  );

  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  const { serverLoginState, loginResponse } = opaque.server.startLogin({
    serverSetup,
    userIdentifier,
    registrationRecord,
    startLoginRequest,
  });

  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
    keyStretching: "rfc-draft-recommended",
  });

  expect(loginResult).not.toBeUndefined();

  if (!loginResult) throw new TypeError(); // for typescript

  const {
    sessionKey: clientSessionKey,
    finishLoginRequest,
    exportKey: loginExportKey,
    serverStaticPublicKey: loginServerStaticPublicKey,
  } = loginResult;

  expect(registrationExportKey).toEqual(loginExportKey);
  expect(registrationServerStaticPublicKey).toEqual(loginServerStaticPublicKey);
  expect(loginServerStaticPublicKey).toEqual(
    opaque.server.getPublicKey(serverSetup),
  );

  const { sessionKey: serverSessionKey } = opaque.server.finishLogin({
    serverLoginState,
    finishLoginRequest,
  });

  expect(serverSessionKey).toEqual(clientSessionKey);
}, 30000);

test("full registration & login flow using custom keyStretching", () => {
  const userIdentifier = "user123";
  const password = "hunter42";

  const {
    serverSetup,
    registrationRecord,
    exportKey: registrationExportKey,
    serverStaticPublicKey: registrationServerStaticPublicKey,
  } = setupAndRegister(userIdentifier, password, undefined, {
    "argon2id-custom": {
      memory: 65536,
      iterations: 1,
      parallelism: 4,
    },
  });

  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  const { serverLoginState, loginResponse } = opaque.server.startLogin({
    serverSetup,
    userIdentifier,
    registrationRecord,
    startLoginRequest,
  });

  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
    keyStretching: {
      "argon2id-custom": {
        memory: 65536,
        iterations: 1,
        parallelism: 4,
      },
    },
  });

  expect(loginResult).not.toBeUndefined();

  if (!loginResult) throw new TypeError(); // for typescript

  const {
    sessionKey: clientSessionKey,
    finishLoginRequest,
    exportKey: loginExportKey,
    serverStaticPublicKey: loginServerStaticPublicKey,
  } = loginResult;

  expect(registrationExportKey).toEqual(loginExportKey);
  expect(registrationServerStaticPublicKey).toEqual(loginServerStaticPublicKey);
  expect(loginServerStaticPublicKey).toEqual(
    opaque.server.getPublicKey(serverSetup),
  );

  const { sessionKey: serverSessionKey } = opaque.server.finishLogin({
    serverLoginState,
    finishLoginRequest,
  });

  expect(serverSessionKey).toEqual(clientSessionKey);
});

test("full registration & login with bad password", () => {
  const userIdentifier = "user123";

  const { serverSetup, registrationRecord } = setupAndRegister(
    userIdentifier,
    "hunter42",
    undefined,
  );
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password: "hunter42",
  });

  const { loginResponse } = opaque.server.startLogin({
    serverSetup,
    userIdentifier,
    registrationRecord,
    startLoginRequest,
  });

  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password: "hunter23",
  });

  expect(loginResult).toBeUndefined();
});

test("full registration & login flow with mismatched custom client identifier on server login", () => {
  const userIdentifier = "user123";
  const client = "client123";
  const password = "hunter2";

  const { serverSetup, registrationRecord } = setupAndRegister(
    userIdentifier,
    password,
    { client },
  );

  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  const { loginResponse } = opaque.server.startLogin({
    serverSetup,
    userIdentifier,
    registrationRecord,
    startLoginRequest,
    identifiers: {
      client,
    },
  });

  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
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

  const { serverSetup, registrationRecord } = setupAndRegister(
    userIdentifier,
    password,
    { server: "server-ident" },
  );

  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  const { loginResponse } = opaque.server.startLogin({
    serverSetup,
    registrationRecord,
    startLoginRequest,
    userIdentifier,
    identifiers: {
      server: "server-ident-abc",
    },
  });

  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
    identifiers: {
      server: "server-ident",
    },
  });

  expect(loginResult).toBeUndefined();
});

test("full registration & login attempt with client and server identifier", () => {
  const userIdentifier = "client123";
  const password = "hunter2";

  const { serverSetup, registrationRecord } = setupAndRegister(
    userIdentifier,
    password,
    { client: "client-ident", server: "server-ident" },
  );

  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  });

  const { loginResponse } = opaque.server.startLogin({
    serverSetup,
    registrationRecord,
    startLoginRequest,
    userIdentifier,
    identifiers: {
      client: "client-ident",
      server: "server-ident",
    },
  });

  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
    identifiers: {
      client: "client-ident",
      server: "server-ident",
    },
  });

  expect(loginResult).toBeDefined();
});

describe("client.startRegistration", () => {
  test("invalid argument type", () => {
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.client.startRegistration();
    }).toThrow(
      "invalid type: unit value, expected struct StartClientRegistrationParams",
    );
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.client.startRegistration(123);
    }).toThrow(
      "invalid type: floating point `123.0`, expected struct StartClientRegistrationParams",
    );
  });
  test("incomplete params object", () => {
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.client.startRegistration({});
    }).toThrow("missing field `password`");
  });
});

describe("client.finishRegistration", () => {
  test("invalid argument type", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.client.finishRegistration(),
    ).toThrow(
      "invalid type: unit value, expected struct FinishClientRegistrationParams",
    );

    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.client.finishRegistration(123),
    ).toThrow(
      "invalid type: floating point `123.0`, expected struct FinishClientRegistrationParams",
    );
  });
  test("incomplete params object", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.client.finishRegistration({}),
    ).toThrow("Error: missing field `password`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.client.finishRegistration({
        password: "hunter2",
        clientRegistrationState: "",
      }),
    ).toThrow("Error: missing field `registrationResponse`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.client.finishRegistration({
        password: "hunter2",
        registrationResponse: "",
      }),
    ).toThrow("Error: missing field `clientRegistrationState`");
    expect(() =>
      opaque.client.finishRegistration({
        password: "hunter2",
        registrationResponse: "",
        // @ts-expect-error intentional test of invalid input
        keyStretching: "whatever",
      }),
    ).toThrow(
      "Error: unknown variant `whatever`, expected one of `rfc-recommended`, `rfc-draft-recommended`, `memory-constrained`, `argon2id-custom`",
    );
    expect(() => {
      const serverSetup = opaque.server.createSetup();
      const { clientRegistrationState, registrationRequest } =
        opaque.client.startRegistration({ password: "hunter2" });
      const { registrationResponse } = opaque.server.createRegistrationResponse(
        {
          serverSetup,
          userIdentifier: "user1",
          registrationRequest,
        },
      );

      const { registrationRecord, exportKey, serverStaticPublicKey } =
        opaque.client.finishRegistration({
          password: "hunter2",
          registrationResponse,
          clientRegistrationState,
          keyStretching: {
            "argon2id-custom": {
              memory: 1,
              iterations: 1,
              parallelism: 100,
            },
          },
        });
    }).toThrow(
      'Internal error at "Invalid keyStretching (argon2id) combination"; Computing the key stretching function failed',
    );
  });

  test("registrationResponse invalid", () => {
    const { clientRegistrationState } = opaque.client.startRegistration({
      password: "hunter2",
    });
    expect(() => {
      opaque.client.finishRegistration({
        password: "hunter2",
        registrationResponse: "",
        clientRegistrationState,
      });
    }).toThrow(
      'opaque protocol error at "deserialize registrationResponse"; LibraryError(OprfError(Deserialization))',
    );
  });

  test("registrationResponse encoding invalid", () => {
    const { clientRegistrationState } = opaque.client.startRegistration({
      password: "hunter2",
    });
    expect(() => {
      opaque.client.finishRegistration({
        password: "hunter2",
        registrationResponse: "a",
        clientRegistrationState,
      });
    }).toThrow(
      'base64 decoding failed at "registrationResponse"; Invalid input length: 1',
    );
  });

  test("clientRegistrationState invalid", () => {
    const { registrationRequest } = opaque.client.startRegistration({
      password: "hunter2",
    });
    const { registrationResponse } = opaque.server.createRegistrationResponse({
      userIdentifier: "user123",
      registrationRequest,
      serverSetup: opaque.server.createSetup(),
    });
    expect(() => {
      opaque.client.finishRegistration({
        password: "hunter2",
        registrationResponse,
        clientRegistrationState: "",
      });
    }).toThrow(
      'opaque protocol error at "deserialize clientRegistrationState"; LibraryError(OprfError(Deserialization))',
    );
  });

  test("clientRegistrationState encoding invalid", () => {
    const { registrationRequest } = opaque.client.startRegistration({
      password: "hunter2",
    });
    const { registrationResponse } = opaque.server.createRegistrationResponse({
      userIdentifier: "user123",
      registrationRequest,
      serverSetup: opaque.server.createSetup(),
    });
    expect(() => {
      opaque.client.finishRegistration({
        password: "hunter2",
        registrationResponse,
        clientRegistrationState: "a",
      });
    }).toThrow(
      'base64 decoding failed at "clientRegistrationState"; Invalid input length: 1',
    );
  });
});

describe("client.startLogin", () => {
  test("invalid argument type", () => {
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.client.startLogin();
    }).toThrow(
      "invalid type: unit value, expected struct StartClientLoginParams",
    );
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.client.startLogin(123);
    }).toThrow(
      "invalid type: floating point `123.0`, expected struct StartClientLoginParams",
    );
  });
  test("incomplete params object", () => {
    expect(() => {
      // @ts-expect-error intentional test of invalid input
      opaque.client.startLogin({});
    }).toThrow("missing field `password`");
  });
});

describe("client.finishLogin", () => {
  test("invalid argument type", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.client.finishLogin(),
    ).toThrow(
      "invalid type: unit value, expected struct FinishClientLoginParams",
    );

    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.client.finishLogin(123),
    ).toThrow(
      "invalid type: floating point `123.0`, expected struct FinishClientLoginParams",
    );
  });

  test("incomplete params object", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.client.finishLogin({}),
    ).toThrow("missing field `clientLoginState`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.client.finishLogin({ clientLoginState: "" }),
    ).toThrow("missing field `loginResponse`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.client.finishLogin({ clientLoginState: "", loginResponse: "" }),
    ).toThrow("missing field `password`");
    expect(() => {
      const username = "user123";
      const password = "hunter2";
      const { serverSetup, registrationRecord } = setupAndRegister(
        username,
        password,
        undefined,
      );
      const { startLoginRequest, clientLoginState } = opaque.client.startLogin({
        password,
      });
      const { loginResponse } = opaque.server.startLogin({
        registrationRecord,
        serverSetup,
        startLoginRequest,
        userIdentifier: username,
      });
      const result = opaque.client.finishLogin({
        clientLoginState,
        loginResponse,
        password,
        // @ts-expect-error intentional test of invalid input
        keyStretching: "something",
      });
    }).toThrow(
      "Error: unknown variant `something`, expected one of `rfc-recommended`, `rfc-draft-recommended`, `memory-constrained`, `argon2id-custom`",
    );
    expect(() => {
      const username = "user123";
      const password = "hunter2";
      const { serverSetup, registrationRecord } = setupAndRegister(
        username,
        password,
        undefined,
      );
      const { startLoginRequest, clientLoginState } = opaque.client.startLogin({
        password,
      });
      const { loginResponse } = opaque.server.startLogin({
        registrationRecord,
        serverSetup,
        startLoginRequest,
        userIdentifier: username,
      });
      opaque.client.finishLogin({
        clientLoginState,
        loginResponse,
        password,
        keyStretching: {
          "argon2id-custom": {
            memory: 1,
            iterations: 1,
            parallelism: 100,
          },
        },
      });
    }).toThrow(
      'Internal error at "Invalid keyStretching (argon2id) combination"; Computing the key stretching function failed',
    );
  });

  test("clientLoginState invalid", () => {
    expect(() =>
      opaque.client.finishLogin({
        clientLoginState: "",
        loginResponse: "",
        password: "hunter2",
      }),
    ).toThrow(
      'opaque protocol error at "deserialize clientLoginState"; LibraryError(OprfError(Deserialization))',
    );
  });

  test("clientLoginState encoding invalid", () => {
    expect(() =>
      opaque.client.finishLogin({
        clientLoginState: "a",
        loginResponse: "",
        password: "hunter2",
      }),
    ).toThrow(
      'base64 decoding failed at "clientLoginState"; Invalid input length: 1',
    );
  });

  test("loginResponse invalid", () => {
    expect(() => {
      const { clientLoginState } = opaque.client.startLogin({
        password: "hunter2",
      });
      opaque.client.finishLogin({
        clientLoginState,
        loginResponse: "",
        password: "hunter2",
      });
    }).toThrow(
      'opaque protocol error at "deserialize loginResponse"; LibraryError(OprfError(Deserialization))',
    );
  });

  test("loginResponse encoding invalid", () => {
    expect(() => {
      const { clientLoginState } = opaque.client.startLogin({
        password: "hunter2",
      });
      opaque.client.finishLogin({
        clientLoginState,
        loginResponse: "a",
        password: "hunter2",
      });
    }).toThrow(
      'base64 decoding failed at "loginResponse"; Invalid input length: 1',
    );
  });
});

describe("server.createRegistrationResponse", () => {
  test("invalid params type", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.createRegistrationResponse(),
    ).toThrow(
      "invalid type: unit value, expected struct CreateServerRegistrationResponseParams",
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.createRegistrationResponse(123),
    ).toThrow(
      "invalid type: floating point `123.0`, expected struct CreateServerRegistrationResponseParams",
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.createRegistrationResponse("test"),
    ).toThrow(
      'invalid type: string "test", expected struct CreateServerRegistrationResponseParams',
    );
  });

  test("incomplete params object", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.createRegistrationResponse({}),
    ).toThrow("missing field `serverSetup`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.createRegistrationResponse({ serverSetup: "" }),
    ).toThrow("missing field `userIdentifier`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.createRegistrationResponse({
        serverSetup: "",
        userIdentifier: "",
      }),
    ).toThrow("missing field `registrationRequest`");
  });

  test("serverSetup invalid", () => {
    expect(() => {
      const { registrationRequest } = opaque.client.startRegistration({
        password: "hunter2",
      });
      opaque.server.createRegistrationResponse({
        serverSetup: "abcd",
        userIdentifier: "user1",
        registrationRequest,
      });
    }).toThrow(
      `opaque protocol error at "deserialize serverSetup"; SizeError { name: "OPRF seed", len: ${hashLen}, actual_len: 3 }`,
    );
  });

  test("serverSetup decoding", () => {
    expect(() => {
      const { registrationRequest } = opaque.client.startRegistration({
        password: "hunter2",
      });
      opaque.server.createRegistrationResponse({
        serverSetup: "a",
        userIdentifier: "user1",
        registrationRequest,
      });
    }).toThrow(
      'base64 decoding failed at "serverSetup"; Invalid input length: 1',
    );
  });

  test("registrationRequest invalid", () => {
    expect(() => {
      const serverSetup = opaque.server.createSetup();
      opaque.server.createRegistrationResponse({
        serverSetup,
        userIdentifier: "user1",
        registrationRequest: "",
      });
    }).toThrow(
      'opaque protocol error at "deserialize registrationRequest"; LibraryError(OprfError(Deserialization))',
    );
  });

  test("registrationRequest decoding", () => {
    expect(() => {
      const serverSetup = opaque.server.createSetup();
      opaque.server.createRegistrationResponse({
        serverSetup,
        userIdentifier: "user1",
        registrationRequest: "a",
      });
    }).toThrow(
      'base64 decoding failed at "registrationRequest"; Invalid input length: 1',
    );
  });
});

describe("server.startLogin", () => {
  test("invalid params type", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin(),
    ).toThrow(
      "invalid type: unit value, expected struct StartServerLoginParams",
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin(123),
    ).toThrow(
      "invalid type: floating point `123.0`, expected struct StartServerLoginParams",
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin("test"),
    ).toThrow(
      'invalid type: string "test", expected struct StartServerLoginParams',
    );
  });

  test("incomplete params object", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({}),
    ).toThrow("missing field `serverSetup`");

    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({ serverSetup: "" }),
    ).toThrow("missing field `startLoginRequest`");
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({
        serverSetup: "",
        startLoginRequest: "",
      }),
    ).toThrow("missing field `userIdentifier`");
  });

  test("serverSetup invalid", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({
        serverSetup: "",
        startLoginRequest: "",
        userIdentifier: "",
      }),
    ).toThrow(
      `opaque protocol error at "deserialize serverSetup"; SizeError { name: "OPRF seed", len: ${hashLen}, actual_len: 0 }`,
    );
  });

  test("serverSetup encoding invalid", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({
        serverSetup: "a",
        startLoginRequest: "",
        userIdentifier: "",
      }),
    ).toThrow(
      'base64 decoding failed at "serverSetup"; Invalid input length: 1',
    );
  });

  test("startLoginRequest invalid", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({
        serverSetup: opaque.server.createSetup(),
        startLoginRequest: "",
        userIdentifier: "",
      }),
    ).toThrow(
      'opaque protocol error at "deserialize startLoginRequest"; LibraryError(OprfError(Deserialization))',
    );
  });

  test("startLoginRequest encoding invalid", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.startLogin({
        serverSetup: opaque.server.createSetup(),
        startLoginRequest: "a",
        userIdentifier: "",
      }),
    ).toThrow(
      'base64 decoding failed at "startLoginRequest"; Invalid input length: 1',
    );
  });

  test("dummy server login credential response", () => {
    const password = "hunter2";
    const serverSetup = opaque.server.createSetup();
    const { startLoginRequest, clientLoginState } = opaque.client.startLogin({
      password,
    });
    const { loginResponse } = opaque.server.startLogin({
      userIdentifier: "user1",
      serverSetup,
      startLoginRequest,
      registrationRecord: undefined,
    });
    const result = opaque.client.finishLogin({
      clientLoginState,
      loginResponse,
      password,
    });
    expect(result).toBeUndefined();
  });
});

describe("server.finishLogin", () => {
  test("invalid params type", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.finishLogin(),
    ).toThrow(
      "invalid type: unit value, expected struct FinishServerLoginParams",
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.finishLogin(123),
    ).toThrow(
      "invalid type: floating point `123.0`, expected struct FinishServerLoginParams",
    );
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.finishLogin("test"),
    ).toThrow(
      'invalid type: string "test", expected struct FinishServerLoginParams',
    );
  });

  test("incomplete params object", () => {
    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.finishLogin({ finishLoginRequest: "" }),
    ).toThrow("missing field `serverLoginState`");

    expect(() =>
      // @ts-expect-error intentional test of invalid input
      opaque.server.finishLogin({ serverLoginState: "" }),
    ).toThrow("missing field `finishLoginRequest`");
  });

  test("finishLoginRequest invalid", () => {
    const { startLoginRequest } = opaque.client.startLogin({
      password: "hunter2",
    });
    const { serverLoginState } = opaque.server.startLogin({
      registrationRecord: null,
      serverSetup: opaque.server.createSetup(),
      startLoginRequest,
      userIdentifier: "user123",
    });
    expect(() => {
      opaque.server.finishLogin({ serverLoginState, finishLoginRequest: "" });
    }).toThrow(
      `opaque protocol error at "deserialize finishLoginRequest"; SizeError { name: "mac", len: ${hashLen}, actual_len: 0 }`,
    );
  });

  test("finishLoginRequest encoding invalid", () => {
    const { startLoginRequest } = opaque.client.startLogin({
      password: "hunter2",
    });
    const { serverLoginState } = opaque.server.startLogin({
      registrationRecord: null,
      serverSetup: opaque.server.createSetup(),
      startLoginRequest,
      userIdentifier: "user123",
    });
    expect(() => {
      opaque.server.finishLogin({ serverLoginState, finishLoginRequest: "a" });
    }).toThrow(
      'base64 decoding failed at "finishLoginRequest"; Invalid input length: 1',
    );
  });

  test("serverLoginState invalid", () => {
    const username = "user123";
    const password = "hunter2";
    const { serverSetup, registrationRecord } = setupAndRegister(
      username,
      password,
      undefined,
    );
    const { startLoginRequest, clientLoginState } = opaque.client.startLogin({
      password,
    });
    const { loginResponse } = opaque.server.startLogin({
      registrationRecord,
      serverSetup,
      startLoginRequest,
      userIdentifier: username,
    });
    const result = opaque.client.finishLogin({
      clientLoginState,
      loginResponse,
      password,
    });
    expect(result).not.toBeUndefined();
    if (!result) throw new TypeError();
    const { finishLoginRequest } = result;
    expect(() => {
      opaque.server.finishLogin({ serverLoginState: "", finishLoginRequest });
    }).toThrow(
      `opaque protocol error at "deserialize serverLoginState"; SizeError { name: "session key", len: ${hashLen}, actual_len: 0 }`,
    );
  });

  test("serverLoginState encoding invalid", () => {
    const username = "user123";
    const password = "hunter2";
    const { serverSetup, registrationRecord } = setupAndRegister(
      username,
      password,
      undefined,
    );
    const { startLoginRequest, clientLoginState } = opaque.client.startLogin({
      password,
    });
    const { loginResponse } = opaque.server.startLogin({
      registrationRecord,
      serverSetup,
      startLoginRequest,
      userIdentifier: username,
    });
    const result = opaque.client.finishLogin({
      clientLoginState,
      loginResponse,
      password,
    });
    expect(result).not.toBeUndefined();
    if (!result) throw new TypeError();
    const { finishLoginRequest } = result;
    expect(() => {
      opaque.server.finishLogin({ serverLoginState: "a", finishLoginRequest });
    }).toThrow(
      'base64 decoding failed at "serverLoginState"; Invalid input length: 1',
    );
  });
});

describe("server.getPublicKey", () => {
  test("empty string", () => {
    expect(() => opaque.server.getPublicKey("")).toThrow(
      `opaque protocol error at "deserialize serverSetup"; SizeError { name: "OPRF seed", len: ${hashLen}, actual_len: 0 }`,
    );
  });
  test("invalid encoding", () => {
    expect(() => opaque.server.getPublicKey("a")).toThrow(
      'base64 decoding failed at "serverSetup"; Invalid input length: 1',
    );
  });
  test("incomplete server setup string", () => {
    expect(() =>
      // correct one for ristretto: KNM3PutZ-g3HDN7TJOyrWfTMA-XuQ1j_NWQO05EgnD9xhtTC_MBdWL1NathBtlJ4gz6WIK9rg4NaxKe9gKwRR6DUCOozpp9oUfBnj-fwhA6l5m_DcMFjKxGkN3Q4Lx4CZoA3t-FrnRiBRB2an26puIg41k7-Bw98tsbISmoG12M
      // it was decoded, the last byte removed and the base64 encoded again
      opaque.server.getPublicKey(
        "KNM3PutZ-g3HDN7TJOyrWfTMA-XuQ1j_NWQO05EgnD9xhtTC_MBdWL1NathBtlJ4gz6WIK9rg4NaxKe9gKwRR6DUCOozpp9oUfBnj-fwhA6l5m_DcMFjKxGkN3Q4Lx4CZoA3t-FrnRiBRB2an26puIg41k7-Bw98tsbISmoG1w",
      ),
    ).toThrow('opaque protocol error at "deserialize serverSetup";');
  });
});

describe("server.migrateSetupFromV3", () => {
  // Builds a byte-compatible stand-in for a v3 (opaque-ke 3.x / opaque 0.9.x)
  // serverSetup -- oprfSeed || realAkeSk || dummyAkeSk, all canonical scalars
  // -- without depending on the old crate version. We get canonical scalars
  // for free by slicing them out of two real v4 setups: v4's own layout is
  // oprfSeed || realAkeSk || dummyAkePk, so the first 32/64+32 bytes of any
  // v4 setup are already a valid seed+privkey pair for this build's group.
  function buildV3ShapedSetup() {
    const a = new Uint8Array(
      Buffer.from(opaque.server.createSetup(), "base64url"),
    );
    const b = new Uint8Array(
      Buffer.from(opaque.server.createSetup(), "base64url"),
    );
    const seedAndRealSk = a.slice(0, hashLen + 32);
    const dummySk = b.slice(hashLen, hashLen + 32); // another setup's real sk, reused as our synthetic dummy sk
    return Buffer.from(
      Uint8Array.from([...seedAndRealSk, ...dummySk]),
    ).toString("base64url");
  }

  test("preserves the oprfSeed and real AKE private key bytes unchanged", () => {
    // The real key material -- everything a registrationRecord is actually
    // bound to -- must pass through byte-for-byte; only the trailing
    // dummy-key field's encoding changes. (We can't drive a real protocol
    // call with the *unmigrated* v3-shaped bytes here to prove this
    // end-to-end in-repo, since for P-256 they're a byte too short for a v4
    // parser by construction -- that mismatch is exactly the bug this
    // function fixes. That end-to-end case -- a genuine 0.9.x registration
    // read by a genuine 1.x login after migration -- was verified directly
    // against the published 0.9.0 and 1.1.0 npm packages during development
    // of this feature.)
    const v3Setup = buildV3ShapedSetup();
    const migratedSetup = opaque.server.migrateSetupFromV3(v3Setup);

    const preservedLen = hashLen + 32; // oprfSeed || realAkeSk
    const v3Bytes = Buffer.from(v3Setup, "base64url");
    const migratedBytes = Buffer.from(migratedSetup, "base64url");
    expect(migratedBytes.subarray(0, preservedLen)).toEqual(
      v3Bytes.subarray(0, preservedLen),
    );
  });

  test("migrated setup is fully functional for registration and login", () => {
    const userIdentifier = "migrated-user";
    const password = "hunter42";
    const migratedSetup =
      opaque.server.migrateSetupFromV3(buildV3ShapedSetup());

    const { clientRegistrationState, registrationRequest } =
      opaque.client.startRegistration({ password });
    const { registrationResponse } = opaque.server.createRegistrationResponse({
      serverSetup: migratedSetup,
      userIdentifier,
      registrationRequest,
    });
    const { registrationRecord, exportKey: exportKeyAtRegistration } =
      opaque.client.finishRegistration({
        clientRegistrationState,
        registrationResponse,
        password,
      });

    const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
      password,
    });
    const { loginResponse } = opaque.server.startLogin({
      serverSetup: migratedSetup,
      registrationRecord,
      startLoginRequest,
      userIdentifier,
    });
    const loginResult = opaque.client.finishLogin({
      clientLoginState,
      loginResponse,
      password,
    });

    expect(loginResult).not.toBeUndefined();
    if (!loginResult) throw new TypeError(); // for typescript

    expect(loginResult.exportKey).toEqual(exportKeyAtRegistration);
  });

  test("migration is not a no-op: it actually rewrites the trailing dummy-key field", () => {
    // For Ristretto255 the dummy private scalar and its derived public point
    // are both 32 bytes, so a v3-shaped setup happens to be the same total
    // length as a real v4 one -- but the trailing field's *content* changes
    // (a private scalar is not its own public key), which is the whole
    // reason a real, unmigrated v3 setup fails against a v4 build.
    const v3Setup = buildV3ShapedSetup();
    expect(opaque.server.migrateSetupFromV3(v3Setup)).not.toEqual(v3Setup);
  });

  test("wrong length", () => {
    expect(() => opaque.server.migrateSetupFromV3("")).toThrow(
      "unexpected opaque-ke v3 serverSetup length: got 0 bytes",
    );
  });

  test("invalid encoding", () => {
    expect(() => opaque.server.migrateSetupFromV3("a")).toThrow(
      'base64 decoding failed at "serverSetup (opaque-ke v3)"; Invalid input length: 1',
    );
  });
});
