# Git-like Version Control System

A lightweight implementation of Git-like version control system built with TypeScript, supporting basic Git commands.

## Features

- **Repository initialization**: `init`
- **File staging**: `add <file>`
- **Committing changes**: `commit -m <message>`
- **Configuration management**: `config <key> [value]`
- **Status tracking**: `status`
- **Basic object storage** (blobs, trees, commits)
- **SHA-1 hashing** for content addressing

## Installation

```bash
# Clone the repository
git clone https://github.com/AYGA2K/wise

# Install dependencies
npm install

# Build the project
npm run build

```

## Usage

### Initialize a new repository

```bash
node dist/main.js init
```

### Configure user settings

```bash
# Set configuration
node dist/main.js config user.name "Your Name"
node dist/main.js config user.email "your.email@example.com"

# View configuration
node dist/main.js config user.name
```

### Stage files

```bash
# Stage a single file
node dist/main.js add filename.txt

# Stage multiple files
node dist/main.js add file1.txt
node dist/main.js add file2.txt
```

### Commit changes

```bash
# Commit staged changes with a message
node dist/main.js commit -m "Initial commit"
```

### Check repository status

```bash
# View current working tree status
node dist/main.js status
```
