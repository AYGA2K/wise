import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { padRight } from "../helpers/padRight";

const CONFIG_DIR = resolve(".wise");
const CONFIG_FILE = resolve(CONFIG_DIR, "config");

const KEY_LEN = 32;
const VALUE_LEN = 64;

if (!existsSync(CONFIG_DIR)) {
  mkdirSync(CONFIG_DIR);
}


export function getConfig(key: string): string | null {
  if (!existsSync(CONFIG_FILE)) return null;

  const content = readFileSync(CONFIG_FILE, "utf8");
  const lines = content.split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;
    const k = line.slice(0, KEY_LEN).trim();
    const v = line.slice(KEY_LEN, KEY_LEN + VALUE_LEN).trim();
    if (k === key) return v;
  }

  return null;
}

export function setConfig(key: string, value: string) {
  let config: Record<string, string> = {};

  if (existsSync(CONFIG_FILE)) {
    const content = readFileSync(CONFIG_FILE, "utf8");
    const lines = content.split("\n");

    for (const line of lines) {
      if (!line.trim()) continue;
      const k = line.slice(0, KEY_LEN).trim();
      const v = line.slice(KEY_LEN, KEY_LEN + VALUE_LEN).trim();
      if (k) config[k] = v;
    }
  }

  config[key] = value;

  const newContent = Object.entries(config)
    .map(([k, v]) => padRight(k, KEY_LEN) + padRight(v, VALUE_LEN))
    .join("\n");

  writeFileSync(CONFIG_FILE, newContent + "\n", "utf8");
}
