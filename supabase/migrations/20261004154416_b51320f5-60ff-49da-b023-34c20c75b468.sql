
create type public.app_role as enum ('admin','student');
create type public.priority_level as enum ('low','medium','high');
create type public.assignment_status as enum ('pending','submitted','completed');
create type public.exam_type as enum ('midterm','final','quiz','practical','viva','other');
create type public.attendance_status as enum ('present','absent');
create type public.announcement_category as enum ('college','course','academic','event');

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at = now(); return new; end $$;

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  college text,
  program text,
  semester int,
  academic_year text,
  avatar_url text,
  attendance_threshold int not null default 75 check (attendance_threshold between 0 and 100),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, email, full_name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'student');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- generic owner tables
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  code text check (char_length(code) <= 30),
  faculty text check (char_length(faculty) <= 120),
  credits numeric(4,1) check (credits >= 0 and credits <= 30),
  semester int check (semester between 1 and 20),
  color text not null default 'indigo',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.subjects(user_id);

create table public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  room text check (char_length(room) <= 60),
  faculty text check (char_length(faculty) <= 120),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index on public.timetable_entries(user_id, day_of_week);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 5000),
  due_at timestamptz not null,
  priority priority_level not null default 'medium',
  status assignment_status not null default 'pending',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.assignments(user_id, due_at);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  exam_type exam_type not null default 'other',
  starts_at timestamptz not null,
  duration_minutes int check (duration_minutes between 1 and 1440),
  room text check (char_length(room) <= 60),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.exams(user_id, starts_at);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  date date not null,
  status attendance_status not null,
  note text check (char_length(note) <= 300),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.attendance_records(user_id, subject_id, date);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 2000),
  due_at timestamptz,
  priority priority_level not null default 'medium',
  category text check (char_length(category) <= 40),
  completed boolean not null default false,
  completed_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.tasks(user_id, completed, due_at);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  content text not null default '' check (char_length(content) <= 50000),
  pinned boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.notes(user_id, pinned, updated_at);

create table public.performance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  score numeric(7,2) not null check (score >= 0),
  max_score numeric(7,2) not null check (max_score > 0),
  assessed_on date not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (score <= max_score)
);
create index on public.performance_records(user_id, assessed_on);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  dedupe_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index on public.notifications(user_id, read_at, created_at desc);

do $$
declare t text;
begin
  foreach t in array array['subjects','timetable_entries','assignments','exams','attendance_records','tasks','notes','performance_records'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own select" on public.%I for select to authenticated using (user_id = auth.uid())', t);
    execute format('create policy "own insert" on public.%I for insert to authenticated with check (user_id = auth.uid())', t);
    execute format('create policy "own update" on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "own delete" on public.%I for delete to authenticated using (user_id = auth.uid())', t);
    execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own select" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own delete" on public.notifications for delete to authenticated using (user_id = auth.uid());

-- prevent referencing other users' subjects
create or replace function public.check_subject_owner() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.subject_id is not null and not exists (select 1 from public.subjects where id = new.subject_id and user_id = new.user_id) then
    raise exception 'Invalid subject';
  end if;
  return new;
end $$;
do $$
declare t text;
begin
  foreach t in array array['timetable_entries','assignments','exams','attendance_records','notes','performance_records'] loop
    execute format('create trigger subject_owner before insert or update on public.%I for each row execute function public.check_subject_owner()', t);
  end loop;
end $$;

-- prevent overlapping timetable
create or replace function public.check_timetable_overlap() returns trigger language plpgsql set search_path=public as $$
begin
  if exists (select 1 from public.timetable_entries e where e.user_id = new.user_id and e.day_of_week = new.day_of_week and e.id <> new.id
    and e.start_time < new.end_time and new.start_time < e.end_time) then
    raise exception 'This class overlaps with another class on the same day';
  end if;
  return new;
end $$;
create trigger timetable_overlap before insert or update on public.timetable_entries for each row execute function public.check_timetable_overlap();

-- announcements
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete set null default auth.uid(),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) <= 10000),
  category announcement_category not null default 'college',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.announcements(published, published_at desc);
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "read published" on public.announcements for select to authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admin insert" on public.announcements for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.announcements for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.announcements for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger touch before update on public.announcements for each row execute function public.touch_updated_at();

create or replace function public.set_published_at() returns trigger language plpgsql set search_path=public as $$
begin
  if new.published and new.published_at is null then new.published_at = now(); end if;
  if not new.published then new.published_at = null; end if;
  return new;
end $$;
create trigger ann_pub before insert or update on public.announcements for each row execute function public.set_published_at();

create table public.announcement_reads (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, announcement_id)
);
grant select, insert, delete on public.announcement_reads to authenticated;
grant all on public.announcement_reads to service_role;
alter table public.announcement_reads enable row level security;
create policy "own select" on public.announcement_reads for select to authenticated using (user_id = auth.uid());
create policy "own insert" on public.announcement_reads for insert to authenticated with check (user_id = auth.uid());
create policy "own delete" on public.announcement_reads for delete to authenticated using (user_id = auth.uid());

-- notification generation (idempotent via dedupe keys), for current user
create or replace function public.refresh_my_notifications() returns int
language plpgsql security definer set search_path=public as $$
declare uid uuid := auth.uid(); n int := 0; thr int; r record;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select attendance_threshold into thr from profiles where id = uid;
  thr := coalesce(thr, 75);

  insert into notifications(user_id, kind, title, body, link, dedupe_key)
  select uid, 'assignment_due', 'Assignment due soon: ' || a.title, 'Due ' || to_char(a.due_at, 'Dy DD Mon, HH24:MI'), '/assignments', 'due:' || a.id
  from assignments a where a.user_id = uid and a.status = 'pending' and a.due_at between now() and now() + interval '48 hours'
  on conflict do nothing;

  insert into notifications(user_id, kind, title, body, link, dedupe_key)
  select uid, 'assignment_overdue', 'Overdue: ' || a.title, 'This assignment passed its deadline.', '/assignments', 'overdue:' || a.id
  from assignments a where a.user_id = uid and a.status = 'pending' and a.due_at < now() and a.due_at > now() - interval '30 days'
  on conflict do nothing;

  insert into notifications(user_id, kind, title, body, link, dedupe_key)
  select uid, 'exam_upcoming', 'Upcoming exam: ' || e.name, 'Starts ' || to_char(e.starts_at, 'Dy DD Mon, HH24:MI'), '/exams', 'exam:' || e.id
  from exams e where e.user_id = uid and e.starts_at between now() and now() + interval '3 days'
  on conflict do nothing;

  insert into notifications(user_id, kind, title, body, link, dedupe_key)
  select uid, 'task_due', 'Task due: ' || t.title, null, '/tasks', 'task:' || t.id
  from tasks t where t.user_id = uid and not t.completed and t.due_at between now() and now() + interval '24 hours'
  on conflict do nothing;

  insert into notifications(user_id, kind, title, body, link, dedupe_key)
  select uid, 'announcement', 'New announcement: ' || a.title, null, '/announcements', 'ann:' || a.id
  from announcements a where a.published and a.published_at > now() - interval '7 days'
    and not exists (select 1 from announcement_reads ar where ar.user_id = uid and ar.announcement_id = a.id)
  on conflict do nothing;

  for r in
    select s.id, s.name, round(100.0 * count(*) filter (where ar.status='present') / count(*)) pct
    from subjects s join attendance_records ar on ar.subject_id = s.id
    where s.user_id = uid group by s.id, s.name having count(*) >= 3
  loop
    if r.pct < thr then
      insert into notifications(user_id, kind, title, body, link, dedupe_key)
      values (uid, 'attendance_warning', 'Low attendance in ' || r.name, 'Attendance is ' || r.pct || '%, below your ' || thr || '% target.', '/attendance', 'att:' || r.id || ':' || to_char(now(),'IYYY-IW'))
      on conflict do nothing;
    end if;
  end loop;

  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.refresh_my_notifications() from public, anon;
grant execute on function public.refresh_my_notifications() to authenticated;

-- demo data seeding for current user (flagged is_demo)
create or replace function public.seed_my_demo_data() returns void
language plpgsql security definer set search_path=public as $$
declare uid uuid := auth.uid(); s1 uuid; s2 uuid; s3 uuid; s4 uuid; s5 uuid; d date; i int; subj uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from subjects where user_id = uid and is_demo) then return; end if;
  insert into subjects(user_id,name,code,faculty,credits,semester,color,is_demo) values (uid,'Python Programming','CS201','Dr. Meera Iyer',4,3,'indigo',true) returning id into s1;
  insert into subjects(user_id,name,code,faculty,credits,semester,color,is_demo) values (uid,'Statistics','MA204','Prof. Arjun Rao',3,3,'violet',true) returning id into s2;
  insert into subjects(user_id,name,code,faculty,credits,semester,color,is_demo) values (uid,'Web Development','CS210','Ms. Kavya Nair',4,3,'sky',true) returning id into s3;
  insert into subjects(user_id,name,code,faculty,credits,semester,color,is_demo) values (uid,'Artificial Intelligence','CS305','Dr. Sameer Khan',4,3,'emerald',true) returning id into s4;
  insert into subjects(user_id,name,code,faculty,credits,semester,color,is_demo) values (uid,'Computer Networks','CS220','Prof. Lina Das',3,3,'amber',true) returning id into s5;

  insert into timetable_entries(user_id,subject_id,day_of_week,start_time,end_time,room,faculty,is_demo) values
  (uid,s1,1,'09:00','10:00','Lab 2','Dr. Meera Iyer',true),(uid,s2,1,'10:15','11:15','Room 104','Prof. Arjun Rao',true),(uid,s3,1,'13:00','14:30','Lab 4','Ms. Kavya Nair',true),
  (uid,s4,2,'09:00','10:30','Room 210','Dr. Sameer Khan',true),(uid,s5,2,'11:00','12:00','Room 108','Prof. Lina Das',true),
  (uid,s1,3,'09:00','10:00','Lab 2','Dr. Meera Iyer',true),(uid,s3,3,'11:00','12:30','Lab 4','Ms. Kavya Nair',true),(uid,s2,3,'14:00','15:00','Room 104','Prof. Arjun Rao',true),
  (uid,s4,4,'10:00','11:30','Room 210','Dr. Sameer Khan',true),(uid,s5,4,'13:00','14:00','Room 108','Prof. Lina Das',true),
  (uid,s1,5,'09:00','10:30','Lab 2','Dr. Meera Iyer',true),(uid,s2,5,'11:00','12:00','Room 104','Prof. Arjun Rao',true),
  (uid,s3,0,'10:00','11:00','Online','Ms. Kavya Nair',true),(uid,s4,6,'10:00','11:00','Room 210','Dr. Sameer Khan',true);

  insert into assignments(user_id,subject_id,title,due_at,priority,status,is_demo) values
  (uid,s1,'Python mini project: CLI todo app', now() + interval '1 day', 'high','pending',true),
  (uid,s2,'Probability problem set 3', now() + interval '3 days','medium','pending',true),
  (uid,s3,'Responsive portfolio page', now() - interval '1 day','high','pending',true),
  (uid,s4,'Search algorithms report', now() + interval '6 days','medium','pending',true),
  (uid,s5,'Subnetting worksheet', now() - interval '4 days','low','submitted',true),
  (uid,s1,'Loops & functions exercises', now() - interval '8 days','low','completed',true);

  insert into exams(user_id,subject_id,name,exam_type,starts_at,duration_minutes,room,is_demo) values
  (uid,s2,'Statistics Quiz 2','quiz', date_trunc('day', now()) + interval '2 days 10 hours',45,'Room 104',true),
  (uid,s1,'Python Midterm','midterm', date_trunc('day', now()) + interval '9 days 9 hours',120,'Hall A',true),
  (uid,s3,'Web Dev Practical','practical', date_trunc('day', now()) + interval '14 days 13 hours',90,'Lab 4',true),
  (uid,s4,'AI Viva','viva', date_trunc('day', now()) + interval '21 days 11 hours',20,'Room 210',true);

  for i in 1..24 loop
    d := current_date - (i * 2);
    foreach subj in array array[s1,s2,s3,s4,s5] loop
      if random() < 0.5 then
        insert into attendance_records(user_id,subject_id,date,status,is_demo)
        values (uid,subj,d, case when (subj = s5 and random() < 0.4) or random() < 0.12 then 'absent'::attendance_status else 'present'::attendance_status end, true);
      end if;
    end loop;
  end loop;

  insert into tasks(user_id,title,due_at,priority,category,completed,is_demo) values
  (uid,'Review lecture notes for Statistics', now() + interval '5 hours','medium','Study',false,true),
  (uid,'Email project partner about AI report', now() + interval '1 day','low','Admin',false,true),
  (uid,'Practice 10 Python problems', now() - interval '1 day','high','Study',false,true),
  (uid,'Pay library fine', now() + interval '4 days','low','Personal',false,true),
  (uid,'Set up GitHub repo for portfolio', now() - interval '3 days','medium','Project',true,true);

  insert into notes(user_id,subject_id,title,content,pinned,is_demo) values
  (uid,s1,'Python loops cheatsheet', E'for item in items:\n    ...\n\nwhile cond:\n    ...\n\nUse enumerate() for index + value.',true,true),
  (uid,s2,'Bayes theorem', E'P(A|B) = P(B|A) P(A) / P(B)\n\nRemember to define events clearly before computing.',false,true),
  (uid,s5,'OSI layers', E'Physical, Data Link, Network, Transport, Session, Presentation, Application.',false,true);

  insert into performance_records(user_id,subject_id,title,score,max_score,assessed_on,is_demo) values
  (uid,s1,'Quiz 1',18,20,current_date - 60,true),(uid,s1,'Assignment 1',42,50,current_date - 35,true),(uid,s1,'Quiz 2',17,20,current_date - 10,true),
  (uid,s2,'Quiz 1',13,20,current_date - 55,true),(uid,s2,'Test 1',31,50,current_date - 30,true),(uid,s2,'Quiz 2',15,20,current_date - 8,true),
  (uid,s3,'Project 1',45,50,current_date - 50,true),(uid,s3,'Quiz 1',16,20,current_date - 20,true),
  (uid,s4,'Quiz 1',14,20,current_date - 45,true),(uid,s4,'Report 1',38,50,current_date - 15,true),
  (uid,s5,'Quiz 1',11,20,current_date - 40,true),(uid,s5,'Lab test',28,50,current_date - 12,true);
end $$;
revoke execute on function public.seed_my_demo_data() from public, anon;
grant execute on function public.seed_my_demo_data() to authenticated;

create or replace function public.clear_my_demo_data() returns void
language plpgsql security definer set search_path=public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  delete from tasks where user_id = uid and is_demo;
  delete from subjects where user_id = uid and is_demo; -- cascades
  delete from assignments where user_id = uid and is_demo;
  delete from exams where user_id = uid and is_demo;
  delete from notes where user_id = uid and is_demo;
  delete from notifications where user_id = uid;
end $$;
revoke execute on function public.clear_my_demo_data() from public, anon;
grant execute on function public.clear_my_demo_data() to authenticated;
