# CampusFlow: Your Academic Navigator

Act as a senior full-stack engineer, product architect, UI/UX designer, and security engineer. Build a complete production-ready Student Dashboard web application designed for college/university students.

The application should feel like a modern student productivity and academic-management platform rather than a generic admin dashboard.

1. BUSINESS SPECIFICATION

Business Name: CampusFlow

Industry: Education Technology / Student Productivity

Main Problem:
College students manage academic information across multiple disconnected sources such as classroom announcements, timetables, assignments, attendance records, exam schedules, notes, and personal task lists. This makes it difficult to understand what needs attention today, track academic progress, and stay organized.

Solution:
CampusFlow is a centralized student dashboard that brings academic schedules, attendance, assignments, exams, announcements, tasks, notes, and academic performance into one personalized interface.

Target Users:

 College and university students

 Undergraduate students

 Students managing multiple subjects and semesters

 Students who want one place to organize academic work and deadlines

Core Feature:
A personalized student dashboard showing the student's today's schedule, attendance, upcoming assignments, upcoming exams, pending tasks, announcements, and academic progress in one interface.

USP:
CampusFlow combines academic tracking and personal student productivity into one simple dashboard. Instead of navigating between separate tools, students can immediately see what they have today, what is overdue, what is coming next, and how they are performing academically.

Backend / Automation Setup:
Use a PostgreSQL database with Prisma ORM. Implement authentication, user profiles, subjects, timetable entries, assignments, exams, attendance records, tasks, announcements, notes, and academic performance data.

Use automated dashboard calculations to generate:

 Today's classes

 Upcoming deadlines

 Overdue assignments

 Attendance percentages

 Upcoming examinations

 Task completion statistics

 Subject-wise academic performance

 Overall academic progress

Use scheduled/background processing where appropriate for reminders and deadline notifications.

Monetization Model:
Freemium.

Free users receive the core academic dashboard, timetable, assignments, attendance, tasks, exams, and basic analytics.

A future Pro tier can provide advanced analytics, automated reminders, calendar synchronization, AI-powered study planning, advanced reports, and additional customization.

Do not implement paid billing unless explicitly requested; structure the application so Stripe or another payment provider can be added later.

Theme / Branding:
Modern, minimal, student-focused SaaS aesthetic.

Use:

 Primary: Indigo / deep blue

 Accent: Electric violet

 Background: Very light gray/white

 Cards: White

 Text: Dark slate

 Muted text: Slate gray

 Success: Green

 Warning: Amber

 Error: Red

Use rounded cards, subtle borders, restrained shadows, clean typography, generous spacing, and modern dashboard visualizations.

The design should feel premium but not corporate.

2. PRODUCT VISION

Create a responsive web application where a student can log in and immediately understand their academic situation.

The dashboard should answer these questions within seconds:

 What classes do I have today?

 What assignments are due soon?

 What tasks are pending?

 What exams are coming?

 What is my attendance percentage?

 Which subjects require attention?

 What announcements are new?

 How is my academic performance progressing?

The interface should prioritize information hierarchy over excessive decoration.

3. AUTHENTICATION

Implement secure authentication.

Support:

 Sign up

 Login

 Logout

 Password reset

 Persistent sessions

 Protected dashboard routes

 User profile

 Role-based access

Default roles:

student

admin

Students can only access and modify their own academic data.

Admins can manage global announcements and platform-level data.

Never trust frontend authorization.

All protected operations must perform server-side authorization checks.

4. ONBOARDING

After signup, guide the student through a short onboarding flow.

Collect:

 Full name

 Email

 College/university

 Course/program

 Current semester

 Academic year

 Optional profile image

Then allow the student to create/import their subjects.

Example:

 Python Programming

 Statistics

 Web Development

 Artificial Intelligence

 Computer Networks

The student should be able to edit these later.

5. MAIN DASHBOARD

Create /dashboard.

The dashboard should contain:

Header

Display:

 Greeting based on time of day

 Student name

 Current date

 Notification icon

 Profile menu

Example:

Good evening, Jitesh 👋
Here's what you need to focus on today.

Do not hardcode the name.

Today's Classes

Display today's timetable.

Each class card should show:

 Subject

 Start time

 End time

 Room

 Faculty

 Class status

Statuses:

 Upcoming

 Ongoing

 Completed

Highlight the currently active class.

Attendance Summary

Show:

 Overall attendance percentage

 Classes attended

 Classes missed

 Subject-wise attendance

Use a progress indicator.

Allow students to manually record attendance.

Assignments

Display:

 Assignment title

 Subject

 Due date

 Priority

 Status

Statuses:

 Pending

 Submitted

 Completed

 Overdue

Sort by urgency.

Upcoming Exams

Display:

 Exam name

 Subject

 Date

 Time

 Room

 Days remaining

Highlight exams occurring soon.

Tasks

Create a personal task system.

Each task should support:

 Title

 Description

 Due date

 Priority

 Category

 Completion status

Priority:

 Low

 Medium

 High

Allow users to mark tasks completed directly from the dashboard.

Announcements

Display recent announcements with:

 Title

 Date

 Category

 Read/unread state

Academic Performance

Show:

 Overall GPA/percentage

 Subject performance

 Previous performance

 Performance trend

Use charts only where they improve comprehension.

6. SIDEBAR NAVIGATION

Desktop sidebar:

 Dashboard

 Timetable

 Assignments

 Exams

 Attendance

 Subjects

 Tasks

 Notes

 Performance

 Announcements

 Settings

Mobile should use a responsive navigation system such as a drawer or bottom navigation.

Highlight the active section.

7. TIMETABLE

Create /timetable.

Provide:

 Day view

 Week view

 Today's schedule

 Add class

 Edit class

 Delete class

Each timetable entry contains:

Subject
Faculty
Room
Day
Start Time
End Time
Color/Category

Prevent overlapping classes where possible.

Provide useful validation.

8. ASSIGNMENTS

Create /assignments.

Features:

 Create assignment

 Edit assignment

 Delete assignment

 Mark complete

 Mark submitted

 Filter by subject

 Filter by status

 Sort by deadline

 Search assignments

Display overdue assignments prominently.

Use real database data.

9. EXAMS

Create /exams.

Features:

 Add exam

 Edit exam

 Delete exam

 Exam countdown

 Subject

 Date

 Time

 Location

 Exam type

Examples:

 Midterm

 Final

 Quiz

 Practical

 Viva

Display the next upcoming exam prominently.

10. ATTENDANCE

Create /attendance.

Show:

 Overall attendance

 Subject-wise attendance

 Classes attended

 Classes missed

 Attendance percentage

 Attendance trend

Allow students to record:

 Present

 Absent

Calculate:

Attendance % =
Present Classes / Total Classes × 100

Provide warnings when attendance falls below a configurable threshold.

Default warning threshold: 75%.

Do not fabricate attendance data.

11. SUBJECTS

Create /subjects.

Each subject should contain:

 Subject name

 Subject code

 Faculty

 Credits

 Semester

 Attendance

 Assignments

 Exams

 Performance

Clicking a subject should open a dedicated subject overview page.

12. TASK MANAGER

Create /tasks.

Support:

 Create

 Edit

 Delete

 Complete

 Reopen

 Search

 Filter

 Sort

Filters:

 Today

 Upcoming

 Overdue

 Completed

 High priority

Provide a clean productivity-focused interface.

13. NOTES

Create /notes.

Students can:

 Create notes

 Edit notes

 Delete notes

 Search notes

 Organize notes by subject

 Pin important notes

Each note should contain:

 Title

 Content

 Subject

 Created date

 Updated date

Use a clean editor.

Do not implement a complex rich-text editor unless necessary.

14. PERFORMANCE

Create /performance.

Show:

 Overall GPA/percentage

 Subject-wise marks

 Average score

 Highest-performing subjects

 Subjects needing attention

 Performance trend

Use charts such as:

 Bar chart for subject performance

 Line chart for performance over time

 Progress indicators for subject completion

Charts must use actual database data.

15. ANNOUNCEMENTS

Create /announcements.

Students can view:

 College announcements

 Course announcements

 Academic notifications

 Event announcements

Admins can:

 Create

 Edit

 Delete

 Publish announcements

Students should have read/unread states.

16. SEARCH

Implement global search.

Search across:

 Assignments

 Exams

 Tasks

 Subjects

 Notes

 Announcements

Use debounced search.

Show categorized results.

Example:

Search results

Assignments
Python Project

Notes
Python Loops

Subjects
Python Programming

17. NOTIFICATIONS

Implement an in-app notification system.

Notifications should be generated for relevant events such as:

 Assignment deadline approaching

 Assignment overdue

 Upcoming exam

 New announcement

 Attendance warning

 Task deadline

Allow users to mark notifications as read.

Do not send unnecessary notifications.

18. DATABASE SCHEMA

Use PostgreSQL + Prisma.

Create appropriate models for:

User
Profile
Subject
TimetableEntry
Assignment
Exam
AttendanceRecord
Task
Note
Announcement
Notification
PerformanceRecord

Use relationships between entities.

Example:

User
 ├── Profile
 ├── Subjects
 ├── Timetable
 ├── Assignments
 ├── Exams
 ├── Attendance
 ├── Tasks
 ├── Notes
 ├── Notifications
 └── PerformanceRecords

Use UUID/cuid IDs.

Add timestamps.

Create indexes for frequently queried fields.

Use foreign-key constraints.

19. API / SERVER ACTIONS

Implement secure server-side operations for:

 User profile

 Subjects

 Timetable

 Assignments

 Exams

 Attendance

 Tasks

 Notes

 Announcements

 Notifications

 Performance

Every mutation must:

 Authenticate user

 Verify authorization

 Validate input using Zod

 Execute database operation

 Return structured result

 Handle errors safely

Students must never be able to access another student's private data by modifying an ID in a request.

20. AUTOMATION

Implement dashboard calculations automatically.

Examples:

Assignment urgency

Calculate:

Overdue
Due today
Due tomorrow
Due this week
Upcoming

Exam countdown

Calculate days remaining from the current date.

Attendance

Automatically recalculate attendance percentage whenever an attendance record changes.

Dashboard summary

Generate:

 Today's class count

 Pending assignment count

 Overdue assignment count

 Upcoming exam count

 Pending task count

 Overall attendance

Do not store values that can safely be calculated from source data unless there is a clear performance reason.

21. UI DESIGN

Use a modern SaaS dashboard layout.

Desktop

┌──────────────┬─────────────────────────────────────┐
│              │ Header                              │
│   Sidebar    ├─────────────────────────────────────┤
│              │                                     │
│ Dashboard    │ Main dashboard                     │
│ Timetable    │                                     │
│ Assignments  │ Cards / tables / charts             │
│ Exams        │                                     │
│ Attendance   │                                     │
│ Subjects     │                                     │
│ Tasks        │                                     │
│ Notes        │                                     │
│ Performance  │                                     │
│ Settings     │                                     │
└──────────────┴─────────────────────────────────────┘

Use cards with consistent spacing.

Avoid excessive shadows.

Use subtle hover states.

Use smooth but restrained transitions.

22. RESPONSIVE DESIGN

The application must work at:

 320px

 375px

 425px

 768px

 1024px

 1280px

 1440px

 1920px

On mobile:

 Sidebar becomes drawer/bottom navigation

 Dashboard cards stack vertically

 Tables become horizontally scrollable or transform into cards

 Forms use full-width controls

 Charts resize correctly

 Touch targets are at least approximately 44px

Never allow accidental horizontal page overflow.

23. DESIGN SYSTEM

Use CSS variables for:

--primary
--secondary
--accent
--background
--surface
--foreground
--muted
--border
--success
--warning
--error

Use consistent:

 4/8px spacing system

 Border radius

 Typography scale

 Button sizes

 Input heights

 Card padding

Use Lucide icons.

Do not use random icon libraries for individual components.

24. EMPTY STATES

Every major section needs a useful empty state.

Examples:

Assignments:

No assignments yet. Add your first assignment to start tracking deadlines.

Tasks:

You're all caught up. Add a task when you have something to work on.

Timetable:

Your timetable is empty. Add your first class.

Notes:

No notes yet. Create a note for your next study session.

Include a relevant CTA.

25. LOADING STATES

Use skeleton loaders for:

 Dashboard cards

 Tables

 Lists

 Charts

 Subject pages

Avoid showing blank screens while data loads.

26. ERROR STATES

Display clear user-facing messages.

Example:

We couldn't load your assignments. Please try again.

Do not expose:

 Stack traces

 Database errors

 API secrets

 Internal implementation details

27. ACCESSIBILITY

Implement WCAG 2.2 AA principles.

Use:

 Semantic HTML

 Keyboard navigation

 Focus indicators

 Accessible form labels

 Screen-reader-friendly error messages

 Sufficient contrast

 Accessible dialogs

 Accessible dropdowns

 Alt text where images exist

Do not rely only on color to communicate status.

28. PERFORMANCE

Optimize for:

 Fast dashboard loading

 Server-side data fetching where appropriate

 Database indexes

 Pagination for large datasets

 Debounced search

 Lazy loading

 Optimized images

 Minimal client-side JavaScript

 Efficient React rendering

Do not fetch the entire database when only a small dashboard subset is needed.

29. SECURITY

Implement:

 Secure authentication

 Server-side authorization

 Zod validation

 Secure sessions/cookies

 Rate limiting on sensitive endpoints

 Protection against IDOR

 XSS prevention

 CSRF protection where applicable

 Database constraints

 Safe error handling

Students can only access their own private academic data.

Admin-only functionality must be protected server-side.

30. SEO

For public pages implement:

 Page title

 Meta description

 Open Graph metadata

 Semantic headings

 Sitemap

 Robots configuration

Dashboard pages should not be publicly indexed.

31. TECHNOLOGY STACK

Use:

Frontend

 Next.js

 React

 TypeScript

 Tailwind CSS

 shadcn/ui

 Lucide React

Backend

 Next.js API routes/server actions

 TypeScript

Database

 PostgreSQL

 Prisma

Authentication

 Supabase Auth or Auth.js

Validation

 Zod

Forms

 React Hook Form

Charts

 Recharts

Deployment

 Vercel-compatible architecture

32. PROJECT STRUCTURE

Use a modular architecture:

app/
  (marketing)/
  (auth)/
  dashboard/
  timetable/
  assignments/
  exams/
  attendance/
  subjects/
  tasks/
  notes/
  performance/
  announcements/
  settings/
  api/

components/
  ui/
  layout/
  dashboard/
  timetable/
  assignments/
  exams/
  attendance/
  tasks/
  notes/
  charts/

lib/
  auth/
  db/
  validations/
  services/
  utilities/

prisma/
  schema.prisma
  migrations/
  seed.ts

types/

hooks/

public/

Adapt the structure if a better Next.js architecture is required.

33. DEMO DATA

For development/demo mode, create realistic fictional data for:

 5 subjects

 Weekly timetable

 Assignments

 Exams

 Attendance

 Tasks

 Notes

 Announcements

 Performance records

Clearly separate seed/demo data from real user data.

Do not present demo statistics as real institutional statistics.

34. FUTURE-READY ARCHITECTURE

Structure the system so the following can be added later without rewriting the application:

 Google Calendar integration

 Microsoft Calendar integration

 AI study planner

 AI assignment assistant

 AI-generated study schedules

 Push notifications

 Email reminders

 College LMS integration

 Faculty portal

 Parent/guardian portal

 Mobile application

 Subscription billing

 Advanced academic analytics

Do not build these features unless explicitly requested.

35. RESTRICTIONS

Do NOT:

 Build a static dashboard mockup

 Use hardcoded dashboard values in production

 Use localStorage as the primary database

 Create fake authentication

 Create fake API integrations

 Expose API keys

 Allow users to access other users' data

 Add unnecessary animations

 Add irrelevant features

 Use fake testimonials

 Use fake university partnerships

 Use fake academic statistics

 Create unnecessary pages

 Overcomplicate the UI

 Build an admin panel with no purpose

 Implement AI features unless explicitly requested

 Implement payment functionality yet

 Sacrifice usability for visual effects

36. FINAL OUTPUT EXPECTATIONS

Generate a complete working CampusFlow application.

The generated project must include:

 Responsive landing page

 Authentication

 Student onboarding

 Student dashboard

 Timetable management

 Assignment management

 Exam management

 Attendance tracking

 Subject management

 Task manager

 Notes

 Academic performance

 Announcements

 Notifications

 Global search

 User settings

 PostgreSQL database

 Prisma schema and migrations

 Server-side authorization

 Zod validation

 Loading states

 Empty states

 Error states

 Responsive mobile experience

 Accessibility

 SEO for public pages

 Demo seed data

 Environment configuration

 README setup instructions

 Production-ready project structure

Build the product around one central principle:

When a student opens CampusFlow, they should immediately know what they need to do today, what is coming next, and whether they are keeping up academically.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://campusflowwww.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/761c7ac6-ef26-5a0b-b4eb-f60d596ce8da).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
