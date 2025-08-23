import { createHash } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import { deflateSync } from "zlib";
import { resolve } from "path";

export function hashObject(type: "blob" | "tree" | "commit", content: Buffer): string {
  const header = `${type} ${content.length}\0`;
  const full = Buffer.concat([Buffer.from(header), content]);
  const hash = createHash("sha1").update(full).digest("hex");

  const objectsDir = resolve(".wise", "objects", hash.slice(0, 2)); // absolute path
  mkdirSync(objectsDir, { recursive: true });

  const objectPath = resolve(objectsDir, hash.slice(2)); // absolute path
  const compressed = deflateSync(full);
  writeFileSync(objectPath, compressed);

  return hash;
}
