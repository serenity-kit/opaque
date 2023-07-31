import * as redis from "redis";
import { Datastore, LockerEntry, SessionEntry } from "./Datastore";
import isLockerObject from "../utils/isLockerObject";

export default class RedisStore implements Datastore {
  private readonly client: ReturnType<typeof redis.createClient>;
  constructor(url: string) {
    this.client = redis.createClient({ url });
  }

  onError(handler: (err: unknown) => void) {
    this.client.on("error", handler);
  }

  connect() {
    return this.client.connect();
  }

  async getUser(name: string) {
    return this.client.get(`user:${name}`);
  }

  async hasUser(name: string) {
    const user = await this.getUser(name);
    return user != null;
  }

  getLogin(name: string) {
    return this.client.get(`login:${name}`);
  }

  async hasLogin(name: string) {
    const login = await this.getLogin(name);
    return login != null;
  }

  async setUser(name: string, value: string) {
    await this.client.set(`user:${name}`, value);
  }

  async setLogin(name: string, value: string) {
    await this.client.set(`login:${name}`, value, { EX: 2 });
  }

  async removeLogin(name: string) {
    await this.client.del(`login:${name}`);
  }

  async getSession(id: string) {
    const { userIdentifier, sessionKey } = await this.client.hGetAll(
      `session:${id}`
    );
    if (!userIdentifier || !sessionKey) throw new TypeError();
    return { userIdentifier, sessionKey };
  }

  async setSession(id: string, session: SessionEntry) {
    await this.client.hSet(`session:${id}`, session);
  }

  async removeSession(id: string) {
    await this.client.del(`session:${id}`);
  }

  async setLocker(name: string, entry: LockerEntry) {
    await this.client.hSet(`locker:${name}`, entry);
  }

  async getLocker(name: string) {
    const entry = await this.client.hGetAll(`locker:${name}`);
    if (!isLockerObject(entry)) {
      // this should only happen if the entry doesn't exist
      // so we can just return null here instead of raising an error
      return null;
    }
    return entry;
  }
}
