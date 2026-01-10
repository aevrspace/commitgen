import { marked } from "marked";

// ./app/(site)/Privacy/page.tsx

const formattedContent = `
# Privacy Policy

**Effective Date:** December 10, 2025

CommitGen ("we", "us", or "our"), a product of Aevr Space Studio, is committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your data when you use the CommitGen CLI tool, website (commitgen.aevr.space), and related services.

## 1. Information We Collect

### 1.1 Account Information
When you register, we collect your email address and authentication details. We may also collect standard profile information if you use third-party auth providers.

### 1.2 Usage Data
We collect anonymous usage metrics, such as:
- Number of commits generated
- Credits usage
- Error logs to improve service reliability

### 1.3 Submitted Code Snippets (Ephemeral)
To provide our core service—generating commit messages—we process the git diffs (code changes) you submit via the CLI or Web Dashboard.
- **Processing**: These diffs are sent to our AI providers (e.g., OpenAI, Anthropic) solely for the purpose of generating text.
- **Retention**: We do **not** store your code snippets or diffs on our servers after the request is completed. They are processed ephemerally.

## 2. How We Use Your Data

- To provide the AI commit generation service.
- To manage your credit balance and subscription.
- To communicate service updates and security alerts.
- To prevent abuse and ensure system stability.

## 3. Third-Party Service Providers

We use trusted third parties to provide our services. They have their own privacy policies:
- **AI Providers**: For generating text from diffs.
- **Payment Processors**: We do not store financial data. Payments are handled by secure providers (e.g., Stripe, Lemon Squeezy).
- **Analytics**: To understand aggregate usage patterns.

## 4. Data Security

We implement industry-standard security measures to protect your account information. Code diffs are transmitted over encrypted connections (HTTPS/TLS) and are not retained at rest on our primary databases.

## 5. Your Rights

You have the right to:
- Access the personal data we hold about you (profile, credit history).
- Request deletion of your account and associated data.
- Opt-out of non-essential communications.

## 6. Contact Us

For privacy concerns, please contact us at **privacy@aevr.space**.
`;

const PrivacyPage = async () => {
  const content = await marked.parse(formattedContent);
  return (
    <main>
      <section className="site-section">
        <div className="wrapper max-w-4xl!">
          <div
            className="prose dark:prose-invert max-w-none!"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </section>
    </main>
  );
};

export default PrivacyPage;
