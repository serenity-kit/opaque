import { readFileSync } from "fs";
import { writeFile } from "fs/promises";

const RESET_CODE_VALIDITY = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * @typedef {{code: string; timestamp: number}} ResetCode
 * @typedef {{value: string; timestamp: number}} Login
 */

/**
 *
 * @param {number} timestamp
 */
function isResetCodeValid(timestamp) {
  const now = new Date().getTime();
  const expiry = timestamp + RESET_CODE_VALIDITY;
  return now < expiry;
}

/**
 *
 * @param {Record<string, ResetCode>} codes
 */
function pruneResetCodes(codes) {
  /**
   * @type {Record<string, ResetCode>}
   */
  const result = {};
  for (let [key, entry] of Object.entries(codes)) {
    if (isResetCodeValid(entry.timestamp)) {
      result[key] = entry;
    }
  }
  return result;
}

/**
 * @implements DatastoreWithPasswordReset
 */
export default class InMemoryStore {
  /**
   * @constructor
   * @param {string} serverSetup
   */
  constructor(serverSetup) {
    this.serverSetup = serverSetup;
    /**
     * @type {Record<string,string>}
     */
    this.users = {};
    /**
     * @type {Record<string, Login>}
     */
    this.logins = {};
    /**
     * @type {Record<string, ResetCode>}
     */
    this.resetCodes = {};
    /** @type {(() => void)[]} */
    this.listeners = [];
  }

  /**
   * @param {{
   * serverSetup: string;
   * users?: Record<string, string>;
   * logins?: Record<string, Login>
   * resetCodes?: Record<string, ResetCode>
   * }} params
   */
  static init({ serverSetup, ...data }) {
    const db = new InMemoryStore(serverSetup);
    db.users = data.users || {};
    db.logins = data.logins || {};
    db.resetCodes = data.resetCodes || {};
    return db;
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
    return new InMemoryStore(serverSetup);
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
   * @param {string} user
   */
  async hasResetCode(user) {
    const entry = this.getResetCode(user);
    return entry != null;
  }

  /**
   * @param {string} user
   * @param {string} code
   */
  async setResetCode(user, code) {
    this.resetCodes[user] = { code, timestamp: new Date().getTime() };
    this._notifyListeners();
  }

  /**
   * @param {string} user
   */
  async removeResetCode(user) {
    if (this.resetCodes[user] != null) {
      delete this.resetCodes[user];
      this._notifyListeners();
    }
  }

  /**
   * @param {string} user
   */
  async getResetCode(user) {
    const entry = this.resetCodes[user];
    if (entry != null) {
      if (isResetCodeValid(entry.timestamp)) {
        return entry.code;
      }
      await this.removeResetCode(user);
    }
    return null;
  }
}

/**
 * @param {string} filePath
 */
export function readDatabaseFile(filePath) {
  const json = readFileSync(filePath, "utf-8");
  const data = JSON.parse(json);
  const db = InMemoryStore.init(data);
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
