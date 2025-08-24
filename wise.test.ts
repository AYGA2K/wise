import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Helper function to run commands
function runCommand(cmd: string): string {
	try {
		return execSync(cmd, { encoding: "utf8" });
	} catch (error: any) {
		return error.stdout || error.message;
	}
}

// Helper to create test files
function createFile(filePath: string, content: string = "") {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(filePath, content);
}

describe("Wise Version Control System", () => {
	const testDir = path.join(__dirname, "test-repo");
	const originalCwd = process.cwd();

	beforeEach(() => {
		// Clean up and create test directory
		if (fs.existsSync(testDir)) {
			fs.rmSync(testDir, { recursive: true, force: true });
		}
		fs.mkdirSync(testDir);
		process.chdir(testDir);
	});

	afterEach(() => {
		process.chdir(originalCwd);
		if (fs.existsSync(testDir)) {
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});

	describe("init command", () => {
		test("should initialize a new repository", () => {
			const output = runCommand("node ../dist/main.js init");

			expect(output).toContain("Initialized wise directory");
			expect(fs.existsSync(".wise")).toBe(true);
			expect(fs.existsSync(".wise/objects")).toBe(true);
			expect(fs.existsSync(".wise/refs/heads")).toBe(true);
			expect(fs.existsSync(".wise/HEAD")).toBe(true);

			const headContent = fs.readFileSync(".wise/HEAD", "utf8");
			expect(headContent).toBe("ref: refs/heads/main\n");
		});
	});

	describe("config command", () => {
		beforeEach(() => {
			runCommand("node ../dist/main.js init");
		});

		test("should set and get configuration values", () => {
			runCommand('node ../dist/main.js config user.name "Test User"');
			runCommand('node ../dist/main.js config user.email "test@example.com"');

			const nameOutput = runCommand("node ../dist/main.js config user.name");
			const emailOutput = runCommand("node ../dist/main.js config user.email");

			expect(nameOutput.trim()).toBe("user.name = Test User");
			expect(emailOutput.trim()).toBe("user.email = test@example.com");
		});

		test("should return null for non-existent keys", () => {
			const output = runCommand("node ../dist/main.js config non.existent");
			expect(output).toContain('Key "non.existent" not found');
		});

		test("should show usage when no key provided", () => {
			const output = runCommand("node ../dist/main.js config");
			expect(output).toContain("Usage: config <key> [value]");
		});
	});

	describe("add command", () => {
		beforeEach(() => {
			runCommand("node ../dist/main.js init");
			createFile("test.txt", "Hello World");
			createFile("src/app.js", 'console.log("Hello");');
		});

		test("should add file to staging", () => {
			runCommand("node ../dist/main.js add test.txt");

			expect(fs.existsSync(".wise/index")).toBe(true);
			const indexContent = fs.readFileSync(".wise/index", "utf8");
			expect(indexContent).toContain("100644|test.txt|");
			expect(
				indexContent.split("\n").filter((line) => line.trim()).length,
			).toBe(1);
		});

		test("should add multiple files", () => {
			runCommand("node ../dist/main.js add test.txt");
			runCommand("node ../dist/main.js add src/app.js");

			const indexContent = fs.readFileSync(".wise/index", "utf8");
			const lines = indexContent.split("\n").filter((line) => line.trim());

			expect(lines.length).toBe(2);
			expect(indexContent).toContain("test.txt");
			expect(indexContent).toContain("src/app.js");
		});

		test("should update existing file in staging", () => {
			// Add file first time
			runCommand("node ../dist/main.js add test.txt");
			const firstIndex = fs.readFileSync(".wise/index", "utf8");

			// Modify file and add again
			createFile("test.txt", "Modified content");
			runCommand("node ../dist/main.js add test.txt");

			const secondIndex = fs.readFileSync(".wise/index", "utf8");
			const lines = secondIndex.split("\n").filter((line) => line.trim());

			expect(lines.length).toBe(1); // still only one entry
			expect(secondIndex).not.toBe(firstIndex); // content should be different
		});

		test("should show error when no file specified", () => {
			const output = runCommand("node ../dist/main.js add");
			expect(output).toContain("Error: Add requires a path");
		});
	});

	describe("status command", () => {
		beforeEach(() => {
			runCommand("node ../dist/main.js init");
			createFile("tracked.txt", "Initial content");
			createFile("untracked.txt", "Untracked file");
		});

		test("should show untracked files initially", () => {
			const output = runCommand("node ../dist/main.js status");
			expect(output).toContain("Untracked files:");
			expect(output).toContain("tracked.txt");
			expect(output).toContain("untracked.txt");
			expect(output).not.toContain("nothing to commit, working tree clean");
		});

		test("should show staged files after add", () => {
			runCommand("node ../dist/main.js add tracked.txt");

			const output = runCommand("node ../dist/main.js status");
			expect(output).toContain("Untracked files:");
			expect(output).toContain("untracked.txt");
			expect(output).toContain("Changes to be committed:");
			expect(output).toContain("tracked.txt");
		});

		test("should show modified files", () => {
			runCommand("node ../dist/main.js add tracked.txt");
			createFile("tracked.txt", "Modified content");

			const output = runCommand("node ../dist/main.js status");
			expect(output).toContain("Changes not staged for commit:");
			expect(output).toContain("modified:   tracked.txt");
			expect(output).toContain("Untracked files:");
			expect(output).toContain("untracked.txt");
		});
	});
	describe("commit command", () => {
		beforeEach(() => {
			runCommand("node ../dist/main.js init");
			runCommand('node ../dist/main.js config user.name "Test User"');
			runCommand('node ../dist/main.js config user.email "test@example.com"');

			createFile("file1.txt", "Content 1");
			createFile("file2.txt", "Content 2");
		});

		test("should commit staged changes", () => {
			runCommand("node ../dist/main.js add file1.txt");

			const output = runCommand(
				'node ../dist/main.js commit -m "Initial commit"',
			);

			// Should return a SHA hash
			expect(output.trim()).toMatch(/^[a-f0-9]{40}$/);

			// Index should be cleared after commit
			const indexContent = fs.readFileSync(".wise/index", "utf8");
			expect(indexContent.trim()).toBe("");

			// Commit object should be created
			const commitSHA = output.trim();
			const commitPath = `.wise/objects/${commitSHA.slice(0, 2)}/${commitSHA.slice(2)}`;
			expect(fs.existsSync(commitPath)).toBe(true);
		});

		test("should show error when no user config", () => {
			// Clear config
			if (fs.existsSync(".wise/config")) {
				fs.rmSync(".wise/config");
			}

			runCommand("node ../dist/main.js add file1.txt");
			const output = runCommand('node ../dist/main.js commit -m "Test commit"');

			expect(output).toContain("user.name and user.email must be set");
		});

		test("should show error when no message provided", () => {
			const output = runCommand("node ../dist/main.js commit");
			expect(output).toContain("Error: Commit message missing");
		});
	});
	describe("integration test", () => {
		test("complete workflow: init -> config -> add -> commit -> status", () => {
			// Initialize
			runCommand("node ../dist/main.js init");

			// Set config
			runCommand('node ../dist/main.js config user.name "Integration Test"');
			runCommand(
				'node ../dist/main.js config user.email "integration@test.com"',
			);

			// Create and add files
			createFile("README.md", "# Test Project");
			createFile("src/index.js", "// Main file");
			createFile("package.json", '{"name": "test"}');

			runCommand("node ../dist/main.js add README.md");
			runCommand("node ../dist/main.js add src/index.js");

			// Check status before commit
			const statusBefore = runCommand("node ../dist/main.js status");
			expect(statusBefore).toContain("Changes to be committed:");
			expect(statusBefore).toContain("README.md");
			expect(statusBefore).toContain("src/index.js");
			expect(statusBefore).toContain("Untracked files:");
			expect(statusBefore).toContain("package.json");

			// Commit
			const commitOutput = runCommand(
				'node ../dist/main.js commit -m "Initial project setup"',
			);
			expect(commitOutput.trim()).toMatch(/^[a-f0-9]{40}$/);
		});
	});
});
