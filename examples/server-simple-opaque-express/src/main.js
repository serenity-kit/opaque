import * as opaque from "@serenity-kit/opaque";
import opaqueExpress from "@serenity-kit/opaque-express";
import express from "express";
import cors from "cors";

const serverSetup =
  "kEid0LqczTVVYdd_zwe81D3XEyieFA1Jn4T0HROoGMIjOP0lKCa7CGOngXzud9CvDGIKvfsLJDiUyGr3dyOtrdKExDku5hiy8rWwgWboHkcpYztsyDs_029rguJ9sjsPUd2AnVsb7WG6DIid_ilBtezHgstnPtn04jIDF4Ab2wU";

/**
 * @typedef {Object} User
 * @prop {string} email
 * @prop {string} name
 */

/**
 * @typedef {User & {passwordFile: string; id: number, insertedAt: number}} DbUser
 */

/** @type {Record<string,DbUser>} */
const db = {};

/** @type {Record<string, string>} */
const sessions = {};

let nextUserId = 1;

/**
 * @param {User} user
 * @param {string} passwordFile
 * @returns {Omit<DbUser, 'passwordFile'>}
 */
function createUser(user, passwordFile) {
  console.log("CREATE USER", user);
  if (db[user.name] != null) {
    throw new Error("USER_EXISTS");
  }
  const dbUser = {
    ...user,
    passwordFile,
    id: nextUserId++,
    insertedAt: new Date().getTime(),
  };
  db[user.name] = dbUser;
  const { passwordFile: _, ...result } = dbUser;
  return result;
}

/**
 * @param {string} userIdent
 * @param {string} sessionKey
 * @param {{rememberMe: boolean}} props
 */
function finishLogin(userIdent, sessionKey, props) {
  console.log("FINISH LOGIN", props);
  sessions[userIdent] = sessionKey;
}

/**
 * @param {string} userIdent
 * @returns string
 */
function getPasswordFile(userIdent) {
  if (db[userIdent] == null) {
    throw new Error("USER_NOT_FOUND");
  }
  return db[userIdent].passwordFile;
}

const opaqueRouter = opaqueExpress({
  opaque,
  serverSetup,
  createUser,
  finishLogin,
  getPasswordFile,
});

const app = express();

app.use(cors());
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
