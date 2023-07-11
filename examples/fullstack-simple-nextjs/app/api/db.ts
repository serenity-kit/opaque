import * as opaque from "@serenity-kit/opaque";
import { readFile, writeFile } from "fs/promises";

type LoginState = { value: string; timestamp: number };

class Database {
  constructor(
    private serverSetup: string,
    private users: Record<string, string> = {},
    private logins: Record<string, LoginState> = {},
    private listeners: (() => Promise<void>)[] = []
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
  getServerSetup() {
    return this.serverSetup;
  }
}

async function readDatabaseFile(filePath: string) {
  const json = await readFile(filePath, "utf-8");
  const data = JSON.parse(json);
  const db = new Database(data.serverSetup, data.users, data.logins);
  return db;
}

function writeDatabaseFile(filePath: string, db: Database) {
  const data = db.stringify();
  return writeFile(filePath, data);
}

const SERVER_SETUP = process.env.OPAQUE_SERVER_SETUP;
if (!SERVER_SETUP) {
  throw new Error("OPAQUE_SERVER_SETUP env variable value is missing");
}

const db = opaque.ready.then(async () => {
  console.log("initializing db");
  const file = "data.json";
  const db = await readDatabaseFile(file).catch((err) => {
    if ("code" in err && err.code == "ENOENT") {
      console.log("No database file found, initializing empty database.");
    } else {
      console.error(
        "ERROR: failed to read database file, initializing empty database."
      );
      console.error(err);
    }
    return Database.empty(SERVER_SETUP);
  });
  db.addListener(() => writeDatabaseFile(file, db));
  return db;
});

export default db;
