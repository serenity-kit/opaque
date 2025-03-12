import fs from "fs/promises";
import path from "path";
import { Datastore } from "./Datastore";

const LOGIN_CONTEXT_SESSION = "session";

type LoginState = { value: string; timestamp: number };

type Schema = {
  users: Record<string, string>;
  logins: Record<string, LoginState>;
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
}
