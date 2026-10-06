import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { NotebookPen, Pencil, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader, Panel, EmptyState, QueryBoundary } from "@/components/app/states";
import { FormDialog, useEditor } from "@/components/app/form-dialog";
import { ConfirmDelete } from "@/components/app/confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRemove, useSave, useTable } from "@/lib/data";
import { fmtDate, type Note } from "@/lib/calc";
import { noteSchema } from "@/lib/validations";

export const Route = createFileRoute("/_authenticated/_app/notes")({
  head: () => ({ meta: [{ title: "Notes — CampusFlow" }] }),
  component: Page,
});

function Page() {
  const q = useTable("notes");
  const subjects = useTable("subjects");
  const save = useSave("notes", { success: "Note saved" });
  const quick = useSave("notes");
  const remove = useRemove("notes", "Note deleted");
  const ed = useEditor<Note>();
  const [s, setS] = useState("");
  const [subj, setSubj] = useState("");
  const smap = new Map((subjects.data ?? []).map((x) => [x.id, x]));
  const list = (q.data ?? [])
    .filter((n) => (!subj || n.subject_id === subj) && (!s || (n.title + n.content).toLowerCase().includes(s.toLowerCase())))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <>
      <PageHeader title="Notes" actions={<Button onClick={ed.create}><Plus /> New note</Button>} />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden />
          <Input aria-label="Search notes" placeholder="Search notes" className="h-10 pl-9" value={s} onChange={(e) => setS(e.target.value)} />
        </div>
        <select aria-label="Filter by subject" className="h-10 rounded-md border bg-card px-3 text-sm" value={subj} onChange={(e) => setSubj(e.target.value)}>
          <option value="">All subjects</option>
          {(subjects.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </div>
      <QueryBoundary isLoading={q.isLoading} error={q.error} refetch={q.refetch} what="notes">
        {list.length === 0 ? (
          <Panel><EmptyState icon={NotebookPen} title="No notes yet" description="Create a note for your next study session." action={<Button onClick={ed.create}>New note</Button>} /></Panel>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((n) => (
              <li key={n.id} className="card-surface flex flex-col p-4">
                <div className="flex items-start gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-semibold">{n.pinned && <Pin className="size-3.5 text-violet" aria-label="Pinned" />}{n.title}</p>
                    <p className="text-xs text-muted-foreground">{smap.get(n.subject_id ?? "")?.name ?? "General"} · Updated {fmtDate(n.updated_at)}</p>
                  </div>
                  <Button size="icon" variant="ghost" aria-label={n.pinned ? "Unpin" : "Pin"} onClick={() => quick.mutate({ id: n.id, pinned: !n.pinned })}>{n.pinned ? <PinOff /> : <Pin />}</Button>
                </div>
                <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-sm text-muted-foreground">{n.content}</p>
                <div className="mt-auto flex justify-end pt-3">
                  <Button size="sm" variant="ghost" onClick={() => ed.edit(n)}><Pencil /> Edit</Button>
                  <ConfirmDelete what="this note" onConfirm={() => remove.mutate(n.id)}>
                    <Button size="sm" variant="ghost" aria-label="Delete note"><Trash2 /></Button>
                  </ConfirmDelete>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
      <FormDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title={ed.item ? "Edit note" : "New note"}
        schema={noteSchema}
        initial={{ title: ed.item?.title ?? "", content: ed.item?.content ?? "", subject_id: ed.item?.subject_id ?? "", pinned: ed.item?.pinned ?? false }}
        fields={[
          { name: "title", label: "Title", required: true },
          { name: "subject_id", label: "Subject", type: "select", options: [{ value: "", label: "General" }, ...(subjects.data ?? []).map((x) => ({ value: x.id, label: x.name }))] },
          { name: "content", label: "Content", type: "textarea", rows: 12 },
          { name: "pinned", label: "Pin this note", type: "switch" },
        ]}
        onSubmit={(v) => save.mutateAsync({ ...v, id: ed.item?.id })}
      />
    </>
  );
}
