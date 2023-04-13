import { readFileSync } from "fs";
import { writeFile } from "fs/promises";

export default class Database {
  constructor(filePath, serverSetup, users, logins) {
    this.filePath = filePath;
    this.serverSetup = serverSetup;
    this.users = users;
    this.logins = logins;
  }
  static open(filePath) {
    const json = readFileSync("./data.json", "utf-8");
    const data = JSON.parse(json);
    const db = new Database(
      filePath,
      data.serverSetup,
      data.users,
      data.logins
    );
    return db;
  }
  static create(filePath, serverSetup) {
    return new Database(filePath, serverSetup, {}, {});
  }
  writeFile() {
    const data = JSON.stringify(
      {
        serverSetup: this.serverSetup,
        logins: this.logins,
        users: this.users,
      },
      null,
      2
    );
    return writeFile(this.filePath, data);
  }
  getUser(name) {
    return this.users[name];
  }
  hasUser(name) {
    return this.users[name] != null;
  }
  getLogin(name) {
    return this.logins[name];
  }
  hasLogin(name) {
    return this.logins[name];
  }
  setUser(name, value) {
    this.users[name] = value;
    this.writeFile();
  }
  setLogin(name, value) {
    this.logins[name] = value;
    this.writeFile();
  }
  removeLogin(name) {
    delete this.logins[name];
    this.writeFile();
  }
}
