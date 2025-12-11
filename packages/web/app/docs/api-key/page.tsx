import { ApiKeyGuide } from "@/components/docs/api-key-guide";

export const metadata = {
  title: "Get Gemini API Key | CommitGen",
  description:
    "Step-by-step guide to getting a free Google Gemini API key for CommitGen.",
};

export default function ApiKeyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950 px-6">
      <ApiKeyGuide />
    </div>
  );
}
