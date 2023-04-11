import cors from "cors";
import express from "express";
import * as opaque from "opaque";

const registeredUsers = {};
const pendingLogins = {};
const activeSessions = {};

const server = opaque.serverSetup();

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
  if (registeredUsers[username] != null)
    return sendError(res, 400, "user already registered");

  const registrationResponse = opaque.serverRegistrationStart({
    server,
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
  registeredUsers[username] = passwordFile;
  res.writeHead(200);
  res.end();
});

app.post("/login/start", (req, res) => {
  const { username, credentialRequest } = req.body || {};
  const passwordFile = username && registeredUsers[username];

  if (!username) return sendError(res, 400, "missing username");
  if (!credentialRequest)
    return sendError(res, 400, "missing credentialRequest");
  if (!passwordFile) return sendError(res, 400, "user not registered");
  if (pendingLogins[username] != null)
    return sendError(res, 400, "login already started");

  const { state, credentialResponse } = opaque.serverLoginStart({
    server,
    username,
    passwordFile,
    credentialRequest,
  });

  pendingLogins[username] = state;
  res.send({ credentialResponse });
  res.end();
});

app.post("/login/finish", (req, res) => {
  const { username, credentialFinalization } = req.body || {};
  const login = username && pendingLogins[username];

  if (!username) return sendError(res, 400, "missing username");
  if (!credentialFinalization)
    return sendError(res, 400, "missing credentialFinalization");
  if (!login) return sendError(res, 400, "login not started");

  const sessionKey = opaque.serverLoginFinish({
    server,
    credentialFinalization,
    state: login,
  });

  activeSessions[sessionKey] = username;
  delete pendingLogins[username];
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
