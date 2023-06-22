import express, { Router } from "express";

/**
 * @template T
 * @typedef {T|Promise<T>} MaybeAsync
 */

/**
 * @template User
 * @template Payload
 * @typedef {(user: User, passwordFile: string) => MaybeAsync<Payload>} CreateUser
 */

/**
 * @template L, R
 * @typedef {{ok: true; value: R}|{ok: false; error: L}} Result
 */

/**
 * @template T
 * @typedef {(input: unknown) => Result<string, T>} Reader
 */

/**
 * @typedef {Object} LoginStore
 * @prop {(userIdent: string, login: string) => MaybeAsync<void>} createLogin
 * @prop {(userIdent: string) => MaybeAsync<string>} removeLogin
 */

/**
 * @template CustomData
 * @typedef {(userIdent: string, sessionKey: string, customData: CustomData) => MaybeAsync<void>} FinishLogin
 */

/**
 * @template [User=unknown]
 * @template [CreateResponse=unknown]
 * @template [CustomData=unknown]
 * @typedef {Object} Config
 * @prop {CreateUser<User, CreateResponse>} createUser
 * @prop {string} serverSetup
 * @prop {LoginStore} [loginStore]
 * @prop {(userIdent: string) => MaybeAsync<string>} getPasswordFile
 * @prop {FinishLogin<CustomData>} finishLogin
 * @prop {typeof import("@serenity-kit/opaque")} opaque
 */

/**
 * @param {import("express").Response} res
 * @param {number} status
 * @param {unknown} error
 */
function sendError(res, status, error) {
  res.writeHead(status);
  res.end(JSON.stringify({ error }));
}

const ERR_USER_IDENT = "ERR_USER_IDENT";
const ERR_REG_REQUEST = "ERR_REG_REQUEST";
const ERR_REG_UPLOAD = "ERR_REG_UPLOAD";
const ERR_USER_CREATE = "ERR_USER_CREATE";
const ERR_LOGIN_CREATE = "ERR_LOGIN_CREATE";
const ERR_LOGIN_REMOVE = "ERR_LOGIN_REMOVE";
const ERR_LOGIN_FINISH = "ERR_LOGIN_FINISH";
const ERR_GET_PASSWORD_FILE = "ERR_GET_PASSWORD_FILE";
const ERR_UNKNOWN = "ERR_UNKNOWN";

const ERR_USER = "ERR_USER";

const ERR_LOGIN_STATE_NOT_FOUND = "ERR_LOGIN_STATE_NOT_FOUND";
const ERR_LOGIN_STATE_ALREADY_ACTIVE = "ERR_LOGIN_STATE_ALREADY_ACTIVE";
const ERR_LOGIN_STATE_EXPIRED = "ERR_LOGIN_STATE_EXPIRED";

/**
 * @returns {LoginStore}
 */
function memoryLoginStore(lifetime = 3000) {
  /** @type {Record<string, {state: string; timestamp: number}>} */
  const logins = {};
  /**
   * @param {{timestamp: number}} entry
   */
  const isLive = (entry) => {
    const elapsed = new Date().getTime() - entry.timestamp;
    return elapsed < lifetime;
  };
  /**
   * @param {string} key
   */
  const getLiveEntry = (key) => {
    const entry = logins[key];
    if (!entry) return null;
    if (isLive(entry)) return entry.state;
    return null;
  };
  return {
    createLogin(userIdent, state) {
      if (getLiveEntry(userIdent) != null) {
        throw new Error(ERR_LOGIN_STATE_ALREADY_ACTIVE);
      }
      logins[userIdent] = { state, timestamp: new Date().getTime() };
    },
    removeLogin(userIdent) {
      const entry = logins[userIdent];
      if (entry == null) {
        throw new Error(ERR_LOGIN_STATE_NOT_FOUND);
      }
      delete logins[userIdent];
      if (!isLive(entry)) {
        throw new Error(ERR_LOGIN_STATE_EXPIRED);
      }
      return entry.state;
    },
  };
}

/**
 * @param {unknown} err
 * @param {unknown} fallback
 */
function getError(err, fallback) {
  /** @type {unknown} */
  let error = fallback;
  if (err instanceof Error) {
    error = err.message;
  }
  return error;
}

/**
 * @template T
 * @param {() => MaybeAsync<T>} f
 * @returns {Promise<{ok: true; value: T}|{ok: false; error: unknown}>}
 */
async function attempt(f) {
  try {
    return { ok: true, value: await f() };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * @template User
 * @template Payload
 * @template CustomData
 * @param {Config<User, Payload, CustomData>} config
 * @returns {Router}
 */
export default function ({ serverSetup, opaque, ...config }) {
  const router = express.Router();

  router.use(express.json());

  const loginStore = config.loginStore ?? memoryLoginStore();

  router.post("/register/start", (req, res) => {
    const { userIdentifier, registrationRequest } = req.body || {};

    if (!userIdentifier) return sendError(res, 400, ERR_USER_IDENT);
    if (!registrationRequest) return sendError(res, 400, ERR_REG_REQUEST);

    const registrationResponse = opaque.serverRegistrationStart({
      serverSetup,
      userIdentifier,
      registrationRequest,
    });

    res.send({ registrationResponse });
    res.end();
  });

  router.post("/register/finish", async (req, res) => {
    const { registrationUpload, userData } = req.body || {};

    if (!registrationUpload) return sendError(res, 400, ERR_REG_UPLOAD);
    if (!userData) return sendError(res, 400, ERR_USER);

    const passwordFile = opaque.serverRegistrationFinish(registrationUpload);

    try {
      const payload = await config.createUser(userData, passwordFile);
      res.send({ payload });
      res.end();
    } catch (err) {
      return sendError(res, 400, getError(err, ERR_USER_CREATE));
    }
  });

  router.post("/login/start", async (req, res) => {
    const { userIdentifier, credentialRequest } = req.body || {};
    if (!userIdentifier) return sendError(res, 400, "missing userIdentifier");
    if (!credentialRequest)
      return sendError(res, 400, "missing credentialRequest");

    const passwordFileResult = await attempt(() =>
      config.getPasswordFile(userIdentifier)
    );

    if (!passwordFileResult.ok) {
      return sendError(
        res,
        400,
        getError(passwordFileResult.error, ERR_GET_PASSWORD_FILE)
      );
    }

    const passwordFile = passwordFileResult.value;

    const { serverLogin, credentialResponse } = opaque.serverLoginStart({
      serverSetup,
      userIdentifier,
      passwordFile,
      credentialRequest,
    });

    const startResult = await attempt(() =>
      loginStore.createLogin(userIdentifier, serverLogin)
    );
    if (!startResult.ok) {
      return sendError(res, 400, getError(startResult.error, ERR_LOGIN_CREATE));
    }

    res.send({ credentialResponse });
    res.end();
  });

  router.post("/login/finish", async (req, res) => {
    const { userIdentifier, credentialFinalization, customData } =
      req.body || {};

    if (!userIdentifier) return sendError(res, 400, "missing userIdentifier");
    if (!credentialFinalization)
      return sendError(res, 400, "missing credentialFinalization");

    const remove = await attempt(() => loginStore.removeLogin(userIdentifier));
    if (!remove.ok) {
      return sendError(res, 400, getError(remove.error, ERR_LOGIN_REMOVE));
    }

    const serverLogin = remove.value;
    try {
      const sessionKey = opaque.serverLoginFinish({
        credentialFinalization,
        serverLogin,
      });

      const finish = await attempt(() =>
        config.finishLogin(userIdentifier, sessionKey, customData)
      );
      if (!finish.ok) {
        return sendError(res, 400, getError(finish.error, ERR_LOGIN_FINISH));
      }

      res.send({ ok: true });
      res.end();
    } catch (err) {
      console.error(err);
      return sendError(res, 500, ERR_UNKNOWN);
    }
  });

  return router;
}
