import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { hashObject } from "../helpers/hashObject";

export function add(filePath: string) {
	const INDEX_PATH = resolve(".wise", "index");
	const mode = "100644";

	const fileContent = readFileSync(filePath);
	const hash = hashObject("blob", fileContent);

	const entry = `${mode}|${filePath}|${hash}\n`;

	if (!existsSync(INDEX_PATH)) {
		writeFileSync(INDEX_PATH, entry);
		return;
	}

	const content = readFileSync(INDEX_PATH, "utf8");
	const lines = content.split("\n").filter((line) => line.trim());

	let found = false;
	const newLines = lines.map((line) => {
		const [existingMode, existingPath, existingHash] = line.split("|");
		if (existingPath === filePath) {
			found = true;
			return entry.trim(); // Replace with new entry
		}
		return line;
	});

	if (!found) {
		newLines.push(entry.trim());
	}

	writeFileSync(INDEX_PATH, newLines.join("\n") + "\n");
}
