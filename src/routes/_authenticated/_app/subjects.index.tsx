import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, Panel, EmptyState, QueryBoundary } from "@/components/app/states";
import { Pill, PctTone, subjectBar } from "@/components/app/badges";
import { FormDialog, useEditor } from "@/components/app/form-dialog";
import { ConfirmDelete } from "@/components/app/confirm";
import { Button } from "@/components/ui/button";
import { useMe, useRemove, useSave, useTable } from "@/lib/data";
import { attendanceStat, effectiveStatus, performanceBySubject, SUBJECT_COLORS, type Subject } from "@/lib/calc";
import { subjectSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/subjects/")({
  head: () => ({ meta: [{ title: "Subjects — CampusFlow" }] }),
  component: Page,
});

export function SubjectForm({ ed }: { ed: ReturnType<typeof useEditor<Subject>> }) {
  const save = useSave("subjects", { success: "Subject saved" });
  return (
    <FormDialog
      open={ed.open}
      onOpenChange={ed.setOpen}
      title={ed.item ? "Edit subject" : "Add subject"}
      schema={subjectSchema}
      initial={{
        name: ed.item?.name ?? "",
        code: ed.item?.code ?? "",
        faculty: ed.item?.faculty ?? "",
        credits: ed.item?.credits ?? "",
        semester: ed.item?.semester ?? "",
        color: ed.item?.color ?? "indigo",
      }}
      fields={[
        { name: "name", label: "Subject name", required: true },
        { name: "code", label: "Code", half: true },
        { name: "faculty", label: "Faculty", half: true },
        { name: "credits", label: "Credits", type: "number", half: true },
        { name: "semester", label: "Semester", type: "number", half: true },
        { name: "color", label: "Colour", type: "select", options: SUBJECT_COLORS.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) })) },
      ]}
      onSubmit={(v) => save.mutateAsync({ ...v, credits: v.credits || null, semester: v.semester || null, id: ed.item?.id })}
    />
  );
}

function Page() {
  const q = useTable("subjects");
  const att = useTable("attendance_records");
  const asg = useTable("assignments");
  const perf = useTable("performance_records");
  const me = useMe();
  const remove = useRemove("subjects", "Subject deleted");
  const ed = useEditor<Subject>();
  const thr = me.data?.profile?.attendance_threshold ?? 75;
  const perfBy = new Map(performanceBySubject(perf.data ?? [], q.data ?? []).map((p) => [p.subject.id, p]));

  return (
    <>
      <PageHeader title="Subjects" actions={<Button onClick={ed.create}><Plus /> Add subject</Button>} />
      <QueryBoundary isLoading={q.isLoading} error={q.error} refetch={q.refetch} what="subjects">
        {(q.data ?? []).length === 0 ? (
          <Panel><EmptyState icon={BookOpen} title="No subjects yet" description="Add the subjects you're taking this semester." action={<Button onClick={ed.create}>Add subject</Button>} /></Panel>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(q.data ?? []).map((s) => {
              const a = attendanceStat((att.data ?? []).filter((r) => r.subject_id === s.id));
              const pending = (asg.data ?? []).filter((x) => x.subject_id === s.id && ["pending", "overdue"].includes(effectiveStatus(x))).length;
              const p = perfBy.get(s.id);
              return (
                <li key={s.id} className="card-surface relative overflow-hidden p-5">
                  <span className={cn("absolute inset-x-0 top-0 h-1", subjectBar(s.color))} aria-hidden />
                  <div className="flex items-start gap-2">
                    <Link to="/subjects/$subjectId" params={{ subjectId: s.id }} className="min-w-0 flex-1 hover:underline">
                      <p className="truncate font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{[s.code, s.faculty, s.credits ? `${s.credits} credits` : null].filter(Boolean).join(" · ") || "—"}</p>
                    </Link>
                    <Button size="icon" variant="ghost" aria-label={`Edit ${s.name}`} onClick={() => ed.edit(s)}><Pencil /></Button>
                    <ConfirmDelete what={`${s.name} and its classes, attendance and marks`} onConfirm={() => remove.mutate(s.id)}>
                      <Button size="icon" variant="ghost" aria-label={`Delete ${s.name}`}><Trash2 /></Button>
                    </ConfirmDelete>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Pill t={PctTone(a.pct, thr)}>Attendance {a.pct === null ? "—" : `${a.pct}%`}</Pill>
                    <Pill t={pending ? "primary" : "neutral"}>{pending} pending</Pill>
                    <Pill t="violet">Avg {p?.avg != null ? `${Math.round(p.avg)}%` : "—"}</Pill>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </QueryBoundary>
      <SubjectForm ed={ed} />
    </>
  );
}
