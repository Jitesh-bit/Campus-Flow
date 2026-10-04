import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  NotebookPen,
  Settings,
  UserCheck,
} from "lucide-react";

export const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/timetable", label: "Timetable", icon: CalendarDays },
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/exams", label: "Exams", icon: CalendarClock },
  { to: "/attendance", label: "Attendance", icon: UserCheck },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/performance", label: "Performance", icon: BarChart3 },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export const BOTTOM_NAV = ["/dashboard", "/timetable", "/assignments", "/tasks"] as const;
