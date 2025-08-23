import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
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
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, v] = trimmed.split("=");
    if (k?.trim() === key) return v?.trim() ?? null;
  }

  return null;
}

export function setConfig(key: string, value: string) {
  let config: Record<string, string> = {};

  if (existsSync(CONFIG_FILE)) {
    const content = readFileSync(CONFIG_FILE, "utf8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [k, v] = trimmed.split("=");
      if (k) config[k.trim()] = v?.trim() ?? "";
    }
  }

  config[key] = value;

  const newContent = Object.entries(config)
    .map(([k, v]) => `${k} = ${v}`)
    .join("\n");

  writeFileSync(CONFIG_FILE, newContent + "\n", "utf8");
}
