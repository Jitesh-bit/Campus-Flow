import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Hit = { id: string; label: string; to: string; params?: Record<string, string> };
type Group = { group: string; hits: Hit[] };

function useDebounced<T>(v: T, ms = 250) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

async function runSearch(q: string): Promise<Group[]> {
  const term = `%${q.replace(/[%_\\]/g, (c) => "\\" + c)}%`;
  const [a, e, t, s, n, an] = await Promise.all([
    supabase.from("assignments").select("id,title").ilike("title", term).limit(5),
    supabase.from("exams").select("id,name").ilike("name", term).limit(5),
    supabase.from("tasks").select("id,title").ilike("title", term).limit(5),
    supabase.from("subjects").select("id,name").ilike("name", term).limit(5),
    supabase.from("notes").select("id,title").ilike("title", term).limit(5),
    supabase.from("announcements").select("id,title").ilike("title", term).limit(5),
  ]);
  const groups: Group[] = [
    { group: "Assignments", hits: (a.data ?? []).map((x) => ({ id: x.id, label: x.title, to: "/assignments" })) },
    { group: "Exams", hits: (e.data ?? []).map((x) => ({ id: x.id, label: x.name, to: "/exams" })) },
    { group: "Tasks", hits: (t.data ?? []).map((x) => ({ id: x.id, label: x.title, to: "/tasks" })) },
    {
      group: "Subjects",
      hits: (s.data ?? []).map((x) => ({ id: x.id, label: x.name, to: "/subjects/$subjectId", params: { subjectId: x.id } })),
    },
    { group: "Notes", hits: (n.data ?? []).map((x) => ({ id: x.id, label: x.title, to: "/notes" })) },
    { group: "Announcements", hits: (an.data ?? []).map((x) => ({ id: x.id, label: x.title, to: "/announcements" })) },
  ];
  return groups.filter((g) => g.hits.length);
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim());
  const navigate = useNavigate();
  const { data, isFetching } = useQuery({
    queryKey: ["search", dq],
    queryFn: () => runSearch(dq.slice(0, 80)),
    enabled: open && dq.length >= 2,
  });

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="h-10 w-10 justify-start gap-2 px-0 text-muted-foreground sm:w-64 sm:px-3"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="mx-auto sm:mx-0" />
        <span className="hidden font-normal sm:inline">Search…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 text-[10px] font-medium lg:inline">⌘K</kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[15%] translate-y-0 gap-0 p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Search CampusFlow</DialogTitle>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search assignments, exams, notes, subjects…"
              aria-label="Search query"
              className="h-12 w-full bg-transparent text-sm outline-none"
            />
            {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />}
          </div>
          <div className="max-h-[60dvh] overflow-y-auto p-2" aria-live="polite">
            {dq.length < 2 ? (
              <p className="p-4 text-sm text-muted-foreground">Type at least 2 characters.</p>
            ) : data && data.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No results for “{dq}”.</p>
            ) : (
              data?.map((g) => (
                <div key={g.group} className="mb-2">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.group}</p>
                  {g.hits.map((h) => (
                    <button
                      key={h.id}
                      className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm hover:bg-muted focus-visible:bg-muted"
                      onClick={() => {
                        setOpen(false);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        navigate({ to: h.to as any, params: h.params as any });
                      }}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
