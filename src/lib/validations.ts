import { z } from "zod";

const opt = (max: number) => z.string().trim().max(max).optional().or(z.literal("")).transform((v) => v || null);
const uuidOpt = z.string().uuid().optional().or(z.literal("")).transform((v) => v || null);
const dt = z.string().min(1, "Date is required").refine((v) => !isNaN(Date.parse(v)), "Invalid date").transform((v) => new Date(v).toISOString());

export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required").max(120),
  code: opt(30),
  faculty: opt(120),
  credits: z.coerce.number().min(0).max(30).optional().nullable(),
  semester: z.coerce.number().int().min(1).max(20).optional().nullable(),
  color: z.string().default("indigo"),
});

export const timetableSchema = z
  .object({
    subject_id: z.string().uuid("Choose a subject"),
    day_of_week: z.coerce.number().int().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}/, "Start time is required"),
    end_time: z.string().regex(/^\d{2}:\d{2}/, "End time is required"),
    room: opt(60),
    faculty: opt(120),
  })
  .refine((v) => v.end_time > v.start_time, { message: "End time must be after start time", path: ["end_time"] });

export const assignmentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  subject_id: uuidOpt,
  description: opt(5000),
  due_at: dt,
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "submitted", "completed"]),
});

export const examSchema = z.object({
  name: z.string().trim().min(1, "Exam name is required").max(200),
  subject_id: uuidOpt,
  exam_type: z.enum(["midterm", "final", "quiz", "practical", "viva", "other"]),
  starts_at: dt,
  duration_minutes: z.coerce.number().int().min(1).max(1440).optional().nullable(),
  room: opt(60),
});

export const attendanceSchema = z.object({
  subject_id: z.string().uuid("Choose a subject"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
  status: z.enum(["present", "absent"]),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: opt(2000),
  due_at: z.string().optional().or(z.literal("")).transform((v) => (v ? new Date(v).toISOString() : null)),
  priority: z.enum(["low", "medium", "high"]),
  category: opt(40),
});

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  content: z.string().max(50000),
  subject_id: uuidOpt,
  pinned: z.boolean().default(false),
});

export const performanceSchema = z
  .object({
    subject_id: z.string().uuid("Choose a subject"),
    title: z.string().trim().min(1, "Assessment name is required").max(200),
    score: z.coerce.number().min(0),
    max_score: z.coerce.number().positive("Must be more than 0"),
    assessed_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
  })
  .refine((v) => v.score <= v.max_score, { message: "Score can't exceed the maximum", path: ["score"] });

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().min(1, "Message is required").max(10000),
  category: z.enum(["college", "course", "academic", "event"]),
  published: z.boolean().default(false),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Your name is required").max(120),
  college: opt(160),
  program: opt(160),
  semester: z.coerce.number().int().min(1).max(20).optional().nullable(),
  academic_year: opt(20),
  avatar_url: z.string().trim().url("Enter a valid image URL").max(500).optional().or(z.literal("")).transform((v) => v || null),
  attendance_threshold: z.coerce.number().int().min(0).max(100).default(75),
});

export const emailSchema = z.string().trim().email("Enter a valid email").max(255);
export const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);
