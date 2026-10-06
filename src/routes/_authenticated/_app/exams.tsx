import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, Panel, EmptyState, QueryBoundary } from "@/components/app/states";
import { Pill } from "@/components/app/badges";
import { FormDialog, useEditor } from "@/components/app/form-dialog";
import { ConfirmDelete } from "@/components/app/confirm";
import { Button } from "@/components/ui/button";
import { useRemove, useSave, useTable } from "@/lib/data";
import { countdownLabel, daysUntil, fmtDateTime, toLocalInput, type Exam } from "@/lib/calc";
import { examSchema } from "@/lib/validations";

export const Route = createFileRoute("/_authenticated/_app/exams")({
  head: () => ({ meta: [{ title: "Exams — CampusFlow" }] }),
  component: Page,
});

const TYPES = ["midterm", "final", "quiz", "practical", "viva", "other"];

function Page() {
  const q = useTable("exams");
  const subjects = useTable("subjects");
  const save = useSave("exams", { success: "Exam saved" });
  const remove = useRemove("exams", "Exam deleted");
  const ed = useEditor<Exam>();
  const smap = new Map((subjects.data ?? []).map((s) => [s.id, s]));
  const now = new Date();
  const upcoming = (q.data ?? []).filter((e) => new Date(e.starts_at) >= now);
  const past = (q.data ?? []).filter((e) => new Date(e.starts_at) < now).reverse();
  const next = upcoming[0];

  const row = (e: Exam) => {
    const d = daysUntil(e.starts_at);
    return (
      <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
        <div className="min-w-0 flex-1 basis-56">
          <p className="font-medium">{e.name}</p>
          <p className="text-xs text-muted-foreground">
            <span className="capitalize">{e.exam_type}</span> · {smap.get(e.subject_id ?? "")?.name ?? "—"} · {fmtDateTime(e.starts_at)}
            {e.room ? ` · ${e.room}` : ""}
          </p>
        </div>
        <Pill t={d < 0 ? "neutral" : d <= 3 ? "violet" : "primary"}>{countdownLabel(d)}</Pill>
        <Button size="icon" variant="ghost" aria-label="Edit exam" onClick={() => ed.edit(e)}><Pencil /></Button>
        <ConfirmDelete what="this exam" onConfirm={() => remove.mutate(e.id)}>
          <Button size="icon" variant="ghost" aria-label="Delete exam"><Trash2 /></Button>
        </ConfirmDelete>
      </li>
    );
  };

  return (
    <>
      <PageHeader title="Exams" description="Countdowns to every exam." actions={<Button onClick={ed.create}><Plus /> Add exam</Button>} />
      <QueryBoundary isLoading={q.isLoading} error={q.error} refetch={q.refetch} what="exams">
        {(q.data ?? []).length === 0 ? (
          <Panel><EmptyState icon={CalendarClock} title="No exams yet" description="Add an exam to start the countdown." action={<Button onClick={ed.create}>Add exam</Button>} /></Panel>
        ) : (
          <div className="space-y-6">
            {next && (
              <div className="rounded-2xl bg-brand p-6 text-primary-foreground shadow-pop">
                <p className="text-sm opacity-90">Next exam</p>
                <p className="mt-1 font-display text-2xl font-semibold">{next.name}</p>
                <p className="mt-1 text-sm opacity-90">
                  {smap.get(next.subject_id ?? "")?.name ?? ""} · {fmtDateTime(next.starts_at)}{next.room ? ` · ${next.room}` : ""}
                </p>
                <p className="mt-4 font-display text-4xl font-semibold">{countdownLabel(daysUntil(next.starts_at))}</p>
              </div>
            )}
            {upcoming.length > 0 && <Panel title="Upcoming"><ul className="space-y-2">{upcoming.map(row)}</ul></Panel>}
            {past.length > 0 && <Panel title="Past"><ul className="space-y-2 opacity-80">{past.map(row)}</ul></Panel>}
          </div>
        )}
      </QueryBoundary>
      <FormDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title={ed.item ? "Edit exam" : "Add exam"}
        schema={examSchema}
        initial={{
          name: ed.item?.name ?? "",
          subject_id: ed.item?.subject_id ?? "",
          exam_type: ed.item?.exam_type ?? "quiz",
          starts_at: toLocalInput(ed.item?.starts_at),
          duration_minutes: ed.item?.duration_minutes ?? "",
          room: ed.item?.room ?? "",
        }}
        fields={[
          { name: "name", label: "Exam name", required: true },
          { name: "subject_id", label: "Subject", type: "select", options: [{ value: "", label: "No subject" }, ...(subjects.data ?? []).map((s) => ({ value: s.id, label: s.name }))] },
          { name: "exam_type", label: "Type", type: "select", half: true, options: TYPES.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) })) },
          { name: "starts_at", label: "Date & time", type: "datetime", half: true, required: true },
          { name: "duration_minutes", label: "Duration (min)", type: "number", half: true },
          { name: "room", label: "Location", half: true },
        ]}
        onSubmit={(v) => save.mutateAsync({ ...v, duration_minutes: v.duration_minutes || null, id: ed.item?.id })}
      />
    </>
  );
}
