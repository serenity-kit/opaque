import { readFile, writeFile } from "fs/promises";
import { Datastore } from "./Datastore";

type LoginState = { value: string; timestamp: number };

export default class InMemoryStore implements Datastore {
  constructor(
    private users: Record<string, string> = {},
    private logins: Record<string, LoginState> = {},
    private listeners: (() => Promise<void>)[] = [],
  ) {}
  addListener(listener: () => Promise<void>) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  _notifyListeners() {
    return Promise.all(this.listeners.map((f) => f()));
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
      2,
    );
  }
  async getUser(name: string) {
    return this.users[name];
  }
  async hasUser(name: string) {
    return this.users[name] != null;
  }
  async getLogin(name: string) {
    const hasLogin = await this.hasLogin(name);
    return hasLogin ? this.logins[name].value : null;
  }
  async hasLogin(name: string) {
    const login = this.logins[name];
    if (login == null) return false;
    const now = new Date().getTime();
    const elapsed = now - login.timestamp;
    return elapsed < 2000;
  }
  async setUser(name: string, value: string) {
    this.users[name] = value;
    await this._notifyListeners();
  }
  async setLogin(name: string, value: string) {
    this.logins[name] = { value, timestamp: new Date().getTime() };
    await this._notifyListeners();
  }
  async removeLogin(name: string) {
    delete this.logins[name];
    await this._notifyListeners();
  }
}

export async function readDatabaseFile(filePath: string) {
  const json = await readFile(filePath, "utf-8");
  const data = JSON.parse(json);
  const db = new InMemoryStore(data.users, data.logins);
  return db;
}

export function writeDatabaseFile(filePath: string, db: InMemoryStore) {
  const data = db.stringify();
  return writeFile(filePath, data);
}
