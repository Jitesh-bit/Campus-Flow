// Pure dashboard calculations derived from source records. Nothing here is stored.
import type { Tables } from "@/integrations/supabase/types";

export type Subject = Tables<"subjects">;
export type TimetableEntry = Tables<"timetable_entries">;
export type Assignment = Tables<"assignments">;
export type Exam = Tables<"exams">;
export type AttendanceRecord = Tables<"attendance_records">;
export type Task = Tables<"tasks">;
export type Note = Tables<"notes">;
export type PerformanceRecord = Tables<"performance_records">;
export type Announcement = Tables<"announcements">;
export type AppNotification = Tables<"notifications">;
export type Profile = Tables<"profiles">;

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DAY_MS = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function daysUntil(iso: string, now = new Date()) {
  return Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

export function countdownLabel(days: number) {
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

// ---------- Timetable ----------
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};
export type ClassStatus = "upcoming" | "ongoing" | "completed";
export function classStatus(e: Pick<TimetableEntry, "start_time" | "end_time">, now = new Date()): ClassStatus {
  const m = now.getHours() * 60 + now.getMinutes();
  if (m < toMinutes(e.start_time)) return "upcoming";
  if (m < toMinutes(e.end_time)) return "ongoing";
  return "completed";
}
export function todaysClasses(entries: TimetableEntry[], now = new Date()) {
  return entries
    .filter((e) => e.day_of_week === now.getDay())
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}
export function overlaps(a: { start_time: string; end_time: string }, b: { start_time: string; end_time: string }) {
  return toMinutes(a.start_time) < toMinutes(b.end_time) && toMinutes(b.start_time) < toMinutes(a.end_time);
}

// ---------- Assignments ----------
export type EffectiveStatus = "pending" | "submitted" | "completed" | "overdue";
export function effectiveStatus(a: Pick<Assignment, "status" | "due_at">, now = new Date()): EffectiveStatus {
  if (a.status === "pending" && new Date(a.due_at) < now) return "overdue";
  return a.status;
}
export type Urgency = "overdue" | "today" | "tomorrow" | "week" | "upcoming" | "done";
export function urgency(a: Pick<Assignment, "status" | "due_at">, now = new Date()): Urgency {
  if (a.status !== "pending") return "done";
  if (new Date(a.due_at) < now) return "overdue";
  const d = daysUntil(a.due_at, now);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d <= 7) return "week";
  return "upcoming";
}
export const URGENCY_LABEL: Record<Urgency, string> = {
  overdue: "Overdue",
  today: "Due today",
  tomorrow: "Due tomorrow",
  week: "This week",
  upcoming: "Upcoming",
  done: "Done",
};
const PRIO = { high: 0, medium: 1, low: 2 } as const;
export function sortByUrgency<T extends Pick<Assignment, "status" | "due_at" | "priority">>(list: T[], now = new Date()) {
  const rank = (a: T) => (a.status === "pending" ? (new Date(a.due_at) < now ? 0 : 1) : 2);
  return [...list].sort(
    (a, b) => rank(a) - rank(b) || a.due_at.localeCompare(b.due_at) || PRIO[a.priority] - PRIO[b.priority],
  );
}

// ---------- Tasks ----------
export type TaskFilter = "all" | "today" | "upcoming" | "overdue" | "completed" | "high";
export function matchTask(t: Task, f: TaskFilter, now = new Date()) {
  switch (f) {
    case "all":
      return true;
    case "completed":
      return t.completed;
    case "high":
      return !t.completed && t.priority === "high";
    case "overdue":
      return !t.completed && !!t.due_at && new Date(t.due_at) < now;
    case "today":
      return !t.completed && !!t.due_at && daysUntil(t.due_at, now) === 0;
    case "upcoming":
      return !t.completed && (!t.due_at || new Date(t.due_at) >= now);
  }
}

// ---------- Attendance ----------
export type AttendanceStat = { present: number; absent: number; total: number; pct: number | null };
export function attendanceStat(records: Pick<AttendanceRecord, "status">[]): AttendanceStat {
  const present = records.filter((r) => r.status === "present").length;
  const total = records.length;
  return { present, absent: total - present, total, pct: total ? Math.round((present / total) * 1000) / 10 : null };
}
export function attendanceBySubject(records: AttendanceRecord[], subjects: Subject[]) {
  return subjects.map((s) => ({ subject: s, ...attendanceStat(records.filter((r) => r.subject_id === s.id)) }));
}
/** Monthly attendance % for trend charts. */
export function attendanceTrend(records: AttendanceRecord[]) {
  const map = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const k = r.date.slice(0, 7);
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, rs]) => ({ label: monthLabel(k), pct: attendanceStat(rs).pct ?? 0 }));
}
/** Classes you can still miss (or must attend) to stay at threshold. */
export function attendanceBuffer(s: AttendanceStat, threshold: number) {
  if (!s.total) return null;
  const t = threshold / 100;
  if (s.present / s.total >= t) return { canMiss: Math.floor(s.present / t - s.total), mustAttend: 0 };
  return { canMiss: 0, mustAttend: Math.ceil((t * s.total - s.present) / (1 - t)) };
}

// ---------- Performance ----------
export const pct = (r: Pick<PerformanceRecord, "score" | "max_score">) => (Number(r.score) / Number(r.max_score)) * 100;
export function performanceBySubject(records: PerformanceRecord[], subjects: Subject[]) {
  return subjects
    .map((s) => {
      const rs = records.filter((r) => r.subject_id === s.id).sort((a, b) => a.assessed_on.localeCompare(b.assessed_on));
      const avg = rs.length ? rs.reduce((a, r) => a + pct(r), 0) / rs.length : null;
      const last = rs.length ? pct(rs[rs.length - 1]) : null;
      const prev = rs.length > 1 ? pct(rs[rs.length - 2]) : null;
      return { subject: s, count: rs.length, avg, last, prev };
    })
    .filter((x) => x.count > 0);
}
/** Overall % weighted by subject credits (falls back to equal weight). */
export function overallPerformance(bySubject: ReturnType<typeof performanceBySubject>) {
  if (!bySubject.length) return null;
  let w = 0;
  let sum = 0;
  for (const s of bySubject) {
    const weight = Number(s.subject.credits) || 1;
    w += weight;
    sum += (s.avg ?? 0) * weight;
  }
  return sum / w;
}
/** Approximate 10-point GPA from a percentage. */
export const toGpa10 = (p: number) => Math.min(10, Math.round((p / 10) * 100) / 100);
export function performanceTrend(records: PerformanceRecord[]) {
  const map = new Map<string, number[]>();
  for (const r of records) {
    const k = r.assessed_on.slice(0, 7);
    map.set(k, [...(map.get(k) ?? []), pct(r)]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({ label: monthLabel(k), avg: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 }));
}

function monthLabel(k: string) {
  const [y, m] = k.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString([], { month: "short", year: "2-digit" });
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Convert ISO to value for <input type="datetime-local"> in local time. */
export function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export const SUBJECT_COLORS = ["indigo", "violet", "sky", "emerald", "amber", "rose", "slate"] as const;
