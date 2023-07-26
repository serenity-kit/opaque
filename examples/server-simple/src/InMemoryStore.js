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
