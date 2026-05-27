import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, sep } from "node:path";
import { argv, exit } from "node:process";

const root = process.cwd();
const files = [
  ...collectFiles("src/app"),
  ...collectFiles("src/components"),
];
const forbidden = [
  /from\s+["']@\/lib\/prisma["']/,
  /from\s+["']@\/infrastructure\//,
  /from\s+["']@prisma\/client["']/,
  /from\s+["']@supabase\/supabase-js["']/,
  /from\s+["']@\/lib\/auth-server["']/,
];
const scopedForbidden = [
  {
    dir: "src/app/api/",
    patterns: [
      /from\s+["']@\/lib\/enka["']/,
      /from\s+["']@\/lib\/genshin["']/,
    ],
  },
];

let failed = false;

for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(source)) {
      console.error(`Architecture violation: ${relative(root, file).split(sep).join("/")}`);
      console.error(`  matches ${pattern}`);
      failed = true;
    }
  }
  const normalizedFile = file.split("\\").join("/");
  for (const rule of scopedForbidden) {
    if (!normalizedFile.startsWith(rule.dir)) continue;
    for (const pattern of rule.patterns) {
      if (pattern.test(source)) {
        console.error(`Architecture violation: ${relative(root, file).split(sep).join("/")}`);
        console.error(`  matches ${pattern}`);
        failed = true;
      }
    }
  }
}

if (failed) {
  exit(1);
}

if (argv.includes("--verbose")) {
  console.log(`Architecture check passed for ${files.length} files.`);
}

function collectFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const path = `${dir}/${entry}`;
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...collectFiles(path));
    } else if (path.endsWith(".ts") || path.endsWith(".tsx")) {
      files.push(path);
    }
  }

  return files;
}
