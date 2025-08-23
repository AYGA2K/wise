import { createHash } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import { deflateSync } from "zlib";

export function hashObject(type: "blob" | "tree" | "commit", content: Buffer): string {
  const header = `${type} ${content.length}\0`;
  const full = Buffer.concat([Buffer.from(header), content]);
  const hash = createHash("sha1").update(full).digest("hex");

  const dir = `.wise/objects/${hash.slice(0, 2)}`;
  mkdirSync(dir, { recursive: true });

  const compressed = deflateSync(full);
  writeFileSync(`${dir}/${hash.slice(2)}`, compressed);

  return hash;
}
