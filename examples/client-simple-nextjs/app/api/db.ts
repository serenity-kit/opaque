import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import * as opaque from "@serenity-kit/opaque";

type LoginState = { value: string; timestamp: number };

class Database {
  constructor(
    private serverSetup: string,
    private users: Record<string, string> = {},
    private logins: Record<string, LoginState> = {},
    private listeners: (() => void)[] = []
  ) {}
  addListener(listener: () => void) {
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
  static empty(serverSetup: string) {
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
  getUser(name: string) {
    return this.users[name];
  }
  hasUser(name: string) {
    return this.users[name] != null;
  }
  getLogin(name: string) {
    return this.hasLogin(name) ? this.logins[name].value : null;
  }
  hasLogin(name: string) {
    const login = this.logins[name];
    if (login == null) return null;
    const now = new Date().getTime();
    const elapsed = now - login.timestamp;
    return elapsed < 2000;
  }
  setUser(name: string, value: string) {
    this.users[name] = value;
    this._notifyListeners();
  }
  setLogin(name: string, value: string) {
    this.logins[name] = { value, timestamp: new Date().getTime() };
    this._notifyListeners();
  }
  removeLogin(name: string) {
    delete this.logins[name];
    this._notifyListeners();
  }
  getServerSetup() {
    return this.serverSetup;
  }
}

function readDatabaseFile(filePath: string) {
  const json = readFileSync(filePath, "utf-8");
  const data = JSON.parse(json);
  const db = new Database(data.serverSetup, data.users, data.logins);
  return db;
}

function writeDatabaseFile(filePath: string, db: Database) {
  const data = db.stringify();
  return writeFile(filePath, data);
}

const db = opaque.ready.then(() => Database.empty(opaque.createServerSetup()));

export default db;
