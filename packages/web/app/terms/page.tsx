import { marked } from "marked";

// ./app/(site)/Privacy/page.tsx

const formattedContent = `
# Terms of Service

**Effective Date:** December 10, 2025

Welcome to CommitGen! These Terms of Service ("Terms") govern your use of the CommitGen website, CLI tool, and services derived from them. By using CommitGen, you agree to these Terms.

## 1. Description of Service

CommitGen provides AI-powered commit message generation for software developers. The service analyzes code diffs provided by the user and suggests conventional commit messages.

## 2. Usage Requirements

- You must clearly review all generated commit messages before finalizing them. **AI can make mistakes.** You are responsible for the code and messages you commit to your repositories.
- You agree not to use the service for any illegal or malicious purposes.
- You agree not to reverse engineer or abuse the API interfaces.

## 3. Account and Credits

- Some features may require purchasing credits.
- Credits are non-transferable and may expire as per the specific plan details.
- We reserve the right to suspend accounts that violate these terms.

## 4. Intellectual Property

- You retain all rights to your code. We claim no ownership over the diffs you submit or the commit messages generated.
- The CommitGen brand, CLI tool, and website content are the property of Aevr Space Studio.

## 5. Disclaimer of Warranties

The service is provided "as is" without warranties of any kind. We do not guarantee that the generated messages will be perfect, accurate, or suitable for your specific project requirements.

## 6. Limitation of Liability

To the maximum extent permitted by law, Aevr Space Studio shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of the service.

## 7. Changes to Terms

We may update these Terms from time to time. Continued use of the service constitutes acceptance of the new Terms.

## 8. Contact

For questions about these Terms, please contact us at **support@aevr.space**.
`;

const TermsPage = async () => {
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

export default TermsPage;
