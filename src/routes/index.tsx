import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, CalendarDays, CheckCircle2, ClipboardList, ListChecks, UserCheck, Bell, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusFlow — One dashboard for your whole semester" },
      {
        name: "description",
        content: "See today's classes, upcoming deadlines, exams, attendance and grades in one student dashboard. Free for students.",
      },
      { property: "og:title", content: "CampusFlow — One dashboard for your whole semester" },
      { property: "og:description", content: "Classes, assignments, exams, attendance, tasks and grades — organised in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: CalendarDays, title: "Today, at a glance", body: "Your classes for today with live status, rooms and faculty." },
  { icon: ClipboardList, title: "Deadlines sorted by urgency", body: "Overdue, due today, due this week — never guess what's next." },
  { icon: UserCheck, title: "Attendance you can trust", body: "Record present or absent and see exactly how many classes you can miss." },
  { icon: BarChart3, title: "Performance trends", body: "Subject-wise marks, averages and which subjects need attention." },
  { icon: ListChecks, title: "Personal tasks", body: "A focused to-do list with priorities, categories and filters." },
  { icon: NotebookPen, title: "Notes by subject", body: "Quick study notes, pinned and searchable." },
];

function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Get started
            </Link>
          </Button>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-soft px-3 py-1 text-xs font-semibold text-violet">
              Built for college students
            </p>
            <h1 className="text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl">
              Know what to do <span className="text-brand">today</span>. See what's next.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              CampusFlow brings your timetable, assignments, exams, attendance, tasks and grades into one calm dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="brand" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create free account
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">I already have one</Link>
              </Button>
            </div>
          </div>

          <div className="card-surface shadow-pop p-4 sm:p-6" aria-hidden>
            <p className="text-sm text-muted-foreground">Preview</p>
            <p className="font-display text-xl font-semibold">Good morning 👋</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Classes today", "3"],
                ["Due this week", "4"],
                ["Attendance", "82%"],
                ["Next exam", "2 days"],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg border bg-background p-3">
                  <p className="text-xs text-muted-foreground">{l}</p>
                  <p className="font-display text-2xl font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <ul className="mt-4 space-y-2">
              {["Statistics problem set", "Portfolio page", "Networks worksheet"].map((t, i) => (
                <li key={t} className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm">
                  <CheckCircle2 className={i === 2 ? "size-4 text-success" : "size-4 text-muted-foreground"} />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground">Illustrative example — your dashboard uses your own data.</p>
          </div>
        </section>

        <section className="border-t bg-card py-16" aria-labelledby="features">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="features" className="text-2xl font-semibold sm:text-3xl">
              Everything for the semester, in one place
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border p-5">
                  <f.icon className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-3 font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="plans">
          <h2 id="plans" className="text-2xl font-semibold sm:text-3xl">
            Free for students
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="card-surface p-6">
              <p className="font-semibold">Free</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Dashboard, timetable, assignments, exams, attendance, tasks, notes, basic analytics and in-app notifications.
              </p>
            </div>
            <div className="rounded-xl border border-dashed p-6">
              <p className="flex items-center gap-2 font-semibold">
                <Bell className="size-4 text-violet" aria-hidden /> Pro — coming later
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Advanced analytics, email reminders, calendar sync and more customisation.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} CampusFlow
      </footer>
    </div>
  );
}
