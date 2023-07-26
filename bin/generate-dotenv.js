const fs = require("fs");
const path = require("path");
const opaque = require("../build/ristretto");

function fileExists(file) {
  try {
    fs.accessSync(file, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

async function main() {
  const baseDir = path.join(__dirname, "..");
  const envFile = path.join(baseDir, ".env");

  if (fileExists(envFile) && !process.argv.includes("--force")) {
    console.log("opaque .env file already exists, skipping .env write");
    return;
  }

  await opaque.ready;
  const serverSetup = opaque.server.createSetup();

  const dotEnv = `
# the opaque server setup (private server key)
OPAQUE_SERVER_SETUP=${serverSetup}

# disable filesystem persistence for in-memory db
# DISABLE_FS=true

# use redis database
# ENABLE_REDIS=true

# use a custom redis url
# REDIS_URL=redis://192.168.0.1:6379
`;

  console.log("writing opaque .env file");

  fs.writeFileSync(envFile, dotEnv);
}

main();
