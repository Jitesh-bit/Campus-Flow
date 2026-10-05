import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/shell";
import { emailSchema, passwordSchema } from "@/lib/validations";

type Mode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: (["login", "signup", "forgot"].includes(s.mode as string) ? s.mode : undefined) as Mode | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — CampusFlow" },
      { name: "description", content: "Sign in or create your CampusFlow student account." },
      { property: "og:title", content: "Sign in — CampusFlow" },
      { property: "og:description", content: "Sign in or create your CampusFlow student account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const em = emailSchema.safeParse(email);
    if (!em.success) return setError(em.error.issues[0].message);
    if (mode !== "forgot") {
      const pw = passwordSchema.safeParse(password);
      if (!pw.success) return setError(pw.error.issues[0].message);
    }
    if (mode === "signup" && !z.string().trim().min(1).max(120).safeParse(name).success) return setError("Enter your name");
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: em.data, password });
        if (error) throw new Error("Incorrect email or password.");
        navigate({ to: "/dashboard" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: em.data,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name.trim() } },
        });
        if (error) throw new Error(error.message.includes("registered") ? "An account with this email already exists." : "We couldn't create your account. Please try again.");
        setInfo("Check your email to confirm your account, then sign in.");
      } else {
        await supabase.auth.resetPasswordForEmail(em.data, { redirectTo: window.location.origin + "/reset-password" });
        setInfo("If an account exists for that email, we've sent a reset link.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) return toast.error("Google sign-in failed. Please try again.");
    if (r.redirected) return;
    navigate({ to: "/dashboard" });
  }

  const title = { login: "Welcome back", signup: "Create your account", forgot: "Reset your password" }[mode];

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="card-surface p-6">
          <h1 className="text-xl font-semibold">{title}</h1>
          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" className="mt-1.5 h-11" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="mt-1.5 h-11" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setMode("forgot")}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  className="mt-1.5 h-11"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-md bg-error-soft px-3 py-2 text-sm text-error">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="rounded-md bg-success-soft px-3 py-2 text-sm text-success">
                {info}
              </p>
            )}
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>
          </form>
          {mode !== "forgot" && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="h-11 w-full" onClick={google}>
                Continue with Google
              </Button>
            </>
          )}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button className="font-semibold text-primary" onClick={() => setMode("login")}>
                  Log in
                </button>
              </>
            ) : mode === "login" ? (
              <>
                New here?{" "}
                <button className="font-semibold text-primary" onClick={() => setMode("signup")}>
                  Create an account
                </button>
              </>
            ) : (
              <button className="font-semibold text-primary" onClick={() => setMode("login")}>
                Back to log in
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
