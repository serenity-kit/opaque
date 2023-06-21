import * as opaque from "@serenity-kit/opaque";
import opaqueExpress from "@serenity-kit/opaque-express";
import express from "express";
import Database from "./database.js";

const serverSetup =
  "kEid0LqczTVVYdd_zwe81D3XEyieFA1Jn4T0HROoGMIjOP0lKCa7CGOngXzud9CvDGIKvfsLJDiUyGr3dyOtrdKExDku5hiy8rWwgWboHkcpYztsyDs_029rguJ9sjsPUd2AnVsb7WG6DIid_ilBtezHgstnPtn04jIDF4Ab2wU";

const db = Database.empty(serverSetup);

/** @type {Record<string, string>} */
const sessions = {};

const opaqueRouter = opaqueExpress({
  opaque,
  serverSetup,
  createLogin: async (userIdent, login) => {
    db.setLogin(userIdent, login);
  },
  removeLogin: async (userIdent) => {
    const login = db.getLogin(userIdent);
    if (!login) {
      throw new Error("LOGIN_NOT_FOUND");
    }
    db.removeLogin(userIdent);
    return login;
  },
  createUser: async (userIdent, passwordFile) => {
    if (db.hasUser(userIdent)) {
      throw new Error("USER_EXISTS");
    }
    db.setUser(userIdent, passwordFile);
  },
  finishLogin: async (userIdent, sessionKey) => {
    sessions[userIdent] = sessionKey;
  },
  getPasswordFile: async (userIdent) => {
    if (!db.hasUser(userIdent)) throw new Error("USER_NOT_FOUND");
    return db.getUser(userIdent);
  },
});

const app = express();

app.use("/auth/opaque", opaqueRouter);

/**
 * @param {import("express").Response} res
 * @param {number} status
 * @param {string} error
 */
function sendError(res, status, error) {
  res.writeHead(status);
  res.end(JSON.stringify({ error }));
}

app.post("/logout", (req, res) => {
  const auth = req.get("authorization");
  const userIdentifier = auth && sessions[auth];
  if (!auth) return sendError(res, 401, "missing authorization header");
  if (!userIdentifier) return sendError(res, 401, "no active session");

  delete sessions[userIdentifier];
  res.end();
});

app.get("/private", (req, res) => {
  const auth = req.get("authorization");
  const user = auth && sessions[auth];
  if (!auth) return sendError(res, 401, "missing authorization header");
  if (!user) return sendError(res, 401, "no active session");

  res.send({ message: `you are authenticated as "${user}"` });
  res.end();
});

const port = 8881;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
