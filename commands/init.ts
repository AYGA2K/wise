import fs from 'fs';

export function init() {
  fs.mkdirSync(".wise", { recursive: true });
  fs.mkdirSync(".wise/objects", { recursive: true });
  fs.mkdirSync(".wise/refs/heads", { recursive: true });
  fs.writeFileSync(".wise/HEAD", "ref: refs/heads/main\n");
  console.log("Initialized wise directory");
}
