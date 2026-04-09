"use client";

import { useState } from "react";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthGateProps = {
  busy?: boolean;
  onContinueAsGuest: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
};

export function AuthGate({
  busy,
  onContinueAsGuest,
  onSignIn,
  onSignUp
}: AuthGateProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    try {
      if (mode === "signin") {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Authentication failed");
    }
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#020712]/78 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[32px] border border-emerald-950/80 bg-[#051007]/98 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
        <p className="eyebrow text-white/40">Account Access</p>
        <h2 className="mt-2 font-display text-3xl text-white">
          {mode === "signin" ? "Sign in to your atlas" : "Create your fishing atlas"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/64">
          Sign in to manage your own trip maps, or continue as a guest to view a shared read-only atlas.
        </p>

        <div className="mt-5 flex rounded-full border border-white/8 bg-[#06120a]/96 p-1">
          <button
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] transition ${mode === "signin" ? "bg-[#122217] text-white" : "text-white/55 hover:text-white"}`}
            onClick={() => setMode("signin")}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] transition ${mode === "signup" ? "bg-[#122217] text-white" : "text-white/55 hover:text-white"}`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <Input
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            value={email}
          />
          <Input
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            value={password}
          />
        </div>

        {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1 justify-center"
            disabled={busy || !email.trim() || !password.trim()}
            onClick={handleSubmit}
            type="button"
          >
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
          <Button
            className="flex-1 justify-center"
            disabled={busy}
            onClick={onContinueAsGuest}
            type="button"
            variant="secondary"
          >
            Continue as Guest
          </Button>
        </div>
      </div>
    </div>
  );
}
