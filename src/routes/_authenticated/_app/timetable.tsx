import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, Panel, EmptyState, QueryBoundary } from "@/components/app/states";
import { ClassStatusBadge, SubjectDot } from "@/components/app/badges";
import { FormDialog, useEditor } from "@/components/app/form-dialog";
import { ConfirmDelete } from "@/components/app/confirm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRemove, useSave, useTable } from "@/lib/data";
import { classStatus, DAYS, fmtTime, overlaps, type TimetableEntry } from "@/lib/calc";
import { timetableSchema } from "@/lib/validations";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/timetable")({
  head: () => ({ meta: [{ title: "Timetable — CampusFlow" }] }),
  component: Page,
});

function Page() {
  const q = useTable("timetable_entries");
  const subjects = useTable("subjects");
  const save = useSave("timetable_entries", { success: "Class saved" });
  const remove = useRemove("timetable_entries", "Class deleted");
  const ed = useEditor<TimetableEntry>();
  const [view, setView] = useState<"week" | "day">("week");
  const [day, setDay] = useState(new Date().getDay());
  const smap = new Map((subjects.data ?? []).map((s) => [s.id, s]));
  const today = new Date().getDay();
  const entries = q.data ?? [];
  const days = view === "week" ? [1, 2, 3, 4, 5, 6, 0] : [day];

  return (
    <>
      <PageHeader
        title="Timetable"
        description="Your weekly class schedule."
        actions={
          <Button onClick={ed.create} disabled={!subjects.data?.length}>
            <Plus /> Add class
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as "week")}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
          </TabsList>
        </Tabs>
        {view === "day" && (
          <select aria-label="Day" className="h-10 rounded-md border bg-card px-3 text-sm" value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
                {i === today ? " (today)" : ""}
              </option>
            ))}
          </select>
        )}
      </div>
      <QueryBoundary isLoading={q.isLoading} error={q.error} refetch={q.refetch} what="timetable">
        {entries.length === 0 ? (
          <Panel>
            <EmptyState
              icon={CalendarDays}
              title="Your timetable is empty"
              description={subjects.data?.length ? "Add your first class." : "Add a subject first, then add classes."}
              action={subjects.data?.length ? <Button onClick={ed.create}>Add class</Button> : undefined}
            />
          </Panel>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {days.map((d) => {
              const list = entries.filter((e) => e.day_of_week === d);
              return (
                <Panel key={d} title={DAYS[d] + (d === today ? " · Today" : "")} className={d === today ? "border-primary/40" : ""}>
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No classes.</p>
                  ) : (
                    <ul className="space-y-2">
                      {list.map((e) => {
                        const s = smap.get(e.subject_id);
                        return (
                          <li key={e.id} className="flex items-center gap-2 rounded-lg border p-3">
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center gap-2 truncate font-medium">
                                <SubjectDot color={s?.color} /> {s?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {fmtTime(e.start_time)}–{fmtTime(e.end_time)}
                                {e.room ? ` · ${e.room}` : ""}
                                {e.faculty ? ` · ${e.faculty}` : ""}
                              </p>
                              {d === today && <div className="mt-1"><ClassStatusBadge s={classStatus(e)} /></div>}
                            </div>
                            <Button size="icon" variant="ghost" aria-label="Edit class" onClick={() => ed.edit(e)}>
                              <Pencil />
                            </Button>
                            <ConfirmDelete what="this class" onConfirm={() => remove.mutate(e.id)}>
                              <Button size="icon" variant="ghost" aria-label="Delete class">
                                <Trash2 />
                              </Button>
                            </ConfirmDelete>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Panel>
              );
            })}
          </div>
        )}
      </QueryBoundary>
      <FormDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title={ed.item ? "Edit class" : "Add class"}
        schema={timetableSchema}
        initial={{
          subject_id: ed.item?.subject_id ?? subjects.data?.[0]?.id ?? "",
          day_of_week: String(ed.item?.day_of_week ?? (view === "day" ? day : 1)),
          start_time: ed.item?.start_time.slice(0, 5) ?? "09:00",
          end_time: ed.item?.end_time.slice(0, 5) ?? "10:00",
          room: ed.item?.room ?? "",
          faculty: ed.item?.faculty ?? "",
        }}
        fields={[
          { name: "subject_id", label: "Subject", type: "select", required: true, options: (subjects.data ?? []).map((s) => ({ value: s.id, label: s.name })) },
          { name: "day_of_week", label: "Day", type: "select", options: DAYS.map((d, i) => ({ value: String(i), label: d })) },
          { name: "start_time", label: "Start", type: "time", half: true, required: true },
          { name: "end_time", label: "End", type: "time", half: true, required: true },
          { name: "room", label: "Room", half: true },
          { name: "faculty", label: "Faculty", half: true },
        ]}
        onSubmit={async (v) => {
          const clash = entries.find(
            (e) => e.id !== ed.item?.id && e.day_of_week === v.day_of_week && overlaps(e, v as { start_time: string; end_time: string }),
          );
          if (clash) {
            toast.error("This class overlaps with another class on the same day.");
            throw new Error("overlap");
          }
          return save.mutateAsync({ ...v, id: ed.item?.id });
        }}
      />
    </>
  );
}
