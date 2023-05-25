import { readFileSync } from "fs";
import { writeFile } from "fs/promises";

export default class Database {
  constructor(serverSetup, users, logins) {
    this.serverSetup = serverSetup;
    this.users = users;
    this.logins = logins;
    this.listeners = [];
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
    return new Database(serverSetup, {}, {});
  }
  stringify() {
    return JSON.stringify(
      {
        serverSetup: this.serverSetup,
        logins: this.logins,
        users: this.users,
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
}

export function readDatabaseFile(filePath) {
  const json = readFileSync(filePath, "utf-8");
  const data = JSON.parse(json);
  const db = new Database(data.serverSetup, data.users, data.logins);
  return db;
}

export function writeDatabaseFile(filePath, db) {
  const data = db.stringify();
  return writeFile(filePath, data);
}
