import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Pencil } from "lucide-react";
import { Panel, EmptyState, PageSkeleton, StatCard } from "@/components/app/states";
import { AssignmentStatusBadge, Pill } from "@/components/app/badges";
import { useEditor } from "@/components/app/form-dialog";
import { Button } from "@/components/ui/button";
import { useTable } from "@/lib/data";
import { attendanceStat, countdownLabel, daysUntil, DAYS, effectiveStatus, fmtDate, fmtDateTime, fmtTime, pct, type Subject } from "@/lib/calc";
import { SubjectForm } from "./subjects.index";
import { BarChart3, CalendarClock, ClipboardList, UserCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/subjects/$subjectId")({
  head: () => ({ meta: [{ title: "Subject — CampusFlow" }] }),
  component: Page,
});

function Page() {
  const { subjectId } = Route.useParams();
  const subjects = useTable("subjects");
  const tt = useTable("timetable_entries");
  const asg = useTable("assignments");
  const exams = useTable("exams");
  const att = useTable("attendance_records");
  const perf = useTable("performance_records");
  const notes = useTable("notes");
  const ed = useEditor<Subject>();
  if (subjects.isLoading) return <PageSkeleton />;
  const s = subjects.data?.find((x) => x.id === subjectId);
  if (!s)
    return <Panel><EmptyState icon={BookOpen} title="Subject not found" action={<Button asChild><Link to="/subjects">Back to subjects</Link></Button>} /></Panel>;

  const a = attendanceStat((att.data ?? []).filter((r) => r.subject_id === s.id));
  const as = (asg.data ?? []).filter((x) => x.subject_id === s.id);
  const ex = (exams.data ?? []).filter((x) => x.subject_id === s.id);
  const pr = (perf.data ?? []).filter((x) => x.subject_id === s.id);
  const avg = pr.length ? pr.reduce((t, r) => t + pct(r), 0) / pr.length : null;
  const classes = (tt.data ?? []).filter((x) => x.subject_id === s.id);

  return (
    <div className="space-y-6">
      <Link to="/subjects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Subjects</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{s.name}</h1>
          <p className="text-sm text-muted-foreground">{[s.code, s.faculty, s.credits ? `${s.credits} credits` : null, s.semester ? `Semester ${s.semester}` : null].filter(Boolean).join(" · ")}</p>
        </div>
        <Button variant="outline" onClick={() => ed.edit(s)}><Pencil /> Edit</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={UserCheck} label="Attendance" value={a.pct === null ? "—" : `${a.pct}%`} hint={`${a.present}/${a.total}`} />
        <StatCard icon={ClipboardList} label="Assignments" value={as.length} tone="violet" />
        <StatCard icon={CalendarClock} label="Exams" value={ex.length} tone="warning" />
        <StatCard icon={BarChart3} label="Average" value={avg === null ? "—" : `${avg.toFixed(1)}%`} tone="success" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Weekly classes">
          {classes.length ? <ul className="space-y-1 text-sm">{classes.map((c) => <li key={c.id}>{DAYS[c.day_of_week]} · {fmtTime(c.start_time)}–{fmtTime(c.end_time)}{c.room ? ` · ${c.room}` : ""}</li>)}</ul> : <p className="text-sm text-muted-foreground">No classes scheduled.</p>}
        </Panel>
        <Panel title="Exams">
          {ex.length ? <ul className="space-y-2 text-sm">{ex.map((e) => <li key={e.id} className="flex justify-between gap-2"><span>{e.name} · {fmtDateTime(e.starts_at)}</span><Pill>{countdownLabel(daysUntil(e.starts_at))}</Pill></li>)}</ul> : <p className="text-sm text-muted-foreground">No exams.</p>}
        </Panel>
        <Panel title="Assignments">
          {as.length ? <ul className="space-y-2 text-sm">{as.map((x) => <li key={x.id} className="flex justify-between gap-2"><span className="min-w-0 truncate">{x.title} · {fmtDate(x.due_at)}</span><AssignmentStatusBadge s={effectiveStatus(x)} /></li>)}</ul> : <p className="text-sm text-muted-foreground">No assignments.</p>}
        </Panel>
        <Panel title="Marks">
          {pr.length ? <ul className="space-y-2 text-sm">{pr.map((r) => <li key={r.id} className="flex justify-between"><span>{r.title} · {fmtDate(r.assessed_on)}</span><span className="font-semibold">{Number(r.score)}/{Number(r.max_score)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No marks recorded.</p>}
        </Panel>
        <Panel title="Notes" className="lg:col-span-2">
          {(notes.data ?? []).filter((n) => n.subject_id === s.id).map((n) => <p key={n.id} className="text-sm">• {n.title}</p>)}
          {!(notes.data ?? []).some((n) => n.subject_id === s.id) && <p className="text-sm text-muted-foreground">No notes for this subject.</p>}
        </Panel>
      </div>
      <SubjectForm ed={ed} />
    </div>
  );
}
