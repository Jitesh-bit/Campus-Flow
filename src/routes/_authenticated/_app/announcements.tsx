import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, Panel, EmptyState, QueryBoundary } from "@/components/app/states";
import { Pill } from "@/components/app/badges";
import { FormDialog, useEditor } from "@/components/app/form-dialog";
import { ConfirmDelete } from "@/components/app/confirm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useRemove, useSave, useTable } from "@/lib/data";
import { fmtDate, type Announcement } from "@/lib/calc";
import { announcementSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/announcements")({
  head: () => ({ meta: [{ title: "Announcements — CampusFlow" }] }),
  component: Page,
});

function Page() {
  const q = useTable("announcements");
  const reads = useTable("announcement_reads");
  const me = useMe();
  const qc = useQueryClient();
  const isAdmin = !!me.data?.isAdmin;
  const save = useSave("announcements", { success: "Announcement saved" });
  const remove = useRemove("announcements", "Announcement deleted");
  const ed = useEditor<Announcement>();
  const readSet = new Set((reads.data ?? []).map((r) => r.announcement_id));

  async function markRead(id: string) {
    await supabase.from("announcement_reads").insert({ announcement_id: id });
    qc.invalidateQueries({ queryKey: ["table", "announcement_reads"] });
  }

  return (
    <>
      <PageHeader title="Announcements" description="College, course, academic and event updates." actions={isAdmin && <Button onClick={ed.create}><Plus /> New announcement</Button>} />
      <QueryBoundary isLoading={q.isLoading} error={q.error} refetch={q.refetch} what="announcements">
        {(q.data ?? []).length === 0 ? (
          <Panel><EmptyState icon={Megaphone} title="No announcements yet" description="Announcements from your institution will appear here." /></Panel>
        ) : (
          <ul className="space-y-3">
            {(q.data ?? []).map((a) => {
              const unread = a.published && !readSet.has(a.id);
              return (
                <li key={a.id} className={cn("card-surface p-4", unread && "border-violet/40")}>
                  <div className="flex flex-wrap items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-base", unread ? "font-semibold" : "font-medium")}>{a.title}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Pill t="primary" className="capitalize">{a.category}</Pill>
                        <span>{fmtDate(a.published_at ?? a.created_at)}</span>
                        {!a.published && <Pill t="warning">Draft</Pill>}
                        {unread && <Pill t="violet">Unread</Pill>}
                      </div>
                    </div>
                    {unread && <Button size="sm" variant="outline" onClick={() => markRead(a.id)}><Check /> Mark read</Button>}
                    {isAdmin && (
                      <>
                        <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => ed.edit(a)}><Pencil /></Button>
                        <ConfirmDelete what="this announcement" onConfirm={() => remove.mutate(a.id)}><Button size="icon" variant="ghost" aria-label="Delete"><Trash2 /></Button></ConfirmDelete>
                      </>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
                </li>
              );
            })}
          </ul>
        )}
      </QueryBoundary>
      {isAdmin && (
        <FormDialog
          open={ed.open}
          onOpenChange={ed.setOpen}
          title={ed.item ? "Edit announcement" : "New announcement"}
          schema={announcementSchema}
          initial={{ title: ed.item?.title ?? "", body: ed.item?.body ?? "", category: ed.item?.category ?? "college", published: ed.item?.published ?? true }}
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "category", label: "Category", type: "select", options: ["college", "course", "academic", "event"].map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) })) },
            { name: "body", label: "Message", type: "textarea", required: true, rows: 6 },
            { name: "published", label: "Publish now", type: "switch" },
          ]}
          onSubmit={(v) => save.mutateAsync({ ...v, id: ed.item?.id })}
        />
      )}
    </>
  );
}
