import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const CONFIG_DIR = resolve(".wise");
const CONFIG_FILE = resolve(CONFIG_DIR, "config");

if (!existsSync(CONFIG_DIR)) {
	mkdirSync(CONFIG_DIR);
}

export function getConfig(key: string): string | null {
	if (!existsSync(CONFIG_FILE)) return null;

	const content = readFileSync(CONFIG_FILE, "utf8");
	const lines = content.split("\n");

	for (const line of lines) {
		if (!line.trim()) continue;

		const equalsIndex = line.indexOf("=");
		if (equalsIndex === -1) continue;

		const k = line.slice(0, equalsIndex).trim();
		const v = line.slice(equalsIndex + 1).trim();

		if (k === key) return v;
	}

	return null;
}

export function setConfig(key: string, value: string) {
	const config: Record<string, string> = {};

	// Read existing config
	if (existsSync(CONFIG_FILE)) {
		const content = readFileSync(CONFIG_FILE, "utf8");
		const lines = content.split("\n");

		for (const line of lines) {
			if (!line.trim()) continue;

			const equalsIndex = line.indexOf("=");
			if (equalsIndex === -1) continue;

			const k = line.slice(0, equalsIndex).trim();
			const v = line.slice(equalsIndex + 1).trim();

			if (k) config[k] = v;
		}
	}

	// Update with new value
	config[key] = value;

	// Write back to file
	const newContent = Object.entries(config)
		.map(([k, v]) => `${k}=${v}`)
		.join("\n");

	writeFileSync(CONFIG_FILE, newContent + "\n", "utf8");
}
