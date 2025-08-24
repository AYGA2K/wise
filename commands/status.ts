import { createHash } from "crypto";
import { existsSync, readdirSync, readFileSync } from "fs";
import { relative, resolve, sep } from "path";

interface IndexEntry {
	mode: string;
	path: string;
	hash: string;
}

export function status() {
	const rootDir = resolve(".");
	const index = loadIndex();

	const staged = new Map(index.map((e) => [e.path, e.hash]));
	const workingFiles = walkDir(rootDir).map((file) =>
		relative(rootDir, file).split(sep).join("/"),
	);

	const modified: string[] = [];
	const untracked: string[] = [];
	const deleted: string[] = [];
	const stagedFiles = Array.from(staged.keys());

	// Check for modified and deleted files
	for (const [filePath, stagedHash] of staged) {
		const absolutePath = resolve(rootDir, filePath);

		if (!existsSync(absolutePath)) {
			deleted.push(filePath);
			continue;
		}

		try {
			const content = readFileSync(absolutePath);
			const workingHash = createHash("sha1")
				.update(`blob ${content.length}\0${content}`)
				.digest("hex");

			if (stagedHash !== workingHash) {
				modified.push(filePath);
			}
		} catch (err) {
			console.error(`Error reading ${filePath}:`, err);
		}
	}

	// Check for untracked files
	for (const filePath of workingFiles) {
		if (!staged.has(filePath)) {
			untracked.push(filePath);
		}
	}

	const outputSections: string[] = [];

	// Staged changes (to be committed)
	const stagedOnly = stagedFiles.filter(
		(f) => !modified.includes(f) && !deleted.includes(f),
	);
	if (stagedOnly.length > 0) {
		let stagedOutput = "Changes to be committed:\n";
		stagedOnly.forEach((f) => (stagedOutput += `  modified:   ${f}\n`));
		outputSections.push(stagedOutput);
	}

	// Unstaged changes
	if (modified.length > 0 || deleted.length > 0) {
		let unstagedOutput = "Changes not staged for commit:\n";
		modified.forEach((f) => (unstagedOutput += `  modified:   ${f}\n`));
		deleted.forEach((f) => (unstagedOutput += `  deleted:    ${f}\n`));
		outputSections.push(unstagedOutput);
	}

	// Untracked files
	if (untracked.length > 0) {
		let untrackedOutput = "Untracked files:\n";
		untracked.forEach((f) => (untrackedOutput += `  ${f}\n`));
		outputSections.push(untrackedOutput);
	}

	// Print all sections
	if (outputSections.length > 0) {
		console.log(outputSections.join("\n"));
	} else {
		console.log("nothing to commit, working tree clean");
	}
}

function loadIndex(): IndexEntry[] {
	const indexPath = resolve(".wise", "index");
	if (!existsSync(indexPath)) return [];

	const content = readFileSync(indexPath, "utf8");
	const lines = content.split("\n").filter((line) => line.trim());

	const entries: IndexEntry[] = [];

	for (const line of lines) {
		const parts = line.split("|");
		if (parts.length >= 3) {
			const mode = parts[0]?.trim();
			const path = parts[1]?.trim();
			const hash = parts[2]?.trim();
			if (mode && path && hash) {
				entries.push({ mode, path, hash });
			}
		}
	}

	return entries;
}

function walkDir(dir: string, fileList: string[] = []): string[] {
	const files = readdirSync(dir, { withFileTypes: true });

	for (const file of files) {
		// Skip hidden files and directories
		if (file.name.startsWith(".")) {
			continue;
		}

		const filePath = resolve(dir, file.name);

		if (file.isDirectory()) {
			// NOTE: This should not be hardcoded but I did not
			// implement an 'ignore files' logic
			if (file.name === "node_modules" || file.name === "dist") {
				continue;
			}
			walkDir(filePath, fileList);
		} else if (file.isFile()) {
			fileList.push(filePath);
		}
	}
	return fileList;
}
