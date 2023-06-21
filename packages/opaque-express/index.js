import express, { Router } from "express";

/**
 * @typedef {(userIdent: string, passwordFile: string) => Promise<unknown>} CreateUser
 */

/**
 * @typedef {Object} Config
 * @prop {CreateUser} createUser
 * @prop {string} serverSetup
 * @prop {unknown} [fallbackRegistrationError]
 * @prop {(userIdent: string, login: string) => Promise<void>} createLogin
 * @prop {(userIdent: string) => Promise<string>} removeLogin
 * @prop {(userIdent: string) => Promise<string>} getPasswordFile
 * @prop {(userIdent: string, sessionKey: string) => Promise<void>} finishLogin
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
 * @param {() => Promise<T>} f
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
 * @param {Config} config
 * @returns {Router}
 */
export default function ({ serverSetup, opaque, ...config }) {
  const router = express.Router();

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
    const { userIdentifier, registrationUpload } = req.body || {};
    if (!userIdentifier) return sendError(res, 400, ERR_USER_IDENT);
    if (!registrationUpload) return sendError(res, 400, ERR_REG_UPLOAD);
    const passwordFile = opaque.serverRegistrationFinish(registrationUpload);

    try {
      const payload = await config.createUser(userIdentifier, passwordFile);
      res.send({ payload });
      res.end();
    } catch (err) {
      return sendError(
        res,
        400,
        getError(err, config.fallbackRegistrationError ?? ERR_USER_CREATE)
      );
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
      config.createLogin(userIdentifier, serverLogin)
    );
    if (!startResult.ok) {
      return sendError(res, 400, getError(startResult.error, ERR_LOGIN_CREATE));
    }

    res.send({ credentialResponse });
    res.end();
  });

  router.post("/login/finish", async (req, res) => {
    const { userIdentifier, credentialFinalization } = req.body || {};

    if (!userIdentifier) return sendError(res, 400, "missing userIdentifier");
    if (!credentialFinalization)
      return sendError(res, 400, "missing credentialFinalization");

    const remove = await attempt(() => config.removeLogin(userIdentifier));
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
        config.finishLogin(userIdentifier, sessionKey)
      );
      if (!finish.ok) {
        return sendError(res, 400, getError(finish.error, ERR_LOGIN_FINISH));
      }

      res.writeHead(200);
      res.end();
    } catch (err) {
      return sendError(res, 500, ERR_UNKNOWN);
    }
  });

  return router;
}
