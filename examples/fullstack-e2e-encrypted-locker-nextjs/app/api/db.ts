import * as opaque from "@serenity-kit/opaque";
import { Datastore } from "./Datastore";
import InMemoryStore, {
  readDatabaseFile,
  writeDatabaseFile,
} from "./InMemoryStore";
import RedisStore from "./RedisStore";
import { REDIS_URL, ENABLE_REDIS, DB_FILE } from "./env";

async function setupInMemoryStore(): Promise<Datastore> {
  const file = DB_FILE;
  console.log(`initializing InMemoryStore with file "${file}"`);
  const db = await readDatabaseFile(file).catch((err) => {
    if ("code" in err && err.code == "ENOENT") {
      console.log(
        `No database file "${file}" found, initializing with empty store.`
      );
    } else {
      console.error(
        `ERROR: failed to read database file "${file}", initializing with empty store.`
      );
      console.error(err);
    }
    return InMemoryStore.empty();
  });
  db.addListener(() => {
    console.debug(`writing InMemoryStore data to file "${file}"`);
    return writeDatabaseFile(file, db);
  });
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
      err instanceof Error ? err.message : err
    );
    process.exit(1);
  }
}

const db = opaque.ready.then(() => {
  if (ENABLE_REDIS) {
    return setupRedis();
  } else {
    return setupInMemoryStore();
  }
});

export default db;
