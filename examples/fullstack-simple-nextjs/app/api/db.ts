import * as opaque from "@serenity-kit/opaque";
import { Datastore } from "./Datastore";
import InMemoryStore, {
  readDatabaseFile,
  writeDatabaseFile,
} from "./InMemoryStore";
import RedisStore from "./RedisStore";
import { REDIS_URL, ENABLE_REDIS } from "./env";

async function setupInMemoryStore(): Promise<Datastore> {
  console.log("initializing InMemoryStore");
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
    return InMemoryStore.empty();
  });
  db.addListener(() => writeDatabaseFile(file, db));
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
