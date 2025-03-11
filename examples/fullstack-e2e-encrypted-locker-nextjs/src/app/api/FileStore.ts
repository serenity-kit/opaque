import fs from "fs/promises";
import path from "path";
import { Locker } from "../utils/locker";
import { Datastore, RecoveryEntry, SessionEntry } from "./Datastore";

const MILLISECONDS_PER_DAY =
  24 /*hours*/ * 60 /*minutes*/ * 60 /*seconds*/ * 1000; /*milliseconds*/

const LOGIN_CONTEXT_SESSION = "session";
const LOGIN_CONTEXT_RECOVERY = "recovery";

type LoginState = { value: string; timestamp: number };

type Schema = {
  users: Record<string, string>;
  logins: Record<string, LoginState>;
  lockers: Record<string, Locker>;
  sessions: Record<string, SessionEntry & { expiresAt: number }>;
  recovery: Record<string, RecoveryEntry>;
};

export default class FileStore implements Datastore {
  private filePath: string;

  constructor(
    filePath: string,
    private listeners: (() => Promise<void>)[] = [],
  ) {
    this.filePath = path.resolve(filePath);
  }

  async initialize() {
    try {
      await fs.access(this.filePath);
      console.log("FileStore: found data file at", this.filePath);
    } catch (error) {
      console.log(
        "FileStore: could not find data file, creating new file",
        error,
      );
      const initialData: Schema = {
        users: {},
        logins: {},
        lockers: {},
        sessions: {},
        recovery: {},
      };
      await fs.writeFile(
        this.filePath,
        JSON.stringify(initialData, null, 2),
        "utf8",
      );
    }
    return this;
  }

  private async _readFile(): Promise<Schema> {
    try {
      const fileData = await fs.readFile(this.filePath, "utf8");
      return JSON.parse(fileData);
    } catch (error) {
      console.error("Error reading file:", error);
      // Return empty schema if file can't be read
      return {
        users: {},
        logins: {},
        lockers: {},
        sessions: {},
        recovery: {},
      };
    }
  }

  private async _writeFile(data: Schema): Promise<boolean> {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf8");
      return true;
    } catch (error) {
      console.error("Error writing to file:", error);
      return false;
    }
  }

  async getUser(name: string) {
    const data = await this._readFile();
    return data.users[name];
  }

  async hasUser(name: string) {
    const data = await this._readFile();
    return data.users[name] != null;
  }

  async getLogin(name: string, context: string = LOGIN_CONTEXT_SESSION) {
    const hasLogin = await this.hasLogin(name, context);
    if (!hasLogin) return null;

    const data = await this._readFile();
    return data.logins[`${context}:${name}`].value;
  }

  async hasLogin(name: string, context: string = LOGIN_CONTEXT_SESSION) {
    const data = await this._readFile();
    const login = data.logins[`${context}:${name}`];
    if (login == null) return false;
    const now = new Date().getTime();
    const elapsed = now - login.timestamp;
    return elapsed < 2000;
  }

  async setUser(name: string, value: string) {
    const data = await this._readFile();
    data.users[name] = value;
    await this._writeFile(data);
  }

  async setLogin(
    name: string,
    value: string,
    context: string = LOGIN_CONTEXT_SESSION,
  ) {
    const data = await this._readFile();
    data.logins[`${context}:${name}`] = {
      value,
      timestamp: new Date().getTime(),
    };
    await this._writeFile(data);
  }

  async removeLogin(name: string, context: string = LOGIN_CONTEXT_SESSION) {
    const data = await this._readFile();
    delete data.logins[`${context}:${name}`];
    await this._writeFile(data);
  }

  async setLocker(name: string, entry: Locker) {
    const data = await this._readFile();
    data.lockers[name] = entry;
    await this._writeFile(data);
  }

  async getLocker(name: string): Promise<Locker | null> {
    const data = await this._readFile();
    return data.lockers[name];
  }

  async setRecovery(name: string, entry: RecoveryEntry) {
    const data = await this._readFile();
    data.recovery[name] = entry;
    await this._writeFile(data);
  }

  async getRecovery(name: string): Promise<RecoveryEntry | null> {
    const data = await this._readFile();
    return data.recovery[name];
  }

  async removeRecovery(name: string) {
    const data = await this._readFile();
    delete data.recovery[name];
    await this._writeFile(data);
  }

  async setSession(
    id: string,
    entry: SessionEntry,
    lifetimeInDays: number = 14,
  ) {
    const data = await this._readFile();
    const expiresAt =
      new Date().getTime() + lifetimeInDays * MILLISECONDS_PER_DAY;
    data.sessions[id] = { ...entry, expiresAt };
    await this._writeFile(data);
  }

  async getSession(id: string): Promise<SessionEntry | null> {
    const data = await this._readFile();
    const session = data.sessions[id];
    if (session == null) return null;
    const { expiresAt, ...sessionData } = session;
    if (expiresAt < new Date().getTime()) {
      await this.removeSession(id);
      return null;
    }
    return sessionData;
  }

  async removeSession(id: string) {
    const data = await this._readFile();
    delete data.sessions[id];
    await this._writeFile(data);
  }

  getRecoveryLogin(name: string): Promise<string | null> {
    return this.getLogin(name, LOGIN_CONTEXT_RECOVERY);
  }

  setRecoveryLogin(name: string, value: string): Promise<void> {
    return this.setLogin(name, value, LOGIN_CONTEXT_RECOVERY);
  }

  hasRecoveryLogin(name: string): Promise<boolean> {
    return this.hasLogin(name, LOGIN_CONTEXT_RECOVERY);
  }

  removeRecoveryLogin(name: string): Promise<void> {
    return this.removeLogin(name, LOGIN_CONTEXT_RECOVERY);
  }
}
