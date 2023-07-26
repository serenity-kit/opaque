import * as redis from "redis";

/**
 * @implements Datastore
 */
export default class RedisStore {
  /**
   * @param {string} url
   */
  constructor(url) {
    this.client = redis.createClient({ url });
  }

  /**
   * @param {(err: unknown) => void} handler
   */
  onError(handler) {
    this.client.on("error", handler);
  }

  connect() {
    return this.client.connect();
  }

  /**
   * @param {string} name
   */
  async getUser(name) {
    return this.client.get(`user:${name}`);
  }

  /**
   * @param {string} name
   */
  async hasUser(name) {
    const user = await this.getUser(name);
    return user != null;
  }

  /**
   * @param {string} name
   */
  getLogin(name) {
    return this.client.get(`login:${name}`);
  }

  /**
   * @param {string} name
   */
  async hasLogin(name) {
    const login = await this.getLogin(name);
    return login != null;
  }

  /**
   * @param {string} name
   * @param {string} value
   */
  async setUser(name, value) {
    await this.client.set(`user:${name}`, value);
  }

  /**
   * @param {string} name
   * @param {string} value
   */
  async setLogin(name, value) {
    await this.client.set(`login:${name}`, value, { EX: 2 });
  }

  /**
   * @param {string} name
   */
  async removeLogin(name) {
    await this.client.del(`login:${name}`);
  }
}
