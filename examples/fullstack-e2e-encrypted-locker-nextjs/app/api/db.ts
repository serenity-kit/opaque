import * as opaque from "@serenity-kit/opaque";
import { readFile, writeFile } from "fs/promises";

type LoginState = { value: string; timestamp: number };

type SessionEntry = { userIdentifier: string; sessionKey: string };

type LockerEntry = {
  ciphertext: string;
  nonce: string;
};

class Database {
  constructor(
    private serverSetup: string,
    private users: Record<string, string> = {},
    private logins: Record<string, LoginState> = {},
    private lockers: Record<string, LockerEntry> = {},
    private sessions: Record<string, SessionEntry> = {},
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
    return new Database(serverSetup);
  }
  stringify() {
    return JSON.stringify(
      {
        serverSetup: this.serverSetup,
        logins: this.logins,
        users: this.users,
        sessions: this.sessions,
        lockers: this.lockers,
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
  async setLocker(name: string, entry: LockerEntry) {
    this.lockers[name] = entry;
    await this._notifyListeners();
  }
  async getLocker(name: string): Promise<LockerEntry | null> {
    return this.lockers[name];
  }
  getServerSetup() {
    return this.serverSetup;
  }
  async setSession(id: string, entry: SessionEntry) {
    this.sessions[id] = entry;
    this._notifyListeners();
  }
  async getSession(id: string): Promise<SessionEntry | null> {
    return this.sessions[id];
  }
  async removeSession(id: string) {
    delete this.sessions[id];
    this._notifyListeners();
  }
}

async function readDatabaseFile(filePath: string) {
  const json = await readFile(filePath, "utf-8");
  const data = JSON.parse(json);
  const db = new Database(
    data.serverSetup,
    data.users,
    data.logins,
    data.lockers ?? {},
    data.sessions ?? {}
  );
  return db;
}

function writeDatabaseFile(filePath: string, db: Database) {
  const data = db.stringify();
  return writeFile(filePath, data);
}

const SERVER_SETUP =
  "Ki5T3U21n_UFhcGP5fR_mUstYEItKRsjEJ2UnvvrGasT3wvjdtbluS0BsiR_LtzqX8YLrCyWqQOJDf7cL0C8DRr9pGFBSx0X22ZujePyWpdq4VddBSPm0vIXepDJEBYJjRxmRNh09pLGxk_Y9bQuFWjYInqjcy_zOVsMHPHUkQw";

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
