import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, ListChecks, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { PageHeader, Panel, EmptyState, QueryBoundary } from "@/components/app/states";
import { Pill, PriorityBadge } from "@/components/app/badges";
import { FormDialog, useEditor } from "@/components/app/form-dialog";
import { ConfirmDelete } from "@/components/app/confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRemove, useSave, useTable } from "@/lib/data";
import { fmtDateTime, matchTask, toLocalInput, type Task, type TaskFilter } from "@/lib/calc";
import { taskSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/tasks")({
  head: () => ({ meta: [{ title: "Tasks — CampusFlow" }] }),
  component: Page,
});

const FILTERS: [TaskFilter, string][] = [["all", "All"], ["today", "Today"], ["upcoming", "Upcoming"], ["overdue", "Overdue"], ["high", "High priority"], ["completed", "Completed"]];
const PR = { high: 0, medium: 1, low: 2 };

function Page() {
  const q = useTable("tasks");
  const save = useSave("tasks", { success: "Task saved" });
  const quick = useSave("tasks");
  const remove = useRemove("tasks", "Task deleted");
  const ed = useEditor<Task>();
  const [f, setF] = useState<TaskFilter>("upcoming");
  const [s, setS] = useState("");
  const [sort, setSort] = useState<"due" | "priority" | "created">("due");
  const now = new Date();
  const list = useMemo(() => {
    const l = (q.data ?? []).filter((t) => matchTask(t, f) && (!s || t.title.toLowerCase().includes(s.toLowerCase())));
    return l.sort((a, b) =>
      sort === "priority" ? PR[a.priority] - PR[b.priority] : sort === "created" ? b.created_at.localeCompare(a.created_at) : (a.due_at ?? "9").localeCompare(b.due_at ?? "9"),
    );
  }, [q.data, f, s, sort]);

  return (
    <>
      <PageHeader title="Tasks" actions={<Button onClick={ed.create}><Plus /> Add task</Button>} />
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter tasks">
        {FILTERS.map(([k, l]) => (
          <Button key={k} size="sm" variant={f === k ? "default" : "outline"} aria-pressed={f === k} onClick={() => setF(k)}>{l}</Button>
        ))}
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden />
          <Input aria-label="Search tasks" placeholder="Search tasks" className="h-10 pl-9" value={s} onChange={(e) => setS(e.target.value)} />
        </div>
        <select aria-label="Sort tasks" className="h-10 rounded-md border bg-card px-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value as "due")}>
          <option value="due">Sort by due date</option>
          <option value="priority">Sort by priority</option>
          <option value="created">Newest first</option>
        </select>
      </div>
      <QueryBoundary isLoading={q.isLoading} error={q.error} refetch={q.refetch} what="tasks">
        <Panel>
          {list.length === 0 ? (
            <EmptyState icon={ListChecks} title="You're all caught up" description="Add a task when you have something to work on." action={<Button onClick={ed.create}>Add task</Button>} />
          ) : (
            <ul className="divide-y">
              {list.map((t) => {
                const overdue = !t.completed && t.due_at && new Date(t.due_at) < now;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <Button
                      size="icon"
                      variant={t.completed ? "default" : "outline"}
                      aria-label={t.completed ? `Reopen "${t.title}"` : `Complete "${t.title}"`}
                      onClick={() => quick.mutate({ id: t.id, completed: !t.completed, completed_at: t.completed ? null : new Date().toISOString() })}
                    >
                      {t.completed ? <RotateCcw /> : <Check />}
                    </Button>
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-medium", t.completed && "text-muted-foreground line-through")}>{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.category && `${t.category} · `}
                        {t.due_at ? <span className={overdue ? "font-semibold text-error" : ""}>{overdue ? "Overdue · " : ""}{fmtDateTime(t.due_at)}</span> : "No due date"}
                      </p>
                    </div>
                    <PriorityBadge p={t.priority} />
                    {t.completed && <Pill t="success">Done</Pill>}
                    <Button size="icon" variant="ghost" aria-label="Edit task" onClick={() => ed.edit(t)}><Pencil /></Button>
                    <ConfirmDelete what="this task" onConfirm={() => remove.mutate(t.id)}>
                      <Button size="icon" variant="ghost" aria-label="Delete task"><Trash2 /></Button>
                    </ConfirmDelete>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </QueryBoundary>
      <FormDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title={ed.item ? "Edit task" : "Add task"}
        schema={taskSchema}
        initial={{ title: ed.item?.title ?? "", description: ed.item?.description ?? "", due_at: toLocalInput(ed.item?.due_at), priority: ed.item?.priority ?? "medium", category: ed.item?.category ?? "" }}
        fields={[
          { name: "title", label: "Title", required: true },
          { name: "due_at", label: "Due", type: "datetime", half: true },
          { name: "priority", label: "Priority", type: "select", half: true, options: ["low", "medium", "high"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
          { name: "category", label: "Category", placeholder: "Study, Personal…" },
          { name: "description", label: "Description", type: "textarea" },
        ]}
        onSubmit={(v) => save.mutateAsync({ ...v, id: ed.item?.id })}
      />
    </>
  );
}
