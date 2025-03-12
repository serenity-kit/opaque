import * as opaque from "@serenity-kit/opaque";
import { Datastore } from "./Datastore";
import { ENABLE_REDIS, REDIS_URL } from "./env";
import FileStore from "./FileStore";
import RedisStore from "./RedisStore";

async function setupFileStore(): Promise<Datastore> {
  const file = "data.json";
  console.log(`initializing FileStore with file "${file}"`);
  const db = new FileStore(file);
  return db;
}

async function setupRedis(): Promise<Datastore> {
  try {
    const redis = new RedisStore(REDIS_URL);
    redis.onError((err) => {
      console.error("Redis Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    });
    await redis.connect();
    console.log("connected to redis at", REDIS_URL);
    return redis;
  } catch (err) {
    console.error(
      "Redis Setup Error:",
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  }
}

const db = opaque.ready.then(() => {
  if (ENABLE_REDIS) {
    return setupRedis();
  } else {
    return setupFileStore();
  }
});

export default db;
