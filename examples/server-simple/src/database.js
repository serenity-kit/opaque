import { readFileSync } from "fs";
import { writeFile } from "fs/promises";

export default class Database {
  /**
   * @constructor
   * @param {string} serverSetup
   * @param {Record<string, string>} users
   * @param {Record<string, {value: string; timestamp: number}>} logins
   */
  constructor(serverSetup, users, logins) {
    this.serverSetup = serverSetup;
    this.users = users;
    this.logins = logins;
    /** @type {(() => void)[]} */
    this.listeners = [];
  }

  /**
   *
   * @param {() =>void} listener
   */
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

  /**
   * @param {string} serverSetup
   */
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

  /**
   * @param {string} name
   */
  getUser(name) {
    return this.users[name];
  }

  /**
   * @param {string} name
   */
  hasUser(name) {
    return this.users[name] != null;
  }

  /**
   * @param {string} name
   */
  getLogin(name) {
    return this.hasLogin(name) ? this.logins[name].value : null;
  }

  /**
   * @param {string} name
   */
  hasLogin(name) {
    const login = this.logins[name];
    if (login == null) return null;
    const now = new Date().getTime();
    const elapsed = now - login.timestamp;
    return elapsed < 2000;
  }
  /**
   * @param {string} name
   * @param {string} value
   */
  setUser(name, value) {
    this.users[name] = value;
    this._notifyListeners();
  }

  /**
   * @param {string} name
   * @param {string} value
   */
  setLogin(name, value) {
    this.logins[name] = { value, timestamp: new Date().getTime() };
    this._notifyListeners();
  }

  /**
   * @param {string} name
   */
  removeLogin(name) {
    delete this.logins[name];
    this._notifyListeners();
  }
}

/**
 * @param {string} filePath
 */
export function readDatabaseFile(filePath) {
  const json = readFileSync(filePath, "utf-8");
  const data = JSON.parse(json);
  const db = new Database(data.serverSetup, data.users, data.logins);
  return db;
}

/**
 * @param {string} filePath
 * @param {Database} db
 */
export function writeDatabaseFile(filePath, db) {
  const data = db.stringify();
  return writeFile(filePath, data);
}
