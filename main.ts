import { add } from "./commands/add";
import { commit } from "./commands/commit";
import { init } from "./commands/init";
import { setConfig, getConfig } from "./commands/config";
import { Commands } from "./types/commands";
import { Flags } from "./types/flags";

const args = process.argv.slice(2);
const command = args[0] || "";

switch (command) {
  case Commands.INIT:
    init();
    break;

  case Commands.COMMIT: {
    const indexofmessageFlag = args.indexOf(Flags.M);
    if (indexofmessageFlag !== -1) {
      const message = args[indexofmessageFlag + 1] || "";
      console.log(commit(message));
    } else {
      console.log("Error: Commit message missing. Usage: commit -m <message>");
    }
    break;
  }

  case Commands.ADD:
    if (args[1]) {
      add(args[1]);
    } else {
      console.log("Error: Add requires a path. Usage: add <file>");
    }
    break;

  case Commands.CONFIG: {
    const key = args[1];
    const value = args[2];
    if (!key) {
      console.log("Usage: config <key> [value]");
      console.log("Example: config user.name Ayoub");
      break;
    }

    if (value) {
      setConfig(key, value);
    } else {
      const current = getConfig(key);
      if (current) {
        console.log(`${key} = ${current}`);
      } else {
        console.log(`Key "${key}" not found`);
      }
    }
    break;
  }

  default:
    console.log("Supported commands:");
    console.log("  init              Initialize a new repository");
    console.log("  add <path>        Add a file to staging");
    console.log("  commit -m <msg>   Commit staged changes with a message");
    console.log("  config <k> [v]    Get or set configuration");
    break;
}
