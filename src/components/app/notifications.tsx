import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTable } from "@/lib/data";

export function Notifications() {
  const qc = useQueryClient();
  const { data = [] } = useTable("notifications");
  const unread = data.filter((n) => !n.read_at);

  // Generate deadline / exam / attendance notifications (deduplicated in the database).
  useEffect(() => {
    supabase.rpc("refresh_my_notifications").then(() => qc.invalidateQueries({ queryKey: ["table", "notifications"] }));
  }, [qc]);

  async function markAll() {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    qc.invalidateQueries({ queryKey: ["table", "notifications"] });
  }
  async function markOne(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["table", "notifications"] });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread.length} unread`}>
          <Bell />
          {unread.length > 0 && (
            <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-violet px-1 text-[10px] font-bold text-primary-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread.length > 0 && (
            <Button size="sm" variant="ghost" onClick={markAll}>
              <CheckCheck /> Mark all read
            </Button>
          )}
        </div>
        <ul className="max-h-96 overflow-y-auto">
          {data.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</li>}
          {data.slice(0, 30).map((n) => (
            <li key={n.id} className="border-b last:border-0">
              <Link
                to={(n.link ?? "/dashboard") as "/dashboard"}
                onClick={() => !n.read_at && markOne(n.id)}
                className="flex gap-3 px-4 py-3 hover:bg-muted"
              >
                <span
                  aria-label={n.read_at ? "Read" : "Unread"}
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? "bg-border" : "bg-violet"}`}
                />
                <span className="min-w-0">
                  <span className={`block text-sm ${n.read_at ? "" : "font-semibold"}`}>{n.title}</span>
                  {n.body && <span className="block text-xs text-muted-foreground">{n.body}</span>}
                  <span className="block text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
