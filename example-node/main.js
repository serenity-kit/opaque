import express from "express";
import * as opaque from "opaque";

const registeredUsers = {};
const pendingLogins = {};
const activeSessions = {};

const opaqueServer = new opaque.Server();

const app = express();
app.use(express.json());

app.post("/register/start", (req, res) => {
  const { username, registrationRequest } = req.body || {};
  if (!username || !registrationRequest || registeredUsers[username] != null) {
    res.writeHead(400);
    res.end();
    return;
  }
  const registrationResponse = opaqueServer.startRegistration(
    username,
    registrationRequest
  );
  res.send({ registrationResponse });
  res.end();
});

app.post("/register/finish", (req, res) => {
  const { username, registrationMessage } = req.body || {};
  if (!username || !registrationMessage) {
    res.writeHead(400);
    res.end();
    return;
  }
  const passwordFile = opaque.serverRegisterFinish(registrationMessage);
  registeredUsers[username] = passwordFile;
  res.writeHead(200);
  res.end();
});

app.post("/login/start", (req, res) => {
  const { username, credentialRequest } = req.body || {};
  const passwordFile = username && registeredUsers[username];
  if (
    !username ||
    !credentialRequest ||
    passwordFile == null ||
    pendingLogins[username] != null
  ) {
    res.writeHead(400);
    res.end();
    return;
  }
  const login = opaqueServer.startLogin(
    username,
    passwordFile,
    credentialRequest
  );
  const credentialResponse = login.getCredentialResponse();
  pendingLogins[username] = login;
  res.send({ credentialResponse });
  res.end();
});

app.post("/login/finish", (req, res) => {
  const { username, credentialFinalization } = req.body || {};
  const login = username && pendingLogins[username];
  if (!username || !credentialFinalization || !login) {
    res.writeHead(400);
    res.end();
    return;
  }
  const sessionKey = login.finish(credentialFinalization);
  activeSessions[sessionKey] = username;
  res.writeHead(200);
  res.end();
});

app.post("/logout", (req, res) => {
  const auth = req.get("authorization");
  const user = auth && activeSessions[auth];
  if (!user) {
    res.writeHead(401);
    res.end();
    return;
  }
  delete activeSessions[username];
  res.end();
});

app.get("/private", (req, res) => {
  const auth = req.get("authorization");
  const user = auth && activeSessions[auth];
  if (!user) {
    res.writeHead(401);
    res.end();
    return;
  }
  res.send({ message: "hello opaque-authenticated world" });
  res.end();
});

const port = 8089;

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
