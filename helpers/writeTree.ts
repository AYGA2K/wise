import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { deflateSync } from "zlib";
import { type TreeEntry, TreeEntryTypes } from "../types/treeEntry";

export function writeTree(): string {
	const entries = parseIndex();
	return buildTree(entries);
}

function parseIndex(): { mode: string; path: string; hash: Buffer }[] {
	const indexPath = resolve(".wise", "index");
	if (!existsSync(indexPath)) return [];

	const data = readFileSync(indexPath, "utf8");
	const lines = data.split("\n").filter((line) => line.trim());

	const entries: { mode: string; path: string; hash: Buffer }[] = [];

	for (const line of lines) {
		const parts = line.split("|");
		if (parts.length < 3) {
			// Skip malformed lines
			continue;
		}

		const mode = parts[0]?.trim();
		const path = parts[1]?.trim();
		const hashHex = parts[2]?.trim();

		if (!mode || !path || !hashHex) {
			// Skip incomplete entries
			continue;
		}

		try {
			entries.push({
				mode,
				path,
				hash: Buffer.from(hashHex, "hex"),
			});
		} catch (error) {
			// Skip entries with invalid hash format
			console.warn(`Skipping invalid index entry: ${line}`);
		}
	}

	return entries;
}

// Recursive function to build trees
function buildTree(
	entries: { mode: string; path: string; hash: Buffer }[],
	basePath = "",
): string {
	const treeEntries: TreeEntry[] = [];
	const dirs: Record<string, { mode: string; path: string; hash: Buffer }[]> =
		{};

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
				type: TreeEntryTypes.BLOB,
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
		const subtreeHash = Buffer.from(
			buildTree(dirs[dirName]!, basePath + dirName + "/"),
			"hex",
		);
		treeEntries.push({
			name: dirName,
			mode: "40000", // Directory (tree object)
			hash: subtreeHash,
			type: TreeEntryTypes.TREE,
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
	const objectsDir = resolve(".wise", "objects", dir);
	mkdirSync(objectsDir, { recursive: true });
	const objectPath = resolve(objectsDir, fileName);
	const compressed = deflateSync(content);
	writeFileSync(objectPath, compressed);

	return hashHex;
}
