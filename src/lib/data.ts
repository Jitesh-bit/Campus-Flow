// Data access layer. All reads/writes go through the authenticated client;
// row-level security in the database enforces that a user only touches their own rows.
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";

export type TableName = keyof Database["public"]["Tables"];

const ORDER: Partial<Record<TableName, { col: string; asc: boolean }>> = {
  subjects: { col: "name", asc: true },
  timetable_entries: { col: "start_time", asc: true },
  assignments: { col: "due_at", asc: true },
  exams: { col: "starts_at", asc: true },
  attendance_records: { col: "date", asc: false },
  tasks: { col: "created_at", asc: false },
  notes: { col: "updated_at", asc: false },
  performance_records: { col: "assessed_on", asc: true },
  announcements: { col: "created_at", asc: false },
  notifications: { col: "created_at", asc: false },
  announcement_reads: { col: "read_at", asc: false },
};

const LIMIT = 1000;

/** Translate database errors into safe user-facing text. */
export function friendlyError(e: unknown, fallback = "Something went wrong. Please try again.") {
  const msg = (e as { message?: string })?.message ?? "";
  if (msg.includes("overlaps")) return "This class overlaps with another class on the same day.";
  if (msg.includes("Invalid subject")) return "Please choose one of your subjects.";
  if (msg.includes("violates check constraint")) return "Some values are out of the allowed range.";
  if (msg.includes("row-level security") || msg.includes("permission")) return "You don't have permission to do that.";
  return fallback;
}

export function tableQuery<K extends TableName>(table: K) {
  return queryOptions({
    queryKey: ["table", table],
    queryFn: async () => {
      const o = ORDER[table] ?? { col: "created_at", asc: false };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(table) as any)
        .select("*")
        .order(o.col, { ascending: o.asc })
        .limit(LIMIT);
      if (error) throw error;
      return data as Tables<K>[];
    },
    staleTime: 30_000,
  });
}

export function useTable<K extends TableName>(table: K) {
  return useQuery(tableQuery(table));
}

type Row = Record<string, unknown> & { id?: string };

export function useSave<K extends TableName>(table: K, opts?: { success?: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Row) => {
      const { id, ...rest } = row;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = supabase.from(table) as any;
      const { error } = id ? await q.update(rest).eq("id", id) : await q.insert(rest);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["table"] });
      if (opts?.success) toast.success(opts.success);
    },
    onError: (e) => toast.error(friendlyError(e)),
  });
}

export function useRemove<K extends TableName>(table: K, label = "Deleted") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(table) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["table"] });
      toast.success(label);
    },
    onError: (e) => toast.error(friendlyError(e)),
  });
}

export const profileQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const [{ data: profile, error }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", u.user.id),
    ]);
    if (error) throw error;
    return {
      user: { id: u.user.id, email: u.user.email ?? "" },
      profile,
      isAdmin: !!roles?.some((r) => r.role === "admin"),
    };
  },
  staleTime: 60_000,
});

export function useMe() {
  return useQuery(profileQuery);
}
