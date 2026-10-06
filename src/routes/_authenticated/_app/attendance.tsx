import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check, Trash2, UserCheck, X } from "lucide-react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, EmptyState, QueryBoundary, StatCard } from "@/components/app/states";
import { Pill, PctTone } from "@/components/app/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useMe, useRemove, useSave, useTable } from "@/lib/data";
import { attendanceBuffer, attendanceBySubject, attendanceStat, attendanceTrend, fmtDate } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/_app/attendance")({
  head: () => ({ meta: [{ title: "Attendance — CampusFlow" }] }),
  component: Page,
});

function Page() {
  const q = useTable("attendance_records");
  const subjects = useTable("subjects");
  const me = useMe();
  const save = useSave("attendance_records", { success: "Attendance recorded" });
  const remove = useRemove("attendance_records", "Record removed");
  const threshold = me.data?.profile?.attendance_threshold ?? 75;
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const records = q.data ?? [];
  const overall = attendanceStat(records);
  const by = attendanceBySubject(records, subjects.data ?? []);
  const trend = attendanceTrend(records);
  const smap = new Map((subjects.data ?? []).map((s) => [s.id, s]));

  return (
    <>
      <PageHeader title="Attendance" description={`Warning threshold: ${threshold}% (change in Settings).`} />
      <QueryBoundary isLoading={q.isLoading || subjects.isLoading} error={q.error} refetch={q.refetch} what="attendance">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={UserCheck} label="Overall" value={overall.pct === null ? "—" : `${overall.pct}%`} tone={overall.pct !== null && overall.pct < threshold ? "error" : "success"} />
            <StatCard icon={Check} label="Attended" value={overall.present} tone="success" />
            <StatCard icon={X} label="Missed" value={overall.absent} tone="error" />
            <StatCard icon={UserCheck} label="Total classes" value={overall.total} />
          </div>

          <Panel title="Record attendance">
            <div className="mb-4 max-w-xs">
              <Label htmlFor="att-date">Date</Label>
              <Input id="att-date" type="date" className="mt-1.5 h-11" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
            </div>
            {(subjects.data ?? []).length === 0 ? (
              <EmptyState compact icon={UserCheck} title="Add subjects first" />
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {(subjects.data ?? []).map((s) => {
                  const existing = records.find((r) => r.subject_id === s.id && r.date === date);
                  return (
                    <li key={s.id} className="flex items-center gap-2 rounded-lg border p-2 pl-3">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</span>
                      {(["present", "absent"] as const).map((st) => (
                        <Button
                          key={st}
                          size="sm"
                          variant={existing?.status === st ? (st === "present" ? "default" : "destructive") : "outline"}
                          aria-pressed={existing?.status === st}
                          onClick={() => save.mutate({ id: existing?.id, subject_id: s.id, date, status: st })}
                        >
                          {st === "present" ? <Check /> : <X />} {st === "present" ? "Present" : "Absent"}
                        </Button>
                      ))}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {overall.total === 0 ? (
            <Panel><EmptyState icon={UserCheck} title="No attendance recorded yet" description="Mark your classes above to see percentages." /></Panel>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="By subject">
                <ul className="space-y-4">
                  {by.filter((s) => s.total).map((s) => {
                    const buf = attendanceBuffer(s, threshold);
                    const low = (s.pct ?? 0) < threshold;
                    return (
                      <li key={s.subject.id}>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{s.subject.name}</span>
                          <Pill t={PctTone(s.pct, threshold)}>{low && <AlertTriangle aria-hidden />}{s.pct}%</Pill>
                        </div>
                        <Progress value={s.pct ?? 0} className="mt-1.5 h-2" aria-label={`${s.subject.name} attendance`} />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s.present}/{s.total} attended ·{" "}
                          {buf && (low ? `Attend the next ${buf.mustAttend} to reach ${threshold}%` : `You can miss ${buf.canMiss} and stay above ${threshold}%`)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
              <Panel title="Monthly trend">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <ReferenceLine y={threshold} stroke="var(--color-warning)" strokeDasharray="4 4" />
                      <Line dataKey="pct" name="Attendance" stroke="var(--color-primary)" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel title="Recent records" className="lg:col-span-2">
                <ul className="divide-y">
                  {records.slice(0, 20).map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className="w-28 shrink-0 text-muted-foreground">{fmtDate(r.date)}</span>
                      <span className="min-w-0 flex-1 truncate">{smap.get(r.subject_id)?.name}</span>
                      <Pill t={r.status === "present" ? "success" : "error"}>{r.status === "present" ? <Check /> : <X />}{r.status}</Pill>
                      <Button size="icon" variant="ghost" aria-label="Delete record" onClick={() => remove.mutate(r.id)}><Trash2 /></Button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}
        </div>
      </QueryBoundary>
    </>
  );
}
