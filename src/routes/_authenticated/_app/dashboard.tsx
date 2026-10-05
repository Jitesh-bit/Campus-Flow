import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CalendarDays,
  Check,
  ClipboardList,
  ListChecks,
  Megaphone,
  UserCheck,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, StatCard, EmptyState, PageSkeleton, ErrorState } from "@/components/app/states";
import { AssignmentStatusBadge, ClassStatusBadge, Pill, PriorityBadge, PctTone, SubjectDot } from "@/components/app/badges";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMe, useSave, useTable } from "@/lib/data";
import {
  attendanceBySubject,
  attendanceStat,
  classStatus,
  countdownLabel,
  daysUntil,
  effectiveStatus,
  fmtDate,
  fmtDateTime,
  fmtTime,
  greeting,
  overallPerformance,
  performanceBySubject,
  performanceTrend,
  sortByUrgency,
  todaysClasses,
  toGpa10,
  urgency,
  URGENCY_LABEL,
} from "@/lib/calc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CampusFlow" }] }),
  component: Dashboard,
});

function Dashboard() {
  const me = useMe();
  const subjects = useTable("subjects");
  const tt = useTable("timetable_entries");
  const asg = useTable("assignments");
  const exams = useTable("exams");
  const att = useTable("attendance_records");
  const tasks = useTable("tasks");
  const perf = useTable("performance_records");
  const ann = useTable("announcements");
  const reads = useTable("announcement_reads");
  const saveTask = useSave("tasks");

  const all = [subjects, tt, asg, exams, att, tasks, perf];
  const loading = all.some((q) => q.isLoading);
  const failed = all.find((q) => q.error);

  const now = useMemo(() => new Date(), []);
  const subjMap = useMemo(() => new Map((subjects.data ?? []).map((s) => [s.id, s])), [subjects.data]);
  const threshold = me.data?.profile?.attendance_threshold ?? 75;

  const d = useMemo(() => {
    const today = todaysClasses(tt.data ?? [], now);
    const pendingA = (asg.data ?? []).filter((a) => a.status === "pending");
    const overdue = pendingA.filter((a) => new Date(a.due_at) < now);
    const upcomingExams = (exams.data ?? []).filter((e) => new Date(e.starts_at) >= now);
    const pendingTasks = (tasks.data ?? []).filter((t) => !t.completed);
    const doneTasks = (tasks.data ?? []).length - pendingTasks.length;
    const attAll = attendanceStat(att.data ?? []);
    const attSub = attendanceBySubject(att.data ?? [], subjects.data ?? []).filter((s) => s.total);
    const perfSub = performanceBySubject(perf.data ?? [], subjects.data ?? []);
    const overall = overallPerformance(perfSub);
    const trend = performanceTrend(perf.data ?? []);
    return { today, pendingA, overdue, upcomingExams, pendingTasks, doneTasks, attAll, attSub, perfSub, overall, trend };
  }, [tt.data, asg.data, exams.data, tasks.data, att.data, subjects.data, perf.data, now]);

  if (loading) return <PageSkeleton />;
  if (failed) return <ErrorState message="We couldn't load your dashboard. Please try again." onRetry={() => all.forEach((q) => q.refetch())} />;

  const first = (me.data?.profile?.full_name || "").split(" ")[0];
  const readSet = new Set((reads.data ?? []).map((r) => r.announcement_id));
  const attention = [
    ...d.attSub.filter((s) => s.pct !== null && s.pct < threshold).map((s) => `${s.subject.name}: attendance ${s.pct}%`),
    ...d.perfSub.filter((s) => (s.avg ?? 100) < 60).map((s) => `${s.subject.name}: average ${Math.round(s.avg!)}%`),
  ];
  const nextExam = d.upcomingExams[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          {greeting(now)}
          {first ? `, ${first}` : ""} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">Here's what you need to focus on today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Classes today" value={d.today.length} />
        <StatCard
          icon={ClipboardList}
          label="Pending assignments"
          value={d.pendingA.length}
          tone={d.overdue.length ? "error" : "primary"}
          hint={d.overdue.length ? `${d.overdue.length} overdue` : "None overdue"}
        />
        <StatCard
          icon={CalendarClock}
          label="Upcoming exams"
          value={d.upcomingExams.length}
          tone="violet"
          hint={nextExam ? `Next: ${countdownLabel(daysUntil(nextExam.starts_at, now))}` : undefined}
        />
        <StatCard
          icon={UserCheck}
          label="Overall attendance"
          value={d.attAll.pct === null ? "—" : `${d.attAll.pct}%`}
          tone={PctTone(d.attAll.pct, threshold) === "neutral" ? "primary" : (PctTone(d.attAll.pct, threshold) as "success")}
          hint={`${d.pendingTasks.length} tasks pending`}
        />
      </div>

      {attention.length > 0 && (
        <div role="status" className="flex gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="font-semibold">Subjects needing attention</p>
            <p className="text-muted-foreground">{attention.join(" · ")}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Today's classes" icon={CalendarDays} className="lg:col-span-2" action={<Link to="/timetable" className="text-sm font-medium text-primary">Timetable</Link>}>
          {d.today.length === 0 ? (
            <EmptyState compact icon={CalendarDays} title="No classes today" description="Enjoy the free time, or add classes to your timetable." action={<Button size="sm" variant="secondary" asChild><Link to="/timetable">Open timetable</Link></Button>} />
          ) : (
            <ul className="space-y-2">
              {d.today.map((c) => {
                const s = classStatus(c, now);
                const subj = subjMap.get(c.subject_id);
                return (
                  <li
                    key={c.id}
                    className={cn(
                      "flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border p-3",
                      s === "ongoing" && "border-success/40 bg-success-soft",
                      s === "completed" && "opacity-70",
                    )}
                  >
                    <div className="w-28 shrink-0 text-sm font-semibold tabular-nums">
                      {fmtTime(c.start_time)}–{fmtTime(c.end_time)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate font-medium">
                        <SubjectDot color={subj?.color} /> {subj?.name ?? "Class"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[c.room, c.faculty ?? subj?.faculty].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <ClassStatusBadge s={s} />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Attendance" icon={UserCheck} action={<Link to="/attendance" className="text-sm font-medium text-primary">Record</Link>}>
          {d.attAll.total === 0 ? (
            <EmptyState compact icon={UserCheck} title="No attendance recorded" description="Mark classes present or absent to track your percentage." />
          ) : (
            <>
              <div className="flex items-end justify-between">
                <p className="font-display text-4xl font-semibold">{d.attAll.pct}%</p>
                <p className="text-right text-xs text-muted-foreground">
                  {d.attAll.present} attended
                  <br />
                  {d.attAll.absent} missed
                </p>
              </div>
              <Progress value={d.attAll.pct ?? 0} className="mt-3 h-2" aria-label="Overall attendance" />
              <ul className="mt-4 space-y-2.5">
                {d.attSub.slice(0, 5).map((s) => (
                  <li key={s.subject.id} className="text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="truncate">{s.subject.name}</span>
                      <Pill t={PctTone(s.pct, threshold)}>{s.pct}%</Pill>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        <Panel title="Assignments" icon={ClipboardList} className="lg:col-span-2" action={<Link to="/assignments" className="text-sm font-medium text-primary">View all</Link>}>
          {d.pendingA.length === 0 ? (
            <EmptyState compact icon={ClipboardList} title="No pending assignments" description="Add your first assignment to start tracking deadlines." action={<Button size="sm" variant="secondary" asChild><Link to="/assignments">Add assignment</Link></Button>} />
          ) : (
            <ul className="divide-y">
              {sortByUrgency(d.pendingA, now).slice(0, 6).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {subjMap.get(a.subject_id ?? "")?.name ?? "No subject"} · {fmtDateTime(a.due_at)}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{URGENCY_LABEL[urgency(a, now)]}</span>
                  <PriorityBadge p={a.priority} />
                  <AssignmentStatusBadge s={effectiveStatus(a, now)} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Upcoming exams" icon={CalendarClock} action={<Link to="/exams" className="text-sm font-medium text-primary">View all</Link>}>
          {d.upcomingExams.length === 0 ? (
            <EmptyState compact icon={CalendarClock} title="No upcoming exams" />
          ) : (
            <ul className="space-y-2">
              {d.upcomingExams.slice(0, 4).map((e) => {
                const days = daysUntil(e.starts_at, now);
                return (
                  <li key={e.id} className={cn("rounded-lg border p-3", days <= 3 && "border-violet/40 bg-violet-soft")}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate font-medium">{e.name}</p>
                      <Pill t={days <= 3 ? "violet" : "neutral"}>{countdownLabel(days)}</Pill>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {subjMap.get(e.subject_id ?? "")?.name ?? "—"} · {fmtDateTime(e.starts_at)}
                      {e.room ? ` · ${e.room}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Tasks" icon={ListChecks} action={<Link to="/tasks" className="text-sm font-medium text-primary">View all</Link>}>
          <p className="mb-3 text-xs text-muted-foreground">
            {d.doneTasks} of {(tasks.data ?? []).length} completed
          </p>
          {d.pendingTasks.length === 0 ? (
            <EmptyState compact icon={ListChecks} title="You're all caught up" description="Add a task when you have something to work on." />
          ) : (
            <ul className="space-y-1">
              {d.pendingTasks.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-muted">
                  <button
                    aria-label={`Mark "${t.title}" complete`}
                    className="grid size-6 shrink-0 place-items-center rounded-md border-2 border-input hover:border-primary"
                    onClick={() => saveTask.mutate({ id: t.id, completed: true, completed_at: new Date().toISOString() })}
                  >
                    <Check className="size-3.5 opacity-0 hover:opacity-100" aria-hidden />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{t.title}</p>
                    {t.due_at && (
                      <p className={cn("text-xs", new Date(t.due_at) < now ? "text-error" : "text-muted-foreground")}>
                        {new Date(t.due_at) < now ? "Overdue · " : ""}
                        {fmtDate(t.due_at)}
                      </p>
                    )}
                  </div>
                  {t.priority === "high" && <PriorityBadge p="high" />}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Announcements" icon={Megaphone} action={<Link to="/announcements" className="text-sm font-medium text-primary">View all</Link>}>
          {(ann.data ?? []).filter((a) => a.published).length === 0 ? (
            <EmptyState compact icon={Megaphone} title="No announcements yet" />
          ) : (
            <ul className="space-y-2">
              {(ann.data ?? [])
                .filter((a) => a.published)
                .slice(0, 4)
                .map((a) => {
                  const unread = !readSet.has(a.id);
                  return (
                    <li key={a.id} className="flex gap-2">
                      <span aria-label={unread ? "Unread" : "Read"} className={cn("mt-1.5 size-2 shrink-0 rounded-full", unread ? "bg-violet" : "bg-border")} />
                      <div className="min-w-0">
                        <p className={cn("truncate text-sm", unread && "font-semibold")}>{a.title}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {a.category} · {fmtDate(a.published_at ?? a.created_at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </Panel>

        <Panel title="Academic performance" icon={BarChart3} action={<Link to="/performance" className="text-sm font-medium text-primary">Details</Link>}>
          {d.overall === null ? (
            <EmptyState compact icon={BarChart3} title="No marks recorded" description="Add quiz, test or assignment scores to see your progress." />
          ) : (
            <>
              <div className="flex items-end gap-3">
                <p className="font-display text-4xl font-semibold">{d.overall.toFixed(1)}%</p>
                <p className="pb-1 text-sm text-muted-foreground">≈ {toGpa10(d.overall).toFixed(2)} / 10</p>
              </div>
              {d.trend.length > 1 && (
                <div className="mt-3 h-28" aria-label="Performance trend chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={d.trend} margin={{ left: -28, right: 4, top: 4 }}>
                      <defs>
                        <linearGradient id="pg" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-violet)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--color-violet)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <Area dataKey="avg" name="Average" stroke="var(--color-violet)" fill="url(#pg)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
