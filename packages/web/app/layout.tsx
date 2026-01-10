import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { HeaderUserMenu } from "@/components/header/HeaderUserMenu";
import NextTopLoader from "nextjs-toploader";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "CommitGen";
const APP_DEFAULT_TITLE = "CommitGen";
const APP_TITLE_TEMPLATE = "%s - CommitGen";
const APP_DESCRIPTION = "CommitGen - The AI Powered Commit Generator";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  metadataBase: new URL(APP_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader showSpinner={false} color="#4f39f6" />

        {/* Navbar */}
        <header className="sticky top-0 px-4 z-50 w-full border-b border-neutral-100 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/">
                <span className="text-lg font-bold tracking-tight">
                  CommitGen
                </span>
              </Link>
            </div>
            <nav className="hidden gap-6 sm:flex">
              <Link
                href="https://github.com/aevrhq/commitgen"
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                target="_blank"
              >
                GitHub
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <HeaderUserMenu />
            </div>
          </div>
        </header>
        <ThemeProvider enableSystem enableColorScheme attribute="class">
          {children}
          {/* Footer */}
          <footer className="border-t border-neutral-100 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                &copy; {new Date().getFullYear()} CommitGen. All rights
                reserved.
              </p>
              <div className="flex gap-6">
                <Link
                  href="https://github.com/aevrhq/commitgen"
                  className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  GitHub
                </Link>
                <Link
                  href="/privacy"
                  className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Terms
                </Link>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
