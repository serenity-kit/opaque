const fs = require("fs");
const path = require("path");

// Packages in a `fixed` group are always bumped together, but `changeset
// version` only writes a changelog entry for the packages a changeset names.
// A changeset naming just one of them would leave the others with an empty
// version section and an empty Github release. Add the missing packages to
// every pending changeset, using the highest bump type of the group, before
// `changeset version` runs.

const BUMP_TYPES = ["none", "patch", "minor", "major"];

function main() {
  const changesetDir = path.join(__dirname, "..", ".changeset");
  const config = JSON.parse(
    fs.readFileSync(path.join(changesetDir, "config.json"), "utf8"),
  );
  const fixedGroups = config.fixed || [];

  const files = fs
    .readdirSync(changesetDir)
    .filter((file) => file.endsWith(".md") && file !== "README.md");

  files.forEach((file) => {
    const filePath = path.join(changesetDir, file);
    const content = fs.readFileSync(filePath, "utf8");
    const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) return;

    // frontmatter lines look like `"@serenity-kit/opaque": patch`
    const releases = new Map();
    frontmatter[1].split(/\r?\n/).forEach((line) => {
      const release = line.match(/^\s*["']?([^"':]+)["']?\s*:\s*(\w+)\s*$/);
      if (release) releases.set(release[1], release[2]);
    });

    const missing = [];
    fixedGroups.forEach((group) => {
      const highest = Math.max(
        ...group.map((name) => BUMP_TYPES.indexOf(releases.get(name))),
      );
      // the changeset doesn't release any package of this group
      if (highest <= 0) return;

      group
        .filter((name) => !releases.has(name))
        .forEach((name) => missing.push(`"${name}": ${BUMP_TYPES[highest]}`));
    });

    if (missing.length === 0) return;

    console.log(`adding ${missing.join(", ")} to .changeset/${file}`);

    // insert the missing releases right before the closing `---`
    const end = frontmatter.index + frontmatter[0].lastIndexOf("---");
    fs.writeFileSync(
      filePath,
      `${content.slice(0, end)}${missing.join("\n")}\n${content.slice(end)}`,
    );
  });
}

main();
