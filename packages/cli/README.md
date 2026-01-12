# CommitGen CLI

**The AI-Powered Commit Generator**

CommitGen is a powerful CLI tool that leverages AI to generate conventional commit messages from your staged changes. You can use it with our hosted service (50 free credits on sign-up) or bring your own API keys.

## Installation

```bash
npm install -g @untools/commitgen
```

Or run directly with npx:

```bash
npx @untools/commitgen
```

## Quick Start

### Option 1: The Easy Way (Free Credits) ⚡

Sign up with your email to get **50 free generation credits**. No API keys required.

1.  Run the login command:
    ```bash
    commitgen login
    ```
2.  Enter your email and the OTP sent to you.
3.  Start generating commits:
    ```bash
    git add .
    commitgen
    ```

### Option 2: Bring Your Own Key (Google AI) 🔑

Prefer to use your own API key? We support Google Gemini models via the Vercel AI SDK.

1.  Configure the CLI:
    ```bash
    commitgen config
    ```
2.  Select **"Vercel AI SDK - Google Gemini (Own Key)"**.
3.  Enter your **Google AI API Key** when prompted.
4.  (Optional) Select your preferred model (e.g., Gemini 2.5 Flash).

> **Tip:** You can also set the `GOOGLE_GENERATIVE_AI_API_KEY` environment variable instead of saving it in the config file.

## How to get a Google AI API Key

Getting an API key from Google AI Studio is quick and free. Follow these steps to start generating commits with your own key.

1.  **Navigate to Google AI Studio**
    Go to [aistudio.google.com](https://aistudio.google.com).

2.  **Sign In**
    Log in with your Google Account. If this is your first time, you may need to accept the terms of service.

3.  **Locate API Key Section**
    Look at the top-left corner of the interface. You should see a button labeled "Get API key" (often indicated by a key icon). Click it.

4.  **Create & Copy Key**
    Click "Create API key". You can choose to create it in a new project (easiest) or an existing one.

    `AIzaSyD-EXAMPLE-KEY-DO-NOT-SHARE`

    > **Important:** Copy this key immediately. You won't be able to see it again after closing the dialog.

### Security Best Practices

- **Never share your API key.** Do not post it on public forums or commit it to GitHub.
- **Use Environment Variables.** Store it in a `.env` file or use `commitgen config` securely.

### Troubleshooting

- **Quota Exceeded:** The free tier is generous (15 RPM), but if you hit limits, wait a moment or check your billing settings.
- **Region Lock:** Ensure you are in a supported region for Google AI Studio.

## Usage

### Basic Usage

Stage your changes and run `commitgen`:

```bash
git add .
commitgen
```

### Commands

| Command                 | Description                                    |
| :---------------------- | :--------------------------------------------- |
| `commitgen`             | Generate a commit message for staged changes.  |
| `commitgen config`      | Configure AI provider, model, and API keys.    |
| `commitgen login`       | Log in to your CommitGen account.              |
| `commitgen dashboard`   | Open the web dashboard to manage credits.      |
| `commitgen buy-credits` | Purchase more credits for the hosted provider. |

### Options

| Option                | Description                                    |
| :-------------------- | :--------------------------------------------- |
| `-m, --message <msg>` | Use a specific commit message (skips AI).      |
| `--no-verify`         | Bypass pre-commit hooks.                       |
| `--model <id>`        | Override the configured AI model for this run. |
| `--no-use-ai`         | Force rule-based generation (offline mode).    |

## License

MIT
