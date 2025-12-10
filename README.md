# CommitGen

**The AI-Powered Commit Generator**

CommitGen is a powerful developer tool that leverages AI to generate conventional commit messages from your staged changes. It includes a robust CLI for your terminal workflow and a feature-rich Web Dashboard for managing your profile and credits.

## Features

### 💻 CLI Tool

- **Automated Generation**: Generates semantic commit messages based on staged changes.
- **Interactive Mode**: Review and edit generated messages before committing.
- **Git Integration**: Seamlessly integrates with your existing git workflow.
- **Login Integration**: Authenticate via the CLI to sync with your web profile.

### 🌐 Web Dashboard

- **Modern UI**: Sleek, responsive interface built with Shadcn/UI and Tailwind CSS.
- **Authentication**: secure passwordless login via Email/OTP.
- **Credit Management**: Track and manage your generation credits.
- **PWA Support**: Installable on mobile devices for on-the-go access.
- **Dark Mode**: Fully supported dark/light themes.

## Tech Stack

This project is a monorepo managed with **TurboRepo**.

- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS 4, Shadcn/UI
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **CLI**: Node.js, Commander
- **State Management**: Zustand (with persistence)
- **Deployment**: Vercel (Web), NPM (CLI)

## Directory Structure

```
commitgen/
├── packages/
│   ├── cli/        # Node.js CLI tool (@untools/commitgen)
│   ├── web/        # Next.js Web App (@untools/commitgen-web)
│   └── shared/     # Shared Types & Utilities (@untools/commitgen-shared)
├── package.json    # Root configuration
└── turbo.json      # Build pipeline definition
```

## Quick Start

### Prerequisites

- Node.js > 18
- NPM or PNPM
- MongoDB Database (for Web)

### Installation

```bash
# Clone the repository
git clone https://github.com/aevrhq/commitgen.git
cd commitgen

# Install dependencies (from root)
npm install
```

### Development

You can run commands from the root to target specific workspaces.

**Web Development:**

```bash
# Start the Next.js development server
npm run web:dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

**CLI Development:**

```bash
# Build the CLI
npm run cli:build

# Run the CLI locally
npm run cli:dev
```

### Building

```bash
# Build all packages
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
