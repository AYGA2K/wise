import { writeFileSync, readFileSync } from "fs";
import { hashObject } from "../helpers/hashObject";
import { writeTree } from "../helpers/writeTree";
import { getConfig } from "./config";

export function commit(message: string, branch: string = "main") {
  const treeSHA = writeTree();

  let parent = "";
  try {
    const headRef = readFileSync(".git/refs/heads/" + branch, "utf8").trim();
    if (headRef) parent = headRef;
  } catch {
    parent = "";
  }

  const name = getConfig("user.name");
  const email = getConfig("user.email");

  if (!name || !email) {
    throw new Error(
      "Error: user.name and user.email must be set using `config` before committing.\n" +
      "Example:\n  config user.name \"Your Name\"\n  config user.email \"you@example.com\""
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const author = `${name} <${email}> ${timestamp} +0000`;

  // Build commit content
  let content = `tree ${treeSHA}\n`;
  if (parent !== "") {
    content += `parent ${parent}\n`;
  }
  content += `author ${author}\n`;
  content += `committer ${author}\n\n`;
  content += `${message}\n`;

  const commitSHA = hashObject("commit", Buffer.from(content));

  // Update branch ref
  writeFileSync(".git/refs/heads/" + branch, commitSHA + "\n");

  return commitSHA;
}
