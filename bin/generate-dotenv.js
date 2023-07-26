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

  if (fileExists(envFile)) {
    console.log("opaque .env file already exists, skipping .env write");
    return;
  }

  await opaque.ready;
  const serverSetup = opaque.server.createSetup();

  const dotEnv = `OPAQUE_SERVER_SETUP=${serverSetup}\n`;

  console.log("writing opaque .env file");

  fs.writeFileSync(envFile, dotEnv);
}

main();
