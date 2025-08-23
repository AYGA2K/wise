import fs from "fs";
import { resolve } from "path";

export function init() {
  const WISE_DIR = resolve(".wise");
  const OBJECTS_DIR = resolve(WISE_DIR, "objects");
  const REFS_HEADS_DIR = resolve(WISE_DIR, "refs", "heads");
  const HEAD_FILE = resolve(WISE_DIR, "HEAD");

  fs.mkdirSync(OBJECTS_DIR, { recursive: true });
  fs.mkdirSync(REFS_HEADS_DIR, { recursive: true });
  fs.writeFileSync(HEAD_FILE, "ref: refs/heads/main\n", "utf8");

  console.log("Initialized wise directory");
}
