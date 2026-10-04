import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Circle, Clock, Minus, PlayCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClassStatus, EffectiveStatus } from "@/lib/calc";

const tone = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  violet: "bg-violet-soft text-violet",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-error-soft text-error",
};
export type Tone = keyof typeof tone;

export function Pill({ t = "neutral", children, className }: { t?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold [&_svg]:size-3", tone[t], className)}>
      {children}
    </span>
  );
}

export function PriorityBadge({ p }: { p: "low" | "medium" | "high" }) {
  const map = {
    high: { t: "error" as Tone, I: ArrowUp, l: "High" },
    medium: { t: "warning" as Tone, I: Minus, l: "Medium" },
    low: { t: "neutral" as Tone, I: ArrowDown, l: "Low" },
  }[p];
  return (
    <Pill t={map.t}>
      <map.I aria-hidden /> {map.l}
    </Pill>
  );
}

export function AssignmentStatusBadge({ s }: { s: EffectiveStatus }) {
  const map = {
    pending: { t: "primary" as Tone, I: Circle, l: "Pending" },
    submitted: { t: "violet" as Tone, I: Send, l: "Submitted" },
    completed: { t: "success" as Tone, I: CheckCircle2, l: "Completed" },
    overdue: { t: "error" as Tone, I: AlertCircle, l: "Overdue" },
  }[s];
  return (
    <Pill t={map.t}>
      <map.I aria-hidden /> {map.l}
    </Pill>
  );
}

export function ClassStatusBadge({ s }: { s: ClassStatus }) {
  const map = {
    upcoming: { t: "neutral" as Tone, I: Clock, l: "Upcoming" },
    ongoing: { t: "success" as Tone, I: PlayCircle, l: "Ongoing" },
    completed: { t: "neutral" as Tone, I: CheckCircle2, l: "Completed" },
  }[s];
  return (
    <Pill t={map.t}>
      <map.I aria-hidden /> {map.l}
    </Pill>
  );
}

export function PctTone(p: number | null, threshold = 75): Tone {
  if (p === null) return "neutral";
  if (p >= threshold) return "success";
  if (p >= threshold - 10) return "warning";
  return "error";
}

const swatch: Record<string, string> = {
  indigo: "bg-chart-1",
  violet: "bg-chart-2",
  sky: "bg-chart-3",
  amber: "bg-chart-4",
  emerald: "bg-chart-5",
  rose: "bg-error",
  slate: "bg-muted-foreground",
};
export function SubjectDot({ color, className }: { color?: string | null; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", swatch[color ?? "indigo"] ?? swatch.indigo, className)} />;
}
export const subjectBar = (color?: string | null) => swatch[color ?? "indigo"] ?? swatch.indigo;
