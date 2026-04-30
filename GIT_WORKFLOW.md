# Git Commit Workflow with Husky

This project uses **Husky** and **lint-staged** to enforce code quality and commit message standards.

## 📋 Overview

The Git commit workflow includes:

1. **Pre-commit Hook**: Automatically runs linting and formatting on staged files
2. **Commit-msg Hook**: Validates commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) specification

## 🚀 Setup

The hooks are automatically installed when you run `pnpm install` thanks to the `prepare` script in package.json.

```bash
pnpm install
```

This will automatically set up all Git hooks.

## ✅ Pre-commit Checks

Before each commit, the following checks run automatically on staged files:

### Backend (packages/back-end)

- **TypeScript files** (`.ts`, `.js`): Runs ESLint and Prettier
  ```bash
  cd packages/back-end && pnpm lint
  cd packages/back-end && pnpm format
  ```

### Frontend (packages/front-end)

- **TypeScript/React files** (`.ts`, `.tsx`, `.js`, `.jsx`): Runs TypeScript type checking
  ```bash
  cd packages/front-end && pnpm typecheck
  ```

### All Files

- **JSON and Markdown files**: Auto-formatted with Prettier
  ```bash
  prettier --write
  ```

## 📝 Commit Message Format

Commit messages must follow the **Conventional Commits** specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Examples

✅ **Valid commit messages:**

```bash
git commit -m "feat: add user authentication module"
git commit -m "fix: resolve memory leak in graph service"
git commit -m "docs: update API documentation"
git commit -m "refactor(llm): simplify token processing logic"
git commit -m "test: add unit tests for memory service"
```

❌ **Invalid commit messages:**

```bash
git commit -m "update code"                    # Missing type
git commit -m "FEAT: add feature"              # Type must be lowercase
git commit -m "feat:"                          # Empty description
git commit -m "feat: "                         # Empty description
```

## 🔧 Manual Commands

You can manually run the checks:

```bash
# Run linting on all packages
pnpm lint

# Run formatting on all packages
pnpm format

# Validate a commit message
pnpm commitlint --edit .git/COMMIT_EDITMSG
```

## 🎯 Benefits

- **Code Quality**: Ensures all code meets linting and formatting standards before commit
- **Consistent History**: Enforces meaningful commit messages for better changelog generation
- **Automated**: No need to remember to run linters manually
- **Fast**: Only checks staged files, not the entire codebase

## ⚙️ Configuration Files

- `.husky/pre-commit`: Pre-commit hook configuration
- `.husky/commit-msg`: Commit message validation hook
- `.lintstagedrc.json`: Lint-staged configuration
- `commitlint.config.js`: Commitlint rules configuration
- `package.json`: Contains prepare script and dependencies

## 🛠️ Troubleshooting

### Hooks not running?

Make sure the hooks are executable:

```bash
chmod +x .husky/*
```

Reinstall hooks:

```bash
pnpm prepare
```

### Skip hooks (not recommended)?

Use `--no-verify` flag (only for emergencies):

```bash
git commit --no-verify -m "your message"
```

⚠️ **Warning**: Skipping hooks bypasses all quality checks and should only be used in exceptional circumstances.

## 📚 Learn More

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/lint-staged/lint-staged)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Commitlint Documentation](https://commitlint.js.org/)
