<!-- ./README.md -->

# @untools/commitgen

🚀 AI-powered commit message generator for Git with modular AI provider support.

## Features

✨ **AI-Powered Generation**: Leverages advanced AI models to analyze your git changes and generate meaningful commit messages

🎯 **Conventional Commits**: Follows the [Conventional Commits](https://www.conventionalcommits.org/) specification

🔌 **Modular Providers**: Support for multiple AI providers:

- ✅ Vercel AI SDK (Google Gemini)
- 🔜 Vercel AI SDK (OpenAI)
- 🔜 Groq
- 🔜 OpenAI Direct
- 🔜 Google Direct
- 🔜 Local LLMs (Ollama, LM Studio, etc.)

📜 **Commit History Learning**: Analyzes your past commits to personalize suggestions in your style.

🔄 **Multi-Commit Mode**: Intelligently splits staged changes into multiple atomic commits.

🎫 **Issue Tracker Integration**: Auto-links commits to Jira, GitHub, Linear, and GitLab issues from your branch name.

🎨 **Beautiful CLI**: Colorized output with interactive prompts using Inquirer

📊 **Smart Analysis**: Analyzes file patterns, additions/deletions, and git diffs

⚡ **Fast**: Efficient processing with fallback to rule-based suggestions

## Installation

```bash
# Global installation (recommended)
npm install -g @untools/commitgen

# Or use with npx
npx @untools/commitgen
````

## Quick Start

1. **Stage your changes**:

<!-- end list -->

```bash
git add .
```

2. **Generate commit message**:

<!-- end list -->

```bash
commitgen
```

That's it\! If it's your first time, CommitGen will automatically prompt you to configure your API key. The tool will then analyze your changes and suggest commit messages.

### First-Time Setup

When you run `commitgen` for the first time without an API key, you'll see:

```
⚠️  API key not found for the selected provider.
? Would you like to configure your API key now? (Y/n)
```

Choose "Yes" to set up your configuration, or run `commitgen config` manually anytime.

## Usage

### Basic Commands

```bash
# Generate commit message (interactive, all features enabled)
commitgen

# Commit and push in one command
commitgen --push

# Skip git hooks
commitgen --noverify

# Use rule-based suggestions (no AI)
commitgen --no-ai

# Configure AI provider
commitgen config

# Show help
commitgen --help

# Show version
commitgen --version
```

### Command-Line Overrides

You can temporarily disable new features using flags:

```bash
# Disable history learning for a single commit
commitgen --no-history

# Force or disable multi-commit mode
commitgen --multi-commit
commitgen --no-multi-commit

# Disable issue linking for a single commit
commitgen --no-issues

# Quick commit without any enhancements
commitgen --no-history --no-multi-commit --no-issues
```

### Configuration

The configuration file is stored at `~/.commitgenrc.json`. It stores both your provider settings and your preferences for new features.

```json
{
  "provider": {
    "provider": "vercel-google",
    "model": "gemini-2.5-flash",
    "apiKey": "optional-if-using-env-var"
  },
  "features": {
    "historyLearning": true,
    "multiCommit": true,
    "issueTracking": true
  }
}
```

You can disable features globally by setting them to `false` in this file.

### Environment Variables

You can use environment variables instead of storing API keys in the config:

```bash
# For Google Gemini (via Vercel AI SDK)
export GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"

# Then run without configuring
commitgen
```

## AI Providers

### Vercel AI SDK - Google Gemini (Available Now)

Uses the [Vercel AI SDK](https://sdk.vercel.ai/) with Google's Gemini models.

**Setup:**

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Run `commitgen config` and select "Vercel AI SDK - Google Gemini"
3. Enter your API key or set `GOOGLE_GENERATIVE_AI_API_KEY` environment variable

**Available Models:**

- `gemini-2.5-flash` (Recommended - Fast and efficient)
- `gemini-2.5-pro` (More capable, higher quality)
- `gemini-1.5-flash`
- `gemini-1.5-pro`

### Coming Soon

- **Vercel AI SDK - OpenAI**: GPT-4o, GPT-4o-mini
- **Groq**: Ultra-fast inference with Llama models
- **OpenAI Direct**: Direct OpenAI API integration
- **Google Direct**: Direct Google Generative AI integration
- **Local LLMs**: Ollama, LM Studio, LocalAI support

## How It Works

1. **Analysis**: Scans your staged git changes
      - File patterns (tests, docs, configs, components)
      - Addition/deletion statistics
      - Git diff content
2. **AI Generation**: Sends analysis to your configured AI provider
      - Uses a specialized prompt for commit message generation
      - Follows Conventional Commits specification
      - Returns 3-5 contextual suggestions
3. **Selection**: Interactive prompt to choose or customize
      - Select from AI-generated suggestions
      - Write a custom message
      - Confirm before committing
4. **Commit**: Executes git commit with your chosen message
      - Optional: Push to remote with `--push` flag
      - Optional: Skip hooks with `--noverify` flag

## Core Features in Detail

### 📜 Commit History Learning

CommitGen now analyzes your past commits to personalize suggestions in your style.

**How It Works**

- **Automatic Analysis**: Analyzes your last 50 commits to understand your patterns
- **Smart Caching**: Results cached for 5 minutes to maintain performance
- **Pattern Recognition**: Identifies your preferred:
  - Commit types (feat, fix, chore, etc.)
  - Scopes and naming conventions
  - Subject length preferences
  - Style preferences (capitalization, emojis, periods)

**Usage**

```bash
# Enabled by default
commitgen

# Disable for a single commit
commitgen --no-history
```

**What Gets Personalized**

- **Type Selection**: Favors your most-used commit types
- **Subject Length**: Matches your typical message length
- **Capitalization**: Follows your capitalization style
- **Punctuation**: Respects your period usage preferences

**Example**

If your history shows:

- 60% of commits are `feat` type
- Average subject length: 45 characters
- 90% capitalize first letter
- 10% use periods

Then suggestions will be adjusted to match this style.

### 🔄 Multi-Commit Mode

Intelligently splits staged changes into multiple atomic commits for better git history.

**How It Works**

- **Automatic Detection**: Analyzes staged files for distinct concerns
- **Smart Grouping**: Groups files by:
  - File type (tests, docs, configs, types)
  - Directory structure
  - Functional concerns (API, components, utils)
- **Logical Ordering**: Commits in the right order (types → config → features → tests → docs)

**Usage**

```bash
# Let CommitGen suggest splitting
commitgen

# Force multi-commit mode
commitgen --multi-commit

# Disable multi-commit mode
commitgen --no-multi-commit
```

**When It Triggers**

Multi-commit mode is suggested when:

- You have 4+ files changed
- Files belong to 2+ distinct concerns

**Example**

Staged Changes:

- `src/types.ts`
- `src/config.ts`
- `src/components/Button.tsx`
- `src/components/Button.test.tsx`
- `README.md`

Suggested Commits:

1. Type definition updates (1 file)
      - `src/types.ts`
2. Configuration changes (1 file)
      - `src/config.ts`
3. Component updates (1 file)
      - `src/components/Button.tsx`
4. Test additions/updates (1 file)
      - `src/components/Button.test.tsx`
5. Documentation updates (1 file)
      - `README.md`

**Benefits**

- **Cleaner History**: Each commit has a single responsibility
- **Better Rollbacks**: Can revert specific changes without affecting others
- **Easier Reviews**: Smaller, focused commits are easier to review
- **Semantic Versioning**: Clear separation of features, fixes, and chores

### 🎫 Issue Tracker Integration

Auto-links commits to Jira/GitHub/Linear/GitLab issues from branch names.

**Supported Platforms**

- **Jira**
  - Pattern: `PROJ-123` or `feature/PROJ-123-description`
  - Format: `[PROJ-123]` in subject + footer
- **GitHub**
  - Pattern: `#123`, `issue-123`, or `123-description`
  - Format: `Closes #123` in footer (auto-closes issues)
- **Linear**
  - Pattern: `TEAM-123` or `team/TEAM-123-description`
  - Format: `[TEAM-123]` in subject
- **GitLab**
  - Pattern: Same as GitHub
  - Format: `Closes #123` in footer (auto-closes issues)

**How It Works**

- **Branch Detection**: Extracts issue ID from current branch name
- **Type Inference**: Suggests commit type based on branch prefix
  - `feature/` → `feat`
  - `fix/` or `bugfix/` → `fix`
  - `hotfix/` → `fix`
  - `docs/` → `docs`
- **Auto-Linking**: Adds proper references to commit message

**Usage**

```bash
# Enabled by default
commitgen

# Disable for a single commit
commitgen --no-issues
```

**Examples**

- **Jira Integration**
  - Branch: `feature/AUTH-456-oauth-login`
  - Result:

        ```
        feat(auth): add OAuth2 authentication [AUTH-456]

        Implemented OAuth2 flow with Google provider

        Jira: AUTH-456
        ```

- **GitHub Integration**
  - Branch: `fix/123-navigation-bug`
  - Result:

        ```
        fix(navigation): resolve routing issue

        Fixed navigation bug causing incorrect redirects

        Closes #123
        ```

- **Linear Integration**
  - Branch: `ENG-789-refactor-api`
  - Result:

        ```
        refactor(api): simplify endpoint structure [ENG-789]

        Restructured API endpoints for better organization
        ```

**Branch Naming Best Practices**

For best results, use conventional branch names:

```
# Jira
feature/PROJ-123-short-description
fix/PROJ-456-bug-description
hotfix/PROJ-789-critical-fix

# GitHub/GitLab
feature/123-new-feature
fix/456-bug-fix
docs/789-update-readme

# Linear
feature/TEAM-123-description
refactor/TEAM-456-cleanup
```

### Performance Optimizations

All new features are designed with performance in mind:

- **Commit History Learning**
  - ✅ Cached Results: 5-minute TTL cache
  - ✅ Limited Analysis: Only last 50 commits
  - ✅ Async Processing: Non-blocking analysis
  - ⚡ Impact: \<50ms overhead
- **Multi-Commit Mode**
  - ✅ Lazy Evaluation: Only triggers when needed
  - ✅ Pattern Matching: Fast regex-based detection
  - ✅ Incremental Git Ops: Efficient file-specific diffs
  - ⚡ Impact: \~100ms for large changesets
- **Issue Tracker Integration**
  - ✅ Single Git Call: One branch name fetch
  - ✅ Regex Parsing: No external API calls
  - ✅ Result Caching: Cached per session
  - ⚡ Impact: \<10ms overhead

**Combined Overhead**

- Typical usage: **+150ms total**
- Large projects: **+250ms total**
- All features disabled: **0ms overhead**

## Examples

### Typical Workflow

```bash
# Make some changes
vim src/components/Button.tsx

# Stage changes
git add src/components/Button.tsx

# Generate and commit
commitgen
```

Output:

```
🚀 CommitGen - AI-Powered Commit Message Generator

📊 Analysis:
   Files changed: 1
   Additions: +45
   Deletions: -12

📝 Changed files:
   ⚛️ src/components/Button.tsx

🤖 Generating commit messages using vercel-google...

💡 Suggested commit messages:

1. feat(components): add variant prop to Button component
2. feat(Button): implement new button styles and variants
3. refactor(components): restructure Button component props
4. style(Button): update button styling system
✏️  Write custom message

? Choose a commit message: (Use arrow keys)
```

### Configuration Example

```bash
$ commitgen config

⚙️  Configure CommitGen

? Select AI provider: Vercel AI SDK - Google Gemini
? Enter your Google AI API key: **********************
? Select model: Gemini 2.5 Flash (Fast, Recommended)

✅ Configuration saved successfully!
Config file: /Users/you/.commitgenrc.json
```

## Commit Message Format

Generated messages follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test updates
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks
- `revert`: Revert previous commit

**Example:**

```
feat(auth): add OAuth2 authentication

Implemented OAuth2 flow with Google and GitHub providers.
Added JWT token management and refresh logic.

BREAKING CHANGE: Authentication API has changed
```

## Migration Guide

### From v0.0.x to v0.1.x

- **Breaking Changes**: None
- **New Features**: All new features (History Learning, Multi-Commit, Issue Tracking) are **enabled by default**.
- **Recommended Steps**:
    1. Update package: `npm install -g @untools/commitgen@latest`
    2. Test new features: `commitgen` (uses all features)
    3. Configure preferences in `~/.commitgenrc.json` if you wish to disable any features globally.
    4. Update CI/CD workflows to use new flags (e.g., `--no-history`) if desired.

### Backward Compatibility

All existing commands work exactly as before:

```bash
# These still work identically
commitgen
commitgen --push
commitgen --noverify
commitgen --no-ai
```

## API for Advanced Users

### Programmatic Usage

```javascript
import { CommitGen } from '@untools/commitgen';

const commitGen = new CommitGen();

await commitGen.run({
  push: false,
  noverify: false,
  useAi: true,
  multiCommit: true,
  learnFromHistory: true,
  linkIssues: true
});
```

### Custom History Analyzer

```javascript
import { CommitHistoryAnalyzer } from '@untools/commitgen/utils/commit-history';

const analyzer = new CommitHistoryAnalyzer();
const pattern = await analyzer.getCommitPattern();

console.log(pattern.commonTypes); // { feat: 30, fix: 15, ... }
console.log(pattern.avgSubjectLength); // 45
```

### Custom Multi-Commit Logic

```javascript
import { MultiCommitAnalyzer } from '@untools/commitgen/utils/multi-commit';

const analyzer = new MultiCommitAnalyzer();
const shouldSplit = analyzer.shouldSplit(analysis);
const groups = analyzer.groupFiles(analysis);
```

## Troubleshooting

### "No staged changes found"

Make sure you've staged your changes:

```bash
git add <files>
# or
git add .
```

### "API key is required"

Set your API key either:

1. Run `commitgen config` to save it in config file
2. Set environment variable: `export GOOGLE_GENERATIVE_AI_API_KEY="your-key"`

### AI generation fails

The tool will automatically fall back to rule-based suggestions if AI generation fails. You can also force rule-based mode with `--no-ai`.

### History Learning Not Working

- **Issue**: "No personalization detected"
- **Solutions**:
  - Ensure you have at least 5 commits in your repository
  - Check that commits follow conventional commit format
  - Wait 5 minutes for cache to refresh

### Multi-Commit Mode Not Triggering

- **Issue**: Single commit despite multiple concerns
- **Solutions**:
  - Ensure you have 4+ files staged
  - Use `--multi-commit` flag to force
  - Check that files have distinct purposes

### Issue Reference Not Detected

- **Issue**: Branch issue not linked
- **Solutions**:
  - Check branch naming follows conventions
  - Verify issue ID format matches platform
  - Use `git branch --show-current` to check branch name

### Performance Issues

- **Issue**: CommitGen feels slow
- **Solutions**:
  - Disable features individually to identify bottleneck (`--no-history`, etc.)
  - Check git repository size (very large repos may be slower)
  - Clear cache with `rm -rf ~/.commitgen-cache` (if implemented)

## Development

```bash
# Clone the repository
git clone [https://github.com/aevrHQ/untools-commitgen.git](https://github.com/aevrHQ/untools-commitgen.git)
cd untools-commitgen

# Install dependencies
npm install

# Build
npm run build

# Link for local testing
npm link

# Run
commitgen
```

## Dependencies

```json
{
  "@ai-sdk/google": "^1.x.x",
  "ai": "^4.x.x",
  "chalk": "^4.1.2",
  "commander": "^13.1.0",
  "inquirer": "^12.5.2"
}
```

## Contributing

Contributions are welcome\! Please feel free to submit a Pull Request.

## License

MIT © Miracle Onyenma

## Links

- [GitHub Repository](https://github.com/aevrHQ/untools-commitgen)
- [npm Package](https://www.npmjs.com/package/@untools/commitgen)
- [Issue Tracker](https://github.com/aevrHQ/untools-commitgen/issues)

-----

Made with ❤️ by [Miracle Onyenma](https://github.com/miracleonyenma)

```
