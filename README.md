# CommitGen Monorepo

This monorepo contains the CommitGen CLI tool and its web interface.

## Packages

- **[@untools/commitgen](./packages/cli)** - CLI tool for AI-powered commit message generation
- **[@untools/commitgen-web](./packages/web)** - Web interface and landing page (to be initialized)
- **[@untools/commitgen-shared](./packages/shared)** - Shared types and utilities

## Quick Start

### CLI Development

```bash
# Build the CLI
npm run cli:build

# Run CLI in development
npm run cli:dev

# Publish CLI to npm
npm run cli:publish
```

### Web Development

First, initialize the web package with shadcn/ui:

```bash
cd packages/web
npx shadcn@latest init
```

Then run development:

```bash
npm run web:dev
```

### Workspace Commands

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Clean all build artifacts
npm run clean
```

## Publishing

The CLI package (`@untools/commitgen`) can be published independently:

```bash
npm run cli:publish
```

This will:

1. Build the CLI package
2. Publish it to npm with the existing configuration

The web package is marked as private and won't be published to npm.

## Structure

```
commitgen/
├── packages/
│   ├── cli/                 # Original CLI tool
│   ├── web/                 # Next.js web app (to be initialized)
│   └── shared/              # Shared utilities and types
├── package.json             # Workspace configuration
└── turbo.json              # Build orchestration
```
