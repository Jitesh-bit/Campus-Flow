import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/data";
import { passwordSchema, profileSchema } from "@/lib/validations";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — CampusFlow" }] }),
  component: Page,
});

const FIELDS = [
  ["full_name", "Full name"],
  ["college", "College / university"],
  ["program", "Course / program"],
  ["semester", "Current semester"],
  ["academic_year", "Academic year"],
  ["avatar_url", "Profile image URL"],
  ["attendance_threshold", "Attendance warning threshold (%)"],
] as const;

function Page() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [f, setF] = useState<Record<string, string>>({});
  const [err, setErr] = useState<Record<string, string>>({});
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");

  useEffect(() => {
    const p = me?.profile;
    if (p) setF(Object.fromEntries(FIELDS.map(([k]) => [k, p[k] == null ? "" : String(p[k])])));
  }, [me?.profile]);

  async function saveProfile() {
    const r = profileSchema.safeParse({ ...f, semester: f.semester || null });
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach((i) => (e[String(i.path[0])] ??= i.message));
      return setErr(e);
    }
    setErr({});
    const { error } = await supabase.from("profiles").update(r.data).eq("id", me!.user.id);
    if (error) return toast.error("We couldn't save your settings.");
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  async function changePw() {
    const r = passwordSchema.safeParse(pw);
    if (!r.success) return toast.error(r.error.issues[0].message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as any);
    if (error) return toast.error("Couldn't change password. Check your current password.");
    setPw("");
    setCur("");
    toast.success("Password updated");
  }

  async function demo(action: "seed_my_demo_data" | "clear_my_demo_data") {
    const { error } = await supabase.rpc(action);
    if (error) return toast.error("Something went wrong.");
    await qc.invalidateQueries();
    toast.success(action === "seed_my_demo_data" ? "Demo data loaded" : "Demo data removed");
  }

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Profile" className="lg:row-span-2">
          <p className="mb-4 text-sm text-muted-foreground">{me?.user.email}</p>
          <div className="grid gap-4">
            {FIELDS.map(([k, l]) => (
              <div key={k}>
                <Label htmlFor={k}>{l}</Label>
                <Input id={k} className="mt-1.5 h-11" value={f[k] ?? ""} aria-invalid={!!err[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
                {err[k] && <p role="alert" className="mt-1 text-xs text-error">{err[k]}</p>}
              </div>
            ))}
            <Button onClick={saveProfile}>Save changes</Button>
          </div>
        </Panel>
        <Panel title="Change password">
          <div className="grid gap-3">
            <div><Label htmlFor="cur">Current password</Label><Input id="cur" type="password" autoComplete="current-password" className="mt-1.5 h-11" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
            <div><Label htmlFor="npw">New password</Label><Input id="npw" type="password" autoComplete="new-password" className="mt-1.5 h-11" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <Button variant="outline" onClick={changePw}>Update password</Button>
          </div>
        </Panel>
        <Panel title="Demo data">
          <p className="text-sm text-muted-foreground">Sample fictional semester data, kept separate from your own records.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => demo("seed_my_demo_data")}>Load demo data</Button>
            <Button variant="outline" onClick={() => demo("clear_my_demo_data")}>Remove demo data</Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
