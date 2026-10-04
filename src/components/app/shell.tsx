import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, LogOut, Menu, MoreHorizontal, Settings, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/data";
import { cn } from "@/lib/utils";
import { NAV, BOTTOM_NAV } from "./nav";
import { GlobalSearch } from "./search";
import { Notifications } from "./notifications";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-display text-lg font-semibold", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-primary-foreground">
        <GraduationCap className="size-4" aria-hidden />
      </span>
      CampusFlow
    </span>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={onNavigate}
          className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground", "aria-current": "page" }}
        >
          <n.icon className="size-4" aria-hidden />
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "S";
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const name = me?.profile?.full_name || me?.user.email || "Student";

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-dvh lg:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-sidebar p-4 lg:flex">
        <Link to="/dashboard" className="mb-6 px-2">
          <Logo />
        </Link>
        <NavList />
        <div className="mt-auto rounded-xl bg-primary-soft p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-primary">Free plan</p>
          <p className="mt-0.5">Core dashboard, timetable, tracking and analytics.</p>
        </div>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-4">
          <SheetTitle className="mb-4">
            <Logo />
          </SheetTitle>
          <NavList onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu />
        </Button>
        <Link to="/dashboard" className="lg:hidden">
          <Logo className="text-base [&>span:first-child]:size-7" />
        </Link>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <GlobalSearch />
          <Notifications />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-1.5" aria-label="Profile menu">
                <Avatar className="size-8">
                  {me?.profile?.avatar_url && <AvatarImage src={me.profile.avatar_url} alt="" />}
                  <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">{initials(name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">
                {name}
                <span className="block truncate text-xs font-normal text-muted-foreground">{me?.user.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings /> Settings
                </Link>
              </DropdownMenuItem>
              {me?.isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/announcements">
                    <Shield /> Manage announcements
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={signOut}>
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl px-3 pb-28 pt-6 sm:px-6 lg:pb-12">
        {children}
      </main>

      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {BOTTOM_NAV.map((to) => {
          const n = NAV.find((x) => x.to === to)!;
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <n.icon className="size-5" aria-hidden />
              {n.label}
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"
        >
          <MoreHorizontal className="size-5" aria-hidden />
          More
        </button>
      </nav>
    </div>
  );
}
