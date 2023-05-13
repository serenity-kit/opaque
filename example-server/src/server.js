import cors from "cors";
import express from "express";
import * as opaque from "@serenity-kit/opaque";
import Database, { readDatabaseFile, writeDatabaseFile } from "./database.js";

const activeSessions = {};
const dbFile = "./data.json";
const enableJsonFilePersistence = !process.argv.includes("--no-fs");

function initDatabase(filePath) {
  if (!enableJsonFilePersistence) {
    return Database.empty(opaque.serverSetup());
  }
  try {
    return readDatabaseFile(filePath);
  } catch (err) {
    console.log("failed to open database, initializing empty", err);
    const db = Database.empty(opaque.serverSetup());
    return db;
  }
}

const db = initDatabase(dbFile);
const serverSetup = db.serverSetup;

if (enableJsonFilePersistence) {
  writeDatabaseFile(dbFile, db);
  db.addListener(() => {
    writeDatabaseFile(dbFile, db);
  });
}

const app = express();
app.use(express.json());
app.use(cors());

function sendError(res, status, error) {
  res.writeHead(status);
  res.end(JSON.stringify({ error }));
}

app.post("/register/start", (req, res) => {
  const { clientIdentifier, registrationRequest } = req.body || {};

  if (!clientIdentifier) return sendError(res, 400, "missing clientIdentifier");
  if (!registrationRequest)
    return sendError(res, 400, "missing registrationRequest");
  if (db.hasUser(clientIdentifier))
    return sendError(res, 400, "user already registered");

  const registrationResponse = opaque.serverRegistrationStart({
    serverSetup,
    clientIdentifier,
    registrationRequest,
  });

  res.send({ registrationResponse });
  res.end();
});

app.post("/register/finish", (req, res) => {
  const { clientIdentifier, registrationUpload } = req.body || {};
  if (!clientIdentifier) return sendError(res, 400, "missing clientIdentifier");
  if (!registrationUpload)
    return sendError(res, 400, "missing registrationUpload");
  const passwordFile = opaque.serverRegistrationFinish(registrationUpload);
  db.setUser(clientIdentifier, passwordFile);
  res.writeHead(200);
  res.end();
});

app.post("/login/start", (req, res) => {
  const { clientIdentifier, credentialRequest } = req.body || {};
  const passwordFile = clientIdentifier && db.getUser(clientIdentifier);

  if (!clientIdentifier) return sendError(res, 400, "missing clientIdentifier");
  if (!credentialRequest)
    return sendError(res, 400, "missing credentialRequest");
  if (!passwordFile) return sendError(res, 400, "user not registered");
  if (db.hasLogin(clientIdentifier))
    return sendError(res, 400, "login already started");

  const { serverLogin, credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    clientIdentifier,
    passwordFile,
    credentialRequest,
  });

  db.setLogin(clientIdentifier, serverLogin);
  res.send({ credentialResponse });
  res.end();
});

app.post("/login/finish", (req, res) => {
  const { clientIdentifier, credentialFinalization } = req.body || {};
  const serverLogin = clientIdentifier && db.getLogin(clientIdentifier);

  if (!clientIdentifier) return sendError(res, 400, "missing clientIdentifier");
  if (!credentialFinalization)
    return sendError(res, 400, "missing credentialFinalization");
  if (!serverLogin) return sendError(res, 400, "login not started");

  const sessionKey = opaque.serverLoginFinish({
    serverSetup,
    credentialFinalization,
    serverLogin,
  });

  activeSessions[sessionKey] = clientIdentifier;
  db.removeLogin(clientIdentifier);
  res.writeHead(200);
  res.end();
});

app.post("/logout", (req, res) => {
  const auth = req.get("authorization");
  const user = auth && activeSessions[auth];
  if (!auth) return sendError(res, 401, "missing authorization header");
  if (!user) return sendError(res, 401, "no active session");

  delete activeSessions[clientIdentifier];
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

const port = 8089;

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
