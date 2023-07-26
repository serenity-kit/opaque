import * as opaque from "@serenity-kit/opaque";
import cors from "cors";
import { randomInt } from "crypto";
import express from "express";
import InMemoryStore, {
  readDatabaseFile,
  writeDatabaseFile,
} from "./InMemoryStore.js";
import RedisStore from "./RedisStore.js";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

/**
 * @type {Record<string, string>}
 */
const activeSessions = {};
const dbFile = "./data.json";
const enableJsonFilePersistence = !readEnvFlag("DISABLE_FS");
const enableRedis = readEnvFlag("ENABLE_REDIS");

const DEFAULT_REDIS_URL = "redis://127.0.0.1:6379";
const REDIS_URL = process.env.REDIS_URL || DEFAULT_REDIS_URL;

/**
 * @param {string} key
 */
function readEnvFlag(key) {
  const value = process.env[key];
  if (value == null) return false;
  try {
    return Boolean(JSON.parse(value));
  } catch (err) {
    return false;
  }
}

function getOpaqueServerSetup() {
  const serverSetup = process.env.OPAQUE_SERVER_SETUP;
  if (serverSetup == null) {
    console.error(process.env);
    throw new Error("OPAQUE_SERVER_SETUP env variable is not set");
  }
  return serverSetup;
}

/**
 * @param {string} filePath
 */
async function initInMemoryStore(filePath) {
  await opaque.ready;
  if (!enableJsonFilePersistence) {
    return InMemoryStore.empty();
  }
  try {
    const db = readDatabaseFile(filePath);
    console.log(`database successfully initialized from file "${filePath}"`);
    return db;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      console.log(
        `no database file "${filePath}" found, initializing empty database`
      );
    } else {
      console.error(
        `failed to open database file "${filePath}", initializing empty database`,
        err
      );
    }
    const db = InMemoryStore.empty();
    return db;
  }
}

/**
 * @type {DatastoreWithPasswordReset}
 */
let db;

async function setUpInMemoryStore() {
  const memDb = await initInMemoryStore(dbFile);

  if (enableJsonFilePersistence) {
    writeDatabaseFile(dbFile, memDb);
    memDb.addListener(() => {
      writeDatabaseFile(dbFile, memDb);
    });
  }
  db = memDb;
}

async function setUpRedisStore() {
  try {
    const redis = new RedisStore(REDIS_URL);
    redis.onError((err) => {
      console.error("Redis Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    });
    await redis.connect();
    db = redis;
    console.log("connected to redis at", REDIS_URL);
  } catch (err) {
    console.error(
      "Redis Setup Error:",
      err instanceof Error ? err.message : err
    );
    process.exit(1);
  }
}

async function setupDb() {
  if (enableRedis) {
    await setUpRedisStore();
  } else {
    await setUpInMemoryStore();
  }
}

const app = express();
app.use(express.json());
app.use(cors());

/**
 * @param {import("express").Response} res
 * @param {number} status
 * @param {string} error
 */
function sendError(res, status, error) {
  res.writeHead(status);
  res.end(JSON.stringify({ error }));
}

app.post("/register/start", async (req, res) => {
  const { userIdentifier, registrationRequest } = req.body || {};

  if (!userIdentifier) return sendError(res, 400, "missing userIdentifier");
  if (!registrationRequest)
    return sendError(res, 400, "missing registrationRequest");

  const userExists = await db.hasUser(userIdentifier);
  if (userExists) {
    return sendError(res, 400, "user already registered");
  }

  const { registrationResponse } = opaque.server.createRegistrationResponse({
    serverSetup: getOpaqueServerSetup(),
    userIdentifier,
    registrationRequest,
  });

  res.send({ registrationResponse });
  res.end();
});

app.post("/register/finish", (req, res) => {
  const { userIdentifier, registrationRecord } = req.body || {};
  if (!userIdentifier) return sendError(res, 400, "missing userIdentifier");
  if (!registrationRecord)
    return sendError(res, 400, "missing registrationRecord");
  db.setUser(userIdentifier, registrationRecord);
  res.writeHead(200);
  res.end();
});

app.post("/login/start", async (req, res) => {
  const { userIdentifier, startLoginRequest } = req.body || {};
  if (!userIdentifier) return sendError(res, 400, "missing userIdentifier");

  if (!startLoginRequest)
    return sendError(res, 400, "missing startLoginRequest");

  const registrationRecord = await db.getUser(userIdentifier);
  if (!registrationRecord) return sendError(res, 400, "user not registered");

  const loginExists = await db.hasLogin(userIdentifier);
  if (loginExists) {
    return sendError(res, 400, "login already started");
  }

  const { serverLoginState, loginResponse } = opaque.server.startLogin({
    serverSetup: getOpaqueServerSetup(),
    userIdentifier,
    registrationRecord,
    startLoginRequest,
  });

  await db.setLogin(userIdentifier, serverLoginState);

  res.send({ loginResponse });
  res.end();
});

app.post("/login/finish", async (req, res) => {
  const { userIdentifier, finishLoginRequest } = req.body || {};

  if (!userIdentifier) return sendError(res, 400, "missing userIdentifier");
  if (!finishLoginRequest)
    return sendError(res, 400, "missing finishLoginRequest");

  const serverLoginState = await db.getLogin(userIdentifier);
  if (!serverLoginState) return sendError(res, 400, "login not started");

  const { sessionKey } = opaque.server.finishLogin({
    finishLoginRequest,
    serverLoginState,
  });

  activeSessions[sessionKey] = userIdentifier;

  await db.removeLogin(userIdentifier);

  res.writeHead(200);
  res.end();
});

app.post("/logout", (req, res) => {
  const auth = req.get("authorization");
  const userIdentifier = auth && activeSessions[auth];
  if (!auth) return sendError(res, 401, "missing authorization header");
  if (!userIdentifier) return sendError(res, 401, "no active session");

  delete activeSessions[userIdentifier];
  res.end();
});

app.get("/private", (req, res) => {
  const auth = req.get("authorization");
  const user = auth && activeSessions[auth];
  if (!auth) return sendError(res, 401, "missing authorization header");
  if (!user) return sendError(res, 401, "no active session");

  res.send({ message: `hello ${user} from opaque-authenticated world` });
  res.end();
});

function generateResetCode() {
  if (process.env.TEST_RESET_CODE) {
    return process.env.TEST_RESET_CODE;
  }

  return randomInt(1e9, 1e10).toString();
}

app.post("/password/reset", async (req, res) => {
  const { userIdentifier } = req.body || {};
  if (!userIdentifier) return sendError(res, 400, "missing userIdentifier");

  const hasUser = await db.hasUser(userIdentifier);
  if (!hasUser) return sendError(res, 400, "user not found");

  const code = generateResetCode();

  console.log("==============================");
  console.log();
  console.log(" PASSWORD RESET CODE");
  console.log(` ${code}`);
  console.log();
  console.log("==============================");

  await db.setResetCode(userIdentifier, code);
  res.end();
});

app.post("/password/reset/confirm", async (req, res) => {
  const { userIdentifier, resetCode, registrationRequest } = req.body || {};

  if (!userIdentifier) return sendError(res, 400, "missing userIdentifier");

  if (!resetCode) return sendError(res, 400, "missing resetCode");
  if (!registrationRequest)
    return sendError(res, 400, "missing registrationRequest");

  const storedResetCode = await db.getResetCode(userIdentifier);
  if (storedResetCode == null) {
    return sendError(res, 404, "reset code is invalid or expired");
  }

  await db.removeResetCode(userIdentifier);

  if (storedResetCode !== resetCode) {
    return sendError(res, 400, "reset code is invalid or expired");
  }

  const { registrationResponse } = opaque.server.createRegistrationResponse({
    serverSetup: getOpaqueServerSetup(),
    userIdentifier,
    registrationRequest,
  });

  res.send({ registrationResponse });
  res.end();
});

async function main() {
  await setupDb();
  const port = 8089;
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
}

main();
