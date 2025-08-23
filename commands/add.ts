import { openSync, readFileSync, writeSync, appendFileSync, existsSync, fstatSync, closeSync } from "fs";
import { resolve } from "path";
import { hashObject } from "../helpers/hashObject";
import { LINE_LEN, MODE_LEN, PATH_LEN } from "../types/constants";

function padRight(str: string, length: number): string {
  if (str.length > length) return str.slice(0, length);
  return str + " ".repeat(length - str.length);
}

export function add(filePath: string) {
  // Absolute path
  const INDEX_PATH = resolve(".wise", "index");
  const mode = "100644"; // Normal file, read/write for owner, read-only for others

  // Read file contents and hash as a blob
  const fileContent = readFileSync(filePath);
  const hash = hashObject("blob", fileContent);

  const paddedMode = padRight(mode, MODE_LEN);
  const paddedPath = padRight(filePath, PATH_LEN);
  const paddedLine = `${paddedMode} ${paddedPath} ${hash}\n`;

  if (!existsSync(INDEX_PATH)) {
    appendFileSync(INDEX_PATH, paddedLine);
    return;
  }

  const fd = openSync(INDEX_PATH, "r+");
  const stats = fstatSync(fd);
  const fileSize = stats.size;
  const buffer = Buffer.alloc(fileSize);
  readFileSync(INDEX_PATH).copy(buffer, 0, 0, fileSize);

  const numLines = Math.floor(fileSize / LINE_LEN);
  let found = false;

  for (let i = 0; i < numLines; i++) {
    const offset = i * LINE_LEN;
    const lineBuf = buffer.subarray(offset, offset + LINE_LEN);
    const pathInLine = lineBuf.toString("utf8", MODE_LEN + 1, MODE_LEN + 1 + PATH_LEN).trim();

    if (pathInLine === filePath) {
      found = true;
      break;
    }
    writeSync(fd, paddedLine, offset, "utf8");
  }

  if (!found) {
    appendFileSync(INDEX_PATH, paddedLine);
  }

  closeSync(fd);
}
