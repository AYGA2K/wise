import { openSync, readFileSync, writeSync, appendFileSync, existsSync, fstatSync, closeSync } from "fs";
import { hashObject } from "../helpers/hashObject";
import { LINE_LEN, MODE_LEN, PATH_LEN } from "../types/constants";

function padRight(str: string, length: number): string {
  if (str.length > length) return str.slice(0, length);
  return str + " ".repeat(length - str.length);
}

export function add(filePath: string) {
  const indexPath = "./.wise/index";
  const mode = "100644";

  //Read file contents and hash as a blob
  const fileContent = readFileSync(filePath);
  const hash = hashObject("blob", fileContent);

  const paddedMode = padRight(mode, MODE_LEN);
  const paddedPath = padRight(filePath, PATH_LEN);
  const paddedLine = `${paddedMode} ${paddedPath} ${hash}\n`;

  if (!existsSync(indexPath)) {
    appendFileSync(indexPath, paddedLine);
    return;
  }

  const fd = openSync(indexPath, "r+");
  const stats = fstatSync(fd);
  const fileSize = stats.size;
  const buffer = Buffer.alloc(fileSize);
  readFileSync(indexPath).copy(buffer, 0, 0, fileSize);

  const numLines = Math.floor(fileSize / LINE_LEN);
  let found = false;

  for (let i = 0; i < numLines; i++) {
    const offset = i * LINE_LEN;
    const lineBuf = buffer.subarray(offset, offset + LINE_LEN);
    const pathInLine = lineBuf.toString("utf8", MODE_LEN + 1, MODE_LEN + 1 + PATH_LEN).trim();

    if (pathInLine === filePath) {
      // Overwrite in-place with new hash if file changed
      found = true;
      break;
    }
    writeSync(fd, paddedLine, offset, "utf8");
  }

  if (!found) {
    appendFileSync(indexPath, paddedLine);
  }

  closeSync(fd);
}

