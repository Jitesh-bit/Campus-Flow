import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Plus, Trash2, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, EmptyState, QueryBoundary, StatCard } from "@/components/app/states";
import { FormDialog, useEditor } from "@/components/app/form-dialog";
import { ConfirmDelete } from "@/components/app/confirm";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRemove, useSave, useTable } from "@/lib/data";
import { fmtDate, overallPerformance, pct, performanceBySubject, performanceTrend, toGpa10 } from "@/lib/calc";
import { performanceSchema } from "@/lib/validations";

export const Route = createFileRoute("/_authenticated/_app/performance")({
  head: () => ({ meta: [{ title: "Performance — CampusFlow" }] }),
  component: Page,
});

function Page() {
  const q = useTable("performance_records");
  const subjects = useTable("subjects");
  const save = useSave("performance_records", { success: "Marks saved" });
  const remove = useRemove("performance_records", "Record deleted");
  const ed = useEditor<null>();
  const recs = q.data ?? [];
  const by = performanceBySubject(recs, subjects.data ?? []);
  const overall = overallPerformance(by);
  const sorted = [...by].sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  const bars = by.map((s) => ({ name: s.subject.code || s.subject.name.slice(0, 12), avg: Math.round((s.avg ?? 0) * 10) / 10 }));
  const smap = new Map((subjects.data ?? []).map((s) => [s.id, s]));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader title="Performance" description="Calculated from the marks you record." actions={<Button onClick={ed.create} disabled={!subjects.data?.length}><Plus /> Add marks</Button>} />
      <QueryBoundary isLoading={q.isLoading} error={q.error} refetch={q.refetch} what="performance">
        {recs.length === 0 ? (
          <Panel><EmptyState icon={BarChart3} title="No marks recorded" description="Add quiz, test or assignment scores to see your progress." action={subjects.data?.length ? <Button onClick={ed.create}>Add marks</Button> : undefined} /></Panel>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={BarChart3} label="Overall (credit-weighted)" value={`${overall!.toFixed(1)}%`} hint={`≈ ${toGpa10(overall!).toFixed(2)} / 10 GPA`} />
              <StatCard icon={BarChart3} label="Average score" value={`${(recs.reduce((t, r) => t + pct(r), 0) / recs.length).toFixed(1)}%`} tone="violet" hint={`${recs.length} assessments`} />
              <StatCard icon={Trophy} label="Top subject" value={sorted[0]?.subject.name ?? "—"} tone="success" />
              <StatCard icon={TrendingDown} label="Needs attention" value={sorted.filter((s) => (s.avg ?? 0) < 60).length} tone="warning" hint="Subjects below 60%" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Subject performance">
                <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={bars} margin={{ left: -20 }}><XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" /><Tooltip formatter={(v: number) => `${v}%`} /><Bar dataKey="avg" name="Average" fill="var(--color-primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
              </Panel>
              <Panel title="Trend over time">
                <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={performanceTrend(recs)} margin={{ left: -20 }}><XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" /><Tooltip formatter={(v: number) => `${v}%`} /><Line dataKey="avg" name="Average" stroke="var(--color-violet)" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
              </Panel>
              <Panel title="By subject">
                <ul className="space-y-4">
                  {sorted.map((s) => {
                    const delta = s.prev != null && s.last != null ? s.last - s.prev : null;
                    return (
                      <li key={s.subject.id}>
                        <div className="flex justify-between gap-2 text-sm"><span className="truncate font-medium">{s.subject.name}</span><span className="flex items-center gap-1 font-semibold">{delta !== null && (delta >= 0 ? <TrendingUp className="size-3.5 text-success" aria-label="Improving" /> : <TrendingDown className="size-3.5 text-error" aria-label="Declining" />)}{Math.round(s.avg!)}%</span></div>
                        <Progress value={s.avg ?? 0} className="mt-1.5 h-2" aria-label={`${s.subject.name} average`} />
                        <p className="mt-1 text-xs text-muted-foreground">Latest {Math.round(s.last!)}%{s.prev != null ? ` · previous ${Math.round(s.prev)}%` : ""}</p>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
              <Panel title="All marks">
                <ul className="divide-y">
                  {[...recs].reverse().map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                      <div className="min-w-0 flex-1"><p className="truncate font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{smap.get(r.subject_id)?.name} · {fmtDate(r.assessed_on)}</p></div>
                      <span className="font-semibold tabular-nums">{Number(r.score)}/{Number(r.max_score)}</span>
                      <ConfirmDelete what="this record" onConfirm={() => remove.mutate(r.id)}><Button size="icon" variant="ghost" aria-label="Delete record"><Trash2 /></Button></ConfirmDelete>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        )}
      </QueryBoundary>
      <FormDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title="Add marks"
        schema={performanceSchema}
        initial={{ subject_id: subjects.data?.[0]?.id ?? "", title: "", score: "", max_score: "100", assessed_on: today }}
        fields={[
          { name: "subject_id", label: "Subject", type: "select", options: (subjects.data ?? []).map((s) => ({ value: s.id, label: s.name })) },
          { name: "title", label: "Assessment", required: true, placeholder: "Quiz 1, Midterm…" },
          { name: "score", label: "Score", type: "number", half: true, required: true },
          { name: "max_score", label: "Out of", type: "number", half: true, required: true },
          { name: "assessed_on", label: "Date", type: "date" },
        ]}
        onSubmit={(v) => save.mutateAsync(v)}
      />
    </>
  );
}
