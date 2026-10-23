const fs = require("fs");
const path = require("path");

// `changeset version` writes one changelog per published package. Both packages
// are always released in lockstep with identical entries, so the ristretto one
// is mirrored to the repository root as the human facing changelog.

const HEADER = `# Changelog

All notable changes to \`@serenity-kit/opaque\` and \`@serenity-kit/opaque-p256\`.
Both packages are released together and share the same version and entries.
`;

function main() {
  const baseDir = path.join(__dirname, "..");
  const source = path.join(baseDir, "build", "ristretto", "CHANGELOG.md");

  if (!fs.existsSync(source)) {
    console.log(
      "no build/ristretto/CHANGELOG.md found, skipping changelog sync",
    );
    return;
  }

  const changelog = fs.readFileSync(source, "utf8");

  // drop the leading `# @serenity-kit/opaque` heading, keep the version sections
  const body = changelog.replace(/^#\s+@serenity-kit\/opaque\s*\n/, "");

  console.log("writing CHANGELOG.md");

  fs.writeFileSync(path.join(baseDir, "CHANGELOG.md"), `${HEADER}\n${body}`);
}

main();
