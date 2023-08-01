import * as redis from "redis";
import { Datastore } from "./Datastore";

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
}
