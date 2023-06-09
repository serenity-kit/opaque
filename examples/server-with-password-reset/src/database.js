import { readFileSync } from "fs";
import { writeFile } from "fs/promises";

const RESET_CODE_VALIDITY = 10 * 60 * 1000; // 10 minutes in milliseconds

function isResetCodeValid(timestamp) {
  const now = new Date().getTime();
  const expiry = timestamp + RESET_CODE_VALIDITY;
  return now < expiry;
}

function pruneResetCodes(codes) {
  const result = {};
  for (let [key, entry] of Object.entries(codes)) {
    if (isResetCodeValid(entry.timestamp)) {
      result[key] = entry;
    }
  }
  return result;
}

export default class Database {
  constructor(serverSetup) {
    this.serverSetup = serverSetup;
    this.users = {};
    this.logins = {};
    this.resetCodes = {};
    this.listeners = [];
  }
  static init({ serverSetup, ...data }) {
    const db = new Database(serverSetup);
    db.users = data.users || {};
    db.logins = data.logins || {};
    db.resetCodes = data.resetCodes || {};
    return db;
  }
  addListener(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  _notifyListeners() {
    for (let listener of this.listeners) {
      listener();
    }
  }
  static empty(serverSetup) {
    return new Database(serverSetup);
  }
  stringify() {
    return JSON.stringify(
      {
        serverSetup: this.serverSetup,
        logins: this.logins,
        users: this.users,
        resetCodes: pruneResetCodes(this.resetCodes),
      },
      null,
      2
    );
  }
  getUser(name) {
    return this.users[name];
  }
  hasUser(name) {
    return this.users[name] != null;
  }
  getLogin(name) {
    return this.hasLogin(name) ? this.logins[name].value : null;
  }
  hasLogin(name) {
    const login = this.logins[name];
    if (login == null) return null;
    const now = new Date().getTime();
    const elapsed = now - login.timestamp;
    return elapsed < 2000;
  }
  setUser(name, value) {
    this.users[name] = value;
    this._notifyListeners();
  }
  setLogin(name, value) {
    this.logins[name] = { value, timestamp: new Date().getTime() };
    this._notifyListeners();
  }
  removeLogin(name) {
    delete this.logins[name];
    this._notifyListeners();
  }
  hasResetCode(user) {
    const entry = this.getResetCode(user);
    return entry != null;
  }
  setResetCode(user, code) {
    this.resetCodes[user] = { code, timestamp: new Date().getTime() };
    this._notifyListeners();
  }
  removeResetCode(user) {
    if (this.resetCodes[user] != null) {
      delete this.resetCodes[user];
      this._notifyListeners();
    }
  }
  getResetCode(user) {
    const entry = this.resetCodes[user];
    if (entry != null) {
      if (isResetCodeValid(entry.timestamp)) {
        return entry;
      }
      this.removeResetCode(user);
    }
    return null;
  }
}

export function readDatabaseFile(filePath) {
  const json = readFileSync(filePath, "utf-8");
  const data = JSON.parse(json);
  const db = Database.init(data);
  return db;
}

export function writeDatabaseFile(filePath, db) {
  const data = db.stringify();
  return writeFile(filePath, data);
}
