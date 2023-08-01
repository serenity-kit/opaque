import { readFileSync } from "fs";
import { writeFile } from "fs/promises";

/**
 * @implements Datastore
 */
export default class InMemoryStore {
  /**
   * @constructor
   * @param {Record<string, string>} users
   * @param {Record<string, {value: string; timestamp: number}>} logins
   */
  constructor(users, logins) {
    this.users = users;
    this.logins = logins;
    /** @type {(() => void)[]} */
    this.listeners = [];
    /** @type {Record<string,SessionData & {expiresAt: number}>} */
    this.sessions = {};
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

  static empty() {
    return new InMemoryStore({}, {});
  }

  stringify() {
    return JSON.stringify(
      {
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
  async getUser(name) {
    return this.users[name];
  }

  /**
   * @param {string} name
   */
  async hasUser(name) {
    return this.users[name] != null;
  }

  /**
   * @param {string} name
   */
  async getLogin(name) {
    const hasLogin = await this.hasLogin(name);
    return hasLogin ? this.logins[name].value : null;
  }

  /**
   * @param {string} name
   */
  async hasLogin(name) {
    const login = this.logins[name];
    if (login == null) return false;
    const now = new Date().getTime();
    const elapsed = now - login.timestamp;
    return elapsed < 2000;
  }

  /**
   * @param {string} name
   * @param {string} value
   */
  async setUser(name, value) {
    this.users[name] = value;
    this._notifyListeners();
  }

  /**
   * @param {string} name
   * @param {string} value
   */
  async setLogin(name, value) {
    this.logins[name] = { value, timestamp: new Date().getTime() };
    this._notifyListeners();
  }

  /**
   * @param {string} name
   */
  async removeLogin(name) {
    delete this.logins[name];
    this._notifyListeners();
  }

  /**
   * @param {string} id
   */
  async getSession(id) {
    const session = this.sessions[id];
    if (session == null) return null;
    const { expiresAt, ...sessionData } = session;
    if (expiresAt < new Date().getTime()) {
      await this.clearSession(id);
      return null;
    }
    return sessionData;
  }

  /**
   * @param {string} id
   * @param {SessionData} session
   * @param {number} lifetimeInDays
   */
  async setSession(id, session, lifetimeInDays = 14) {
    const expiresAt =
      new Date().getTime() +
      lifetimeInDays *
        24 /*hours*/ *
        60 /*minutes*/ *
        60 /*seconds*/ *
        1000; /*milliseconds*/
    this.sessions[id] = { ...session, expiresAt };
  }

  /**
   * @param {string} id
   */
  async clearSession(id) {
    delete this.sessions[id];
  }
}

/**
 * @param {string} filePath
 */
export function readDatabaseFile(filePath) {
  const json = readFileSync(filePath, "utf-8");
  const data = JSON.parse(json);
  const db = new InMemoryStore(data.users, data.logins);
  return db;
}

/**
 * @param {string} filePath
 * @param {InMemoryStore} db
 */
export function writeDatabaseFile(filePath, db) {
  const data = db.stringify();
  return writeFile(filePath, data);
}
