import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/shell";
import { useMe } from "@/lib/data";
import { profileSchema } from "@/lib/validations";
import { SUBJECT_COLORS } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — CampusFlow" }] }),
  component: Onboarding,
});

const SUGGESTED = ["Python Programming", "Statistics", "Web Development", "Artificial Intelligence", "Computer Networks"];

function Onboarding() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ full_name: "", college: "", program: "", semester: "", academic_year: "", avatar_url: "" });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (me?.profile) setForm((f) => ({ ...f, full_name: f.full_name || me.profile!.full_name }));
  }, [me?.profile]);

  async function saveProfile() {
    const p = profileSchema.safeParse({ ...form, semester: form.semester || null, attendance_threshold: 75 });
    if (!p.success) {
      const e: Record<string, string> = {};
      p.error.issues.forEach((i) => (e[String(i.path[0])] ??= i.message));
      return setErrors(e);
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.from("profiles").update(p.data).eq("id", me!.user.id);
    setBusy(false);
    if (error) return toast.error("We couldn't save your profile. Please try again.");
    setStep(2);
  }

  async function finish(withDemo: boolean) {
    setBusy(true);
    try {
      if (withDemo) {
        const { error } = await supabase.rpc("seed_my_demo_data");
        if (error) throw error;
      }
      if (subjects.length) {
        const { error } = await supabase
          .from("subjects")
          .insert(subjects.map((name, i) => ({ name, color: SUBJECT_COLORS[i % SUBJECT_COLORS.length], semester: Number(form.semester) || null })));
        if (error) throw error;
      }
      await supabase.from("profiles").update({ onboarded: true }).eq("id", me!.user.id);
      await qc.invalidateQueries();
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const add = (name: string) => {
    const n = name.trim().slice(0, 120);
    if (n && !subjects.includes(n)) setSubjects([...subjects, n]);
    setDraft("");
  };

  const fields: [keyof typeof form, string, string?][] = [
    ["full_name", "Full name"],
    ["college", "College / university"],
    ["program", "Course / program", "e.g. B.Tech Computer Science"],
    ["semester", "Current semester", "e.g. 3"],
    ["academic_year", "Academic year", "e.g. 2026–27"],
    ["avatar_url", "Profile image URL (optional)", "https://…"],
  ];

  return (
    <div className="min-h-dvh px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Logo className="mb-8" />
        <p className="text-sm font-semibold text-violet">Step {step} of 2</p>
        {step === 1 ? (
          <section className="card-surface mt-2 p-6">
            <h1 className="text-2xl font-semibold">Tell us about you</h1>
            <p className="mt-1 text-sm text-muted-foreground">Signed in as {me?.user.email}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {fields.map(([k, label, ph]) => (
                <div key={k} className={k === "full_name" || k === "college" || k === "avatar_url" ? "sm:col-span-2" : ""}>
                  <Label htmlFor={k}>{label}</Label>
                  <Input
                    id={k}
                    className="mt-1.5 h-11"
                    placeholder={ph}
                    inputMode={k === "semester" ? "numeric" : undefined}
                    value={form[k]}
                    aria-invalid={!!errors[k]}
                    aria-describedby={errors[k] ? `${k}-e` : undefined}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                  {errors[k] && (
                    <p id={`${k}-e`} role="alert" className="mt-1 text-xs text-error">
                      {errors[k]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <Button className="mt-6 h-11 w-full" onClick={saveProfile} disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} Continue
            </Button>
          </section>
        ) : (
          <section className="card-surface mt-2 p-6">
            <h1 className="text-2xl font-semibold">Add your subjects</h1>
            <p className="mt-1 text-sm text-muted-foreground">You can edit codes, faculty and credits later.</p>
            <form
              className="mt-5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                add(draft);
              }}
            >
              <Label htmlFor="subj" className="sr-only">
                Subject name
              </Label>
              <Input id="subj" className="h-11" placeholder="Subject name" value={draft} onChange={(e) => setDraft(e.target.value)} />
              <Button type="submit" className="h-11" aria-label="Add subject">
                <Plus />
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED.filter((s) => !subjects.includes(s)).map((s) => (
                <button key={s} onClick={() => add(s)} className="min-h-9 rounded-full border px-3 text-xs font-medium hover:bg-muted">
                  + {s}
                </button>
              ))}
            </div>
            <ul className="mt-5 space-y-2">
              {subjects.map((s) => (
                <li key={s} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  {s}
                  <Button size="icon" variant="ghost" aria-label={`Remove ${s}`} onClick={() => setSubjects(subjects.filter((x) => x !== s))}>
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" className="h-11" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="h-11" onClick={() => finish(false)} disabled={busy}>
                {busy && <Loader2 className="animate-spin" />} Finish setup
              </Button>
            </div>
            <div className="mt-6 rounded-lg bg-violet-soft p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-violet">
                <Sparkles className="size-4" aria-hidden /> Just exploring?
              </p>
              <p className="mt-1 text-muted-foreground">
                Load a sample semester (fictional demo data, clearly marked). You can remove it anytime in Settings.
              </p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => finish(true)} disabled={busy}>
                Finish with demo data
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
