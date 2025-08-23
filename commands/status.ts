import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { hashObject } from "../helpers/hashObject";
import { LINE_LEN, MODE_LEN, PATH_LEN } from "../types/constants";

interface IndexEntry {
  mode: string;
  path: string;
  hash: string;
}

function loadIndex(): IndexEntry[] {
  const indexPath = "./.wise/index";
  if (!existsSync(indexPath)) return [];
  const buf = readFileSync(indexPath);
  const entries: IndexEntry[] = [];
  const numLines = Math.floor(buf.length / LINE_LEN);

  for (let i = 0; i < numLines; i++) {
    const offset = i * LINE_LEN;
    const line = buf.subarray(offset, offset + LINE_LEN).toString("utf8");
    const mode = line.slice(0, MODE_LEN).trim();
    const path = line.slice(MODE_LEN + 1, MODE_LEN + 1 + PATH_LEN).trim();
    const hash = line.slice(MODE_LEN + 1 + PATH_LEN).trim();
    entries.push({ mode, path, hash });
  }
  return entries;
}

function walkDir(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    if (filePath.startsWith(".wise")) continue; // skip repo internals
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (stats.isFile()) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

export function status() {
  const index = loadIndex();
  const staged = new Map(index.map(e => [e.path, e.hash]));
  const workingFiles = walkDir(".");

  const modified: string[] = [];
  const untracked: string[] = [];
  const stagedFiles: string[] = Array.from(staged.keys());

  for (const file of workingFiles) {
    const content = readFileSync(file);
    const hash = hashObject("blob", content);

    if (!staged.has(file)) {
      untracked.push(file);
    } else if (staged.get(file) !== hash) {
      modified.push(file);
    }
  }

  if (stagedFiles.length) {
    console.log("Changes to be committed:");
    stagedFiles.forEach(f => console.log("  " + f));
  }
  if (modified.length) {
    console.log("Changes not staged for commit:");
    modified.forEach(f => console.log("  " + f));
  }
  if (untracked.length) {
    console.log("Untracked files:");
    untracked.forEach(f => console.log("  " + f));
  }

  if (!stagedFiles.length && !modified.length && !untracked.length) {
    console.log("nothing to commit, working tree clean");
  }
}
