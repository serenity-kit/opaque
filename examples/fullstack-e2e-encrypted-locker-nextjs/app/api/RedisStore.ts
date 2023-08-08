import * as redis from "redis";
import isLockerObject from "../utils/isLockerObject";
import isRecoveryLockboxObject from "../utils/isRecoveryLockboxObject";
import { Locker } from "../utils/locker";
import { Datastore, RecoveryEntry, SessionEntry } from "./Datastore";

const SECONDS_PER_DAY = 24 /*hours*/ * 60 /*minutes*/ * 60; /*seconds*/

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

  async setSession(
    id: string,
    session: SessionEntry,
    lifetimeInDays: number = 14
  ) {
    const expireInSeconds = lifetimeInDays * SECONDS_PER_DAY;
    await this.client.hSet(`session:${id}`, /** @type {any} */ session);
    await this.client.expire(`session:${id}`, expireInSeconds);
  }

  async removeSession(id: string) {
    await this.client.del(`session:${id}`);
  }

  async setLocker(name: string, entry: Locker) {
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

  async setRecovery(name: string, entry: RecoveryEntry) {
    await this.client.hSet(`recovery:${name}`, entry.recoveryLockbox);
    await this.client.set(
      `recovery:registration:${name}`,
      entry.registrationRecord
    );
  }

  async getRecovery(name: string) {
    const recoveryLockbox = await this.client.hGetAll(`recovery:${name}`);
    if (!isRecoveryLockboxObject(recoveryLockbox)) {
      // this should only happen if the entry doesn't exist
      // so we can just return null here instead of raising an error
      return null;
    }
    const registrationRecord = await this.client.get(
      `recovery:registration:${name}`
    );
    if (registrationRecord == null) {
      return null;
    }
    return { recoveryLockbox, registrationRecord };
  }

  async removeRecovery(name: string) {
    await this.client.del(`recovery:${name}`);
    await this.client.del(`recovery:registration:${name}`);
  }

  getRecoveryLogin(name: string) {
    return this.client.get(`recovery:login:${name}`);
  }

  async hasRecoveryLogin(name: string) {
    const login = await this.getRecoveryLogin(name);
    return login != null;
  }

  async setRecoveryLogin(name: string, value: string) {
    await this.client.set(`recovery:login:${name}`, value, { EX: 2 });
  }

  async removeRecoveryLogin(name: string) {
    await this.client.del(`recovery:login:${name}`);
  }
}
