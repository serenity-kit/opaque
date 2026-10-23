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
  // Created with the published @serenity-kit/opaque@0.9.0 and
  // @serenity-kit/opaque-p256@0.9.0 (opaque-ke 3.x). Neither setup loads in
  // 1.x without migration.
  const v090Fixtures = {
    ristretto: {
      serverSetup:
        "f7GoiUTbU4qyEjxW7V4KqlzFk9bzl9jLtCE67eDFVGlpSMyvTsp5Pldxws49YPR_UUwiEUI4u6YNWKlJHFPg0Nfll1JEWwUjHkyHd6PNOWIEmJJC_N1g6dzCGMCMkssJVcItSSAlX3Z3OvNgwczxjQZDFP3f2V7Qb-ILRfH41Qs",
      userIdentifier: "user-registered-with-0.9.0",
      password: "password-from-0.9.0",
      registrationRecord:
        "BjDSKUN49bG4SRzntLQL5oVNHA3HhiK2Udm6rvys7EnR_XMOlHhdrssrA0gt-e_zJEHWoO221Ave_PHpcDsltwRoia-A0KSmX8nwo2XjubY73rOp9CFdGJvtab2DfBYs7jvLtTq2h_uyi7_E1ZjA2tY84ymoXMXwY-kFAJyo7p_790kFKVqA6ZWjmr1cPuD8HdGCgr5AdETCSupS3XTE-F-C2qou0ZLtkP_684PWN8HlJS-GRYgkj8eTTGotOC4k",
      exportKey:
        "_KDhrNESr3AEXOYEw5OmESjU-jKLJj6S7_WjghvdapTrsYCC3ztfLJwEE2ck_TYNQC0kpeN5kzVa-gshXbYFDA",
      serverStaticPublicKey: "dC4D1Wt4wpqPEWyai8aDaHGUM8HL4oeR2H7ygMF1qms",
    },
    p256: {
      serverSetup:
        "EKalZwHxW5VzqRKswOmgIO3STwdJLT80hkVRf15KepOa3Nk0peyFpGJ7J-7WySuCHKIxAJPdCPlrGO7ZZXCX7Wn3PmNoplas8eesxw9KQ_BQo_h5gKbB8MKZttTYVzSO",
      userIdentifier: "user-registered-with-0.9.0",
      password: "password-from-0.9.0",
      registrationRecord:
        "AgzIw1LsZjpxTiy4MmpIwHgmpC7aOZvc88Yp-uyBGo44pvaj_9S4Y7cb83jTYGdCSYYi5DDKzehfMexzUpSlIBGruZ3-JyQhu0GaykhS8LPsikkYJJ-BjHG2g44jjT_L2zNPFAaFBig_pbQzi48lVI7nUZ7h52Rri-RMoS7Fgs2W",
      exportKey: "NiJ2-2sbNq35pMUov-0BcHe08w8-U8VrlnIGb4jvDto",
      serverStaticPublicKey: "AiVZUBHuBy5olyQ5i9Ug9XdlGsfVTUnXAtIfObwp6bwH",
    },
  };
  const isP256 = process.env.OPAQUE_BUILD === "p256";
  const v090 = isP256 ? v090Fixtures.p256 : v090Fixtures.ristretto;
  const v090OtherCurve = isP256 ? v090Fixtures.ristretto : v090Fixtures.p256;
  const packageName = isP256
    ? "@serenity-kit/opaque-p256"
    : "@serenity-kit/opaque";

  /**
   * @param {string} serverSetup
   * @param {string} registrationRecord
   * @param {string} userIdentifier
   * @param {string} password
   */
  function login(serverSetup, registrationRecord, userIdentifier, password) {
    const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
      password,
    });
    const { serverLoginState, loginResponse } = opaque.server.startLogin({
      serverSetup,
      registrationRecord,
      startLoginRequest,
      userIdentifier,
    });
    const loginResult = opaque.client.finishLogin({
      clientLoginState,
      loginResponse,
      password,
    });
    if (!loginResult) return undefined;
    const { sessionKey } = opaque.server.finishLogin({
      serverLoginState,
      finishLoginRequest: loginResult.finishLoginRequest,
    });
    return { ...loginResult, serverSessionKey: sessionKey };
  }

  // Builds a byte-compatible stand-in for a v3 (opaque-ke 3.x / opaque 0.9.x)
  // serverSetup -- oprfSeed || realAkeSk || dummyAkeSk, all canonical scalars
  // -- without depending on the old crate version. We get canonical scalars
  // for free by slicing them out of two real v4 setups: v4's own layout is
  // oprfSeed || realAkeSk || dummyAkePk, so the first 32/64+32 bytes of any
  // v4 setup are already a valid seed+privkey pair for this build's group.
  // The result shares its oprfSeed and real AKE key with `serverSetup`.
  function buildV3ShapedSetup(serverSetup = opaque.server.createSetup()) {
    const a = new Uint8Array(Buffer.from(serverSetup, "base64url"));
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
    // dummy-key field's encoding changes.
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

  test("registration records created before migration keep working", () => {
    const userIdentifier = "user-registered-before-migration";
    const password = "hunter42";
    // Registration only uses the oprfSeed and the real AKE key, which the
    // v3-shaped setup shares with serverSetup.
    const { serverSetup, registrationRecord, exportKey } = setupAndRegister(
      userIdentifier,
      password,
    );
    const migratedSetup = opaque.server.migrateSetupFromV3(
      buildV3ShapedSetup(serverSetup),
    );

    const result = login(
      migratedSetup,
      registrationRecord,
      userIdentifier,
      password,
    );
    expect(result).not.toBeUndefined();
    if (!result) throw new TypeError(); // for typescript
    expect(result.exportKey).toEqual(exportKey);
    expect(result.sessionKey).toEqual(result.serverSessionKey);
  });

  test("a 0.9.0 setup can't be used without migration", () => {
    expect(() => opaque.server.getPublicKey(v090.serverSetup)).toThrow(
      'opaque protocol error at "deserialize serverSetup"',
    );
  });

  test("registration records created with 0.9.0 log in after migration", () => {
    const migratedSetup = opaque.server.migrateSetupFromV3(v090.serverSetup);
    expect(opaque.server.getPublicKey(migratedSetup)).toEqual(
      v090.serverStaticPublicKey,
    );

    const result = login(
      migratedSetup,
      v090.registrationRecord,
      v090.userIdentifier,
      v090.password,
    );
    expect(result).not.toBeUndefined();
    if (!result) throw new TypeError(); // for typescript
    expect(result.exportKey).toEqual(v090.exportKey);
    expect(result.serverStaticPublicKey).toEqual(v090.serverStaticPublicKey);
    expect(result.sessionKey).toEqual(result.serverSessionKey);

    expect(
      login(
        migratedSetup,
        v090.registrationRecord,
        v090.userIdentifier,
        "wrong-password",
      ),
    ).toBeUndefined();
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

  test("setup that is already migrated", () => {
    const migratedSetup = opaque.server.migrateSetupFromV3(v090.serverSetup);
    expect(() => opaque.server.migrateSetupFromV3(migratedSetup)).toThrow(
      "serverSetup is already in the opaque-ke v4 format",
    );
  });

  test("setup from the other curve", () => {
    expect(() =>
      opaque.server.migrateSetupFromV3(v090OtherCurve.serverSetup),
    ).toThrow(
      `Was the old serverSetup created with the same package (${packageName}) you are running now?`,
    );
  });

  test("invalid encoding", () => {
    expect(() => opaque.server.migrateSetupFromV3("a")).toThrow(
      'base64 decoding failed at "serverSetup (opaque-ke v3)"; Invalid input length: 1',
    );
  });
});
