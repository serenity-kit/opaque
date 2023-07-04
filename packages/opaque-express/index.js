import express, { Router } from "express";

/**
 * @template T
 * @typedef {T|Promise<T>} MaybeAsync
 */

/**
 * @template User
 * @template Payload
 * @typedef {(user: User, registrationRecord: string) => MaybeAsync<Payload>} RegistrationSuccessHandler
 */

/**
 * @template L, R
 * @typedef {{ok: true; value: R}|{ok: false; error: L}} Result
 */

/**
 * @typedef {Object} LoginStore
 * @prop {(userIdent: string, login: string) => MaybeAsync<void>} createLogin
 * @prop {(userIdent: string) => MaybeAsync<string>} removeLogin
 */

/**
 * @template CustomData
 * @typedef {(userIdent: string, sessionKey: string, customData: CustomData) => MaybeAsync<void>} LoginSuccessHandler
 */

/**
 * @template [User=unknown]
 * @template [RegistrationSuccessResponse=unknown]
 * @template [CustomData=unknown]
 * @typedef {Object} Config
 * @prop {RegistrationSuccessHandler<User, RegistrationSuccessResponse>} onRegistrationSuccess
 * @prop {string} serverSetup
 * @prop {LoginStore} [loginStore]
 * @prop {(userIdent: string) => MaybeAsync<string>} getRegistrationRecord
 * @prop {LoginSuccessHandler<CustomData>} onLoginSuccess
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

const ERR_INVALID_USER_IDENTIFIER = "ERR_INVALID_USER_IDENTIFIER";
const ERR_INVALID_REGISTRATION_REQUEST = "ERR_INVALID_REGISTRATION_REQUEST";
const ERR_INVALID_REGISTRATION_RECORD = "ERR_INVALID_REGISTRATION_RECORD";
const ERR_INVALID_START_LOGIN_REQUEST = "ERR_INVALID_START_LOGIN_REQUEST";
const ERR_INVALID_FINISH_LOGIN_REQUEST = "ERR_INVALID_FINISH_LOGIN_REQUEST";
const ERR_ON_REGISTRATION_SUCCESS = "ERR_ON_REGISTRATION_SUCCESS";
const ERR_LOGIN_STORE_CREATE = "ERR_LOGIN_STORE_CREATE";
const ERR_LOGIN_STORE_REMOVE = "ERR_LOGIN_STORE_REMOVE";
const ERR_ON_LOGIN_SUCCESS = "ERR_ON_LOGIN_SUCCESS";
const ERR_GET_REGISTRATION_RECORD = "ERR_GET_REGISTRATION_RECORD";
const ERR_UNKNOWN = "ERR_UNKNOWN";

const ERR_INVALID_USER_DATA = "ERR_INVALID_USER_DATA";

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

    if (!userIdentifier)
      return sendError(res, 400, ERR_INVALID_USER_IDENTIFIER);
    if (!registrationRequest)
      return sendError(res, 400, ERR_INVALID_REGISTRATION_REQUEST);

    const { registrationResponse } = opaque.server.createRegistrationResponse({
      serverSetup,
      userIdentifier,
      registrationRequest,
    });

    res.send({ registrationResponse });
    res.end();
  });

  router.post("/register/finish", async (req, res) => {
    const { registrationRecord, userData } = req.body || {};

    if (!registrationRecord)
      return sendError(res, 400, ERR_INVALID_REGISTRATION_RECORD);
    if (!userData) return sendError(res, 400, ERR_INVALID_USER_DATA);

    try {
      const userDataResponse = await config.onRegistrationSuccess(
        userData,
        registrationRecord
      );
      res.send({ userData: userDataResponse });
      res.end();
    } catch (err) {
      return sendError(res, 400, getError(err, ERR_ON_REGISTRATION_SUCCESS));
    }
  });

  router.post("/login/start", async (req, res) => {
    const { userIdentifier, startLoginRequest } = req.body || {};
    if (!userIdentifier)
      return sendError(res, 400, ERR_INVALID_USER_IDENTIFIER);
    if (!startLoginRequest)
      return sendError(res, 400, ERR_INVALID_START_LOGIN_REQUEST);

    const registrationResult = await attempt(() =>
      config.getRegistrationRecord(userIdentifier)
    );

    if (!registrationResult.ok) {
      return sendError(
        res,
        400,
        getError(registrationResult.error, ERR_GET_REGISTRATION_RECORD)
      );
    }

    const registrationRecord = registrationResult.value;

    const { serverLoginState, loginResponse } = opaque.server.startLogin({
      serverSetup,
      userIdentifier,
      registrationRecord,
      startLoginRequest,
    });

    const startResult = await attempt(() =>
      loginStore.createLogin(userIdentifier, serverLoginState)
    );
    if (!startResult.ok) {
      return sendError(
        res,
        400,
        getError(startResult.error, ERR_LOGIN_STORE_CREATE)
      );
    }

    res.send({ loginResponse });
    res.end();
  });

  router.post("/login/finish", async (req, res) => {
    const { userIdentifier, finishLoginRequest, customData } = req.body || {};

    if (!userIdentifier)
      return sendError(res, 400, ERR_INVALID_USER_IDENTIFIER);
    if (!finishLoginRequest)
      return sendError(res, 400, ERR_INVALID_FINISH_LOGIN_REQUEST);

    const remove = await attempt(() => loginStore.removeLogin(userIdentifier));
    if (!remove.ok) {
      return sendError(
        res,
        400,
        getError(remove.error, ERR_LOGIN_STORE_REMOVE)
      );
    }

    const serverLoginState = remove.value;
    try {
      const { sessionKey } = opaque.server.finishLogin({
        finishLoginRequest,
        serverLoginState,
      });

      const finish = await attempt(() =>
        config.onLoginSuccess(userIdentifier, sessionKey, customData)
      );
      if (!finish.ok) {
        return sendError(
          res,
          400,
          getError(finish.error, ERR_ON_LOGIN_SUCCESS)
        );
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
