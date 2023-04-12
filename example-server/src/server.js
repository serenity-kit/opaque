import cors from "cors";
import express from "express";
import * as opaque from "opaque";
import Database from "./database.js";

const activeSessions = {};

const dbFile = "./data.json";

function initDatabase(filePath) {
  try {
    return Database.open(filePath);
  } catch (err) {
    console.log("failed to open database, initializing empty", err);
    const db = Database.create(filePath, opaque.serverSetup());
    db.writeFile();
    return db;
  }
}

const db = initDatabase(dbFile);
const serverSetup = db.serverSetup;

const app = express();
app.use(express.json());
app.use(cors());

function sendError(res, status, error) {
  res.writeHead(status);
  res.end(JSON.stringify({ error }));
}

app.post("/register/start", (req, res) => {
  const { username, registrationRequest } = req.body || {};

  if (!username) return sendError(res, 400, "missing username");
  if (!registrationRequest)
    return sendError(res, 400, "missing registrationRequest");
  if (db.hasUser(username))
    return sendError(res, 400, "user already registered");

  const registrationResponse = opaque.serverRegistrationStart({
    serverSetup,
    username,
    registrationRequest,
  });

  res.send({ registrationResponse });
  res.end();
});

app.post("/register/finish", (req, res) => {
  const { username, registrationMessage } = req.body || {};
  if (!username) return sendError(res, 400, "missing username");
  if (!registrationMessage)
    return sendError(res, 400, "missing registrationMessage");
  const passwordFile = opaque.serverRegistrationFinish(registrationMessage);
  db.setUser(username, passwordFile);
  res.writeHead(200);
  res.end();
});

app.post("/login/start", (req, res) => {
  const { username, credentialRequest } = req.body || {};
  const passwordFile = username && db.getUser(username);

  if (!username) return sendError(res, 400, "missing username");
  if (!credentialRequest)
    return sendError(res, 400, "missing credentialRequest");
  if (!passwordFile) return sendError(res, 400, "user not registered");
  if (db.hasLogin(username))
    return sendError(res, 400, "login already started");

  const { serverLogin, credentialResponse } = opaque.serverLoginStart({
    serverSetup,
    username,
    passwordFile,
    credentialRequest,
  });

  db.setLogin(username, state);
  res.send({ credentialResponse });
  res.end();
});

app.post("/login/finish", (req, res) => {
  const { username, credentialFinalization } = req.body || {};
  const serverLogin = username && db.getLogin(username);

  if (!username) return sendError(res, 400, "missing username");
  if (!credentialFinalization)
    return sendError(res, 400, "missing credentialFinalization");
  if (!serverLogin) return sendError(res, 400, "login not started");

  const sessionKey = opaque.serverLoginFinish({
    serverSetup,
    credentialFinalization,
    serverLogin,
  });

  activeSessions[sessionKey] = username;
  db.removeLogin();
  res.writeHead(200);
  res.end();
});

app.post("/logout", (req, res) => {
  const auth = req.get("authorization");
  const user = auth && activeSessions[auth];
  if (!auth) return sendError(res, 401, "missing authorization header");
  if (!user) return sendError(res, 401, "no active session");

  delete activeSessions[username];
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
