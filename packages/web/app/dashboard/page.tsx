"use client";

import { useEffect, useState } from "react";
// Assuming these components exist based on typical shadcn setup or I will use simple HTML to be safe first
// or I can check the list_dir output from the next step if I wasn't running in parallel.
// For now, I will use standard HTML/Tailwind to avoid import errors if components are missing.
// I will attempt to use some lucide icons as they are in package.json

import { User, Key, Coins } from "lucide-react";

interface UserProfile {
  email: string;
  credits: number;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // In a real app we'd use a session hook.
  // For this PoC we'll just check if there is a token in localStorage (if we implemented a login page that saves it)
  // But wait, the CLI flow is the main one. The web dashboard is just for viewing.
  // We need a way to login on the web too.
  // I implemented the API but not the Web UI for login.
  // I should probably add a simple login form on the dashboard if not logged in.

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"login" | "verify" | "dashboard">("login");
  const [token, setToken] = useState("");

  async function requestLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      setStep("verify");
    } else {
      alert("Failed to send code");
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ email, code }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("authToken", data.token);
      setToken(data.token);
      setProfile(data.user);
      setStep("dashboard");
    } else {
      alert("Invalid code");
    }
  }

  useEffect(() => {
    // Check if we have a token
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      setTimeout(() => {
        setToken(storedToken);
        // Reset to login if we can't verify quickly, but for now:
        setStep("login");
      setTimeout(() => {
        setToken(storedToken);
        setStep("login");
        setLoading(false);
      setTimeout(() => {
        setToken(storedToken);
        setStep("login");
        setLoading(false);
      }, 0);
    } else {
        setLoading(false);
    }
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  if (step === "login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Login to CommitGen
          </h1>
          <form onSubmit={requestLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Send Code
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Verify Email</h1>
          <p className="text-center text-gray-600 mb-6">
            Enter the code sent to {email}
          </p>
          <form onSubmit={verifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Verify Code
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem("authToken");
              setStep("login");
            }}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Credits Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Coins className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Available Credits
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {profile?.credits ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Account</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
          </div>

          {/* API Token Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 col-span-full">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Key className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Authentication Token
                </h2>
                <p className="text-sm text-gray-500">
                  Use this token to authenticate the CLI
                </p>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-md font-mono text-sm break-all">
              {token}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Run `commitgen login` or add this to your config to use the CLI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
