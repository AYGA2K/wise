import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { hashObject } from "../helpers/hashObject";

export function add(filePath: string) {
	const INDEX_PATH = resolve(".wise", "index");
	// File mode "100644" means a normal non-executable file
	const mode = "100644";

	const fileContent = readFileSync(filePath);
	const hash = hashObject("blob", fileContent);

	const entry = `${mode}|${filePath}|${hash}\n`;

	if (!existsSync(INDEX_PATH)) {
		writeFileSync(INDEX_PATH, entry);
		return;
	}
	// Read existing index content and split into lines
	const content = readFileSync(INDEX_PATH, "utf8");
	const lines = content.split("\n");

	let found = false;

	// Update entry if file already exists in index
	const newLines = lines.map((line) => {
		const [existingMode, existingPath, existingHash] = line.split("|");
		if (existingPath === filePath) {
			found = true;
			return entry; // replace old line
		}
		return line; // keep unchanged line
	});

	// If file was not found in index, add it as new
	if (!found) {
		newLines.push(entry);
	}

	// Write updated index back to disk
	writeFileSync(INDEX_PATH, newLines.join(""));
}
