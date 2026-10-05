import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/shell";
import { passwordSchema } from "@/lib/validations";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — CampusFlow" },
      { name: "description", content: "Choose a new password for your CampusFlow account." },
      { property: "og:title", content: "Set a new password — CampusFlow" },
      { property: "og:description", content: "Choose a new password for your CampusFlow account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault();
    const p = passwordSchema.safeParse(pw);
    if (!p.success) return setErr(p.error.issues[0].message);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setErr("This reset link is invalid or has expired. Request a new one.");
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={submit} className="card-surface w-full max-w-sm space-y-4 p-6" noValidate>
        <Logo />
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <div>
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" autoComplete="new-password" className="mt-1.5 h-11" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        {err && (
          <p role="alert" className="text-sm text-error">
            {err}
          </p>
        )}
        <Button type="submit" className="h-11 w-full">
          Update password
        </Button>
      </form>
    </div>
  );
}
