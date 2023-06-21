export default class Database {
  /**
   * @constructor
   * @param {string} serverSetup
   * @param {Record<string, string>} users
   * @param {Record<string, {value: string; timestamp: number}>} logins
   */
  constructor(serverSetup, users, logins) {
    this.serverSetup = serverSetup;
    this.users = users;
    this.logins = logins;
  }

  /**
   * @param {string} serverSetup
   */
  static empty(serverSetup) {
    return new Database(serverSetup, {}, {});
  }

  /**
   * @param {string} name
   */
  getUser(name) {
    return this.users[name];
  }

  /**
   * @param {string} name
   */
  hasUser(name) {
    return this.users[name] != null;
  }

  /**
   * @param {string} name
   */
  getLogin(name) {
    return this.hasLogin(name) ? this.logins[name].value : null;
  }

  /**
   * @param {string} name
   */
  hasLogin(name) {
    const login = this.logins[name];
    if (login == null) return null;
    const now = new Date().getTime();
    const elapsed = now - login.timestamp;
    return elapsed < 2000;
  }
  /**
   * @param {string} name
   * @param {string} value
   */
  setUser(name, value) {
    this.users[name] = value;
  }

  /**
   * @param {string} name
   * @param {string} value
   */
  setLogin(name, value) {
    this.logins[name] = { value, timestamp: new Date().getTime() };
  }

  /**
   * @param {string} name
   */
  removeLogin(name) {
    delete this.logins[name];
  }
}
