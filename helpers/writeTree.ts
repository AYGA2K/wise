import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { createHash } from "crypto";
import { deflateSync } from "zlib";
import { resolve } from "path";
import { TreeEntryTypes, type TreeEntry } from "../types/treeEntry";
import { HASH_LEN, LINE_LEN, MODE_LEN, PATH_LEN } from "../types/constants";

function parseIndex(): { mode: string; path: string; hash: Buffer }[] {
  const indexPath = resolve(".wise", "index"); // absolute path
  if (!existsSync(indexPath)) return [];

  const data = readFileSync(indexPath, "utf8");
  const lines = data.match(new RegExp(`.{1,${LINE_LEN}}`, "g")) || [];

  return lines.map(line => {
    const mode = line.slice(0, MODE_LEN).trim();
    const path = line.slice(MODE_LEN + 1, MODE_LEN + 1 + PATH_LEN).trim();
    const hashHex = line.slice(MODE_LEN + 1 + PATH_LEN + 1, MODE_LEN + 1 + PATH_LEN + 1 + HASH_LEN);
    return { mode, path, hash: Buffer.from(hashHex, "hex") };
  });
}

// Recursive function to build trees
function buildTree(entries: { mode: string; path: string; hash: Buffer }[], basePath = ""): string {
  const treeEntries: TreeEntry[] = [];
  const dirs: Record<string, { mode: string; path: string; hash: Buffer }[]> = {};

  for (const entry of entries) {
    if (!entry.path.startsWith(basePath)) continue;
    const relativePath = entry.path.slice(basePath.length);
    const parts = relativePath.split("/").filter(Boolean);

    if (parts.length === 1) {
      // File at this level
      treeEntries.push({
        name: parts[0] || "",
        mode: entry.mode,
        hash: entry.hash,
        type: TreeEntryTypes.BLOB
      });
    } else {
      // Subdirectory
      const dirName = parts[0];
      if (dirName) {
        dirs[dirName] = dirs[dirName] || [];
        dirs[dirName].push(entry);
      }
    }
  }

  // Recursively build subtrees
  for (const dirName of Object.keys(dirs)) {
    const subtreeHash = Buffer.from(buildTree(dirs[dirName]!, basePath + dirName + "/"), "hex");
    treeEntries.push({
      name: dirName,
      mode: "40000", // Directory (tree object)
      hash: subtreeHash,
      type: TreeEntryTypes.TREE
    });
  }

  // Sort entries by name
  treeEntries.sort((a, b) => a.name.localeCompare(b.name));

  // Serialize tree
  const entriesBuffers: Buffer[] = [];
  for (const entry of treeEntries) {
    const header = Buffer.from(`${entry.mode} ${entry.name}\0`, "utf8");
    entriesBuffers.push(Buffer.concat([header, entry.hash]));
  }
  const entriesBuffer = Buffer.concat(entriesBuffers);
  const header = Buffer.from(`tree ${entriesBuffer.length}\0`, "utf8");
  const content = Buffer.concat([header, entriesBuffer]);

  // Compute SHA1 and store object
  const hashHex = createHash("sha1").update(content).digest("hex");
  const dir = hashHex.substring(0, 2);
  const fileName = hashHex.substring(2);
  const objectsDir = resolve(".wise", "objects", dir); // absolute path
  mkdirSync(objectsDir, { recursive: true });
  const objectPath = resolve(objectsDir, fileName); // absolute path
  const compressed = deflateSync(content);
  writeFileSync(objectPath, compressed);

  return hashHex;
}

export function writeTree(): string {
  const entries = parseIndex();
  return buildTree(entries);
}
