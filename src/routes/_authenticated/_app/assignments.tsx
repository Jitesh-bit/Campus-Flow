import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, ClipboardList, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import { PageHeader, Panel, EmptyState, QueryBoundary } from "@/components/app/states";
import { AssignmentStatusBadge, PriorityBadge } from "@/components/app/badges";
import { FormDialog, useEditor } from "@/components/app/form-dialog";
import { ConfirmDelete } from "@/components/app/confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRemove, useSave, useTable } from "@/lib/data";
import { effectiveStatus, fmtDateTime, sortByUrgency, toLocalInput, urgency, URGENCY_LABEL, type Assignment } from "@/lib/calc";
import { assignmentSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/assignments")({
  head: () => ({ meta: [{ title: "Assignments — CampusFlow" }] }),
  component: Page,
});

function Page() {
  const q = useTable("assignments");
  const subjects = useTable("subjects");
  const save = useSave("assignments", { success: "Assignment saved" });
  const quick = useSave("assignments");
  const remove = useRemove("assignments", "Assignment deleted");
  const ed = useEditor<Assignment>();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("");
  const smap = new Map((subjects.data ?? []).map((s) => [s.id, s]));

  const list = useMemo(() => {
    const s = search.toLowerCase();
    return sortByUrgency(
      (q.data ?? []).filter(
        (a) =>
          (!s || a.title.toLowerCase().includes(s)) &&
          (!subject || a.subject_id === subject) &&
          (!status || effectiveStatus(a) === status),
      ),
    );
  }, [q.data, search, subject, status]);
  const overdue = list.filter((a) => effectiveStatus(a) === "overdue");
  const rest = list.filter((a) => effectiveStatus(a) !== "overdue");

  const row = (a: Assignment) => {
    const st = effectiveStatus(a);
    return (
      <li key={a.id} className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-3", st === "overdue" && "border-error/30 bg-error-soft")}>
        <div className="min-w-0 flex-1 basis-56">
          <p className="font-medium">{a.title}</p>
          <p className="text-xs text-muted-foreground">
            {smap.get(a.subject_id ?? "")?.name ?? "No subject"} · {fmtDateTime(a.due_at)} · {URGENCY_LABEL[urgency(a)]}
          </p>
        </div>
        <PriorityBadge p={a.priority} />
        <AssignmentStatusBadge s={st} />
        <div className="flex">
          {a.status === "pending" && (
            <Button size="icon" variant="ghost" aria-label="Mark submitted" onClick={() => quick.mutate({ id: a.id, status: "submitted" })}>
              <Send />
            </Button>
          )}
          {a.status !== "completed" && (
            <Button size="icon" variant="ghost" aria-label="Mark complete" onClick={() => quick.mutate({ id: a.id, status: "completed" })}>
              <Check />
            </Button>
          )}
          <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => ed.edit(a)}>
            <Pencil />
          </Button>
          <ConfirmDelete what="this assignment" onConfirm={() => remove.mutate(a.id)}>
            <Button size="icon" variant="ghost" aria-label="Delete">
              <Trash2 />
            </Button>
          </ConfirmDelete>
        </div>
      </li>
    );
  };

  return (
    <>
      <PageHeader title="Assignments" description="Sorted by urgency." actions={<Button onClick={ed.create}><Plus /> Add assignment</Button>} />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden />
          <Input aria-label="Search assignments" placeholder="Search assignments" className="h-10 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select aria-label="Filter by subject" className="h-10 rounded-md border bg-card px-3 text-sm" value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">All subjects</option>
          {(subjects.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select aria-label="Filter by status" className="h-10 rounded-md border bg-card px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="submitted">Submitted</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <QueryBoundary isLoading={q.isLoading} error={q.error} refetch={q.refetch} what="assignments">
        {(q.data ?? []).length === 0 ? (
          <Panel><EmptyState icon={ClipboardList} title="No assignments yet" description="Add your first assignment to start tracking deadlines." action={<Button onClick={ed.create}>Add assignment</Button>} /></Panel>
        ) : list.length === 0 ? (
          <Panel><EmptyState icon={Search} title="No matches" description="Try a different search or filter." /></Panel>
        ) : (
          <div className="space-y-6">
            {overdue.length > 0 && <Panel title={`Overdue (${overdue.length})`}><ul className="space-y-2">{overdue.map(row)}</ul></Panel>}
            {rest.length > 0 && <Panel title="All assignments"><ul className="space-y-2">{rest.map(row)}</ul></Panel>}
          </div>
        )}
      </QueryBoundary>
      <FormDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title={ed.item ? "Edit assignment" : "Add assignment"}
        schema={assignmentSchema}
        initial={{
          title: ed.item?.title ?? "",
          subject_id: ed.item?.subject_id ?? "",
          description: ed.item?.description ?? "",
          due_at: toLocalInput(ed.item?.due_at),
          priority: ed.item?.priority ?? "medium",
          status: ed.item?.status ?? "pending",
        }}
        fields={[
          { name: "title", label: "Title", required: true },
          { name: "subject_id", label: "Subject", type: "select", options: [{ value: "", label: "No subject" }, ...(subjects.data ?? []).map((s) => ({ value: s.id, label: s.name }))] },
          { name: "due_at", label: "Due", type: "datetime", required: true },
          { name: "priority", label: "Priority", type: "select", half: true, options: ["low", "medium", "high"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
          { name: "status", label: "Status", type: "select", half: true, options: ["pending", "submitted", "completed"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
          { name: "description", label: "Description", type: "textarea" },
        ]}
        onSubmit={(v) => save.mutateAsync({ ...v, id: ed.item?.id })}
      />
    </>
  );
}
