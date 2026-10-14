-- شغّله بعد setup.sql (SQL Editor > Run). غيّر الإيميل في آخر الملف إن لزم.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, name text,
  role text not null default 'user' check (role in ('user','admin')),
  status text not null default 'pending' check (status in ('pending','approved','blocked')),
  created_at timestamptz default now(),
  last_seen timestamptz,
  stats jsonb not null default '{}'::jsonb
);
alter table public.profiles enable row level security;

create or replace function public.is_admin() returns boolean language sql security definer set search_path = public stable
as $$ select exists(select 1 from profiles where id = auth.uid() and role = 'admin' and status = 'approved') $$;
create or replace function public.is_approved() returns boolean language sql security definer set search_path = public stable
as $$ select exists(select 1 from profiles where id = auth.uid() and status = 'approved') $$;

create policy "read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "admin read all" on public.profiles for select to authenticated using (public.is_admin());
create policy "admin update all" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- كل مستخدم جديد يدخل بحالة pending حتى توافق عليه
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into profiles(id, email, name) values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- المستخدم يحدّث إحصائياته فقط (أرقام عامة، بدون محتوى عاداته)
create or replace function public.update_my_stats(p_habits int, p_streak int, p_week jsonb) returns void
language sql security definer set search_path = public
as $$ update profiles set last_seen = now(), stats = jsonb_build_object('habits', p_habits, 'streak', p_streak, 'week', p_week) where id = auth.uid() $$;

-- المستخدمون الموجودون الآن يصبحون approved
insert into public.profiles(id, email, name, status)
select id, email, coalesce(nullif(raw_user_meta_data->>'name',''), split_part(email,'@',1)), 'approved' from auth.users on conflict (id) do nothing;

-- البيانات والموسيقى لا تُفتح إلا للمعتمدين، فالحظر يسري فورًا
drop policy if exists "own select" on public.tracker_state;
drop policy if exists "own insert" on public.tracker_state;
drop policy if exists "own update" on public.tracker_state;
drop policy if exists "own delete" on public.tracker_state;
create policy "own select" on public.tracker_state for select to authenticated using (auth.uid() = user_id and public.is_approved());
create policy "own insert" on public.tracker_state for insert to authenticated with check (auth.uid() = user_id and public.is_approved());
create policy "own update" on public.tracker_state for update to authenticated using (auth.uid() = user_id and public.is_approved()) with check (auth.uid() = user_id and public.is_approved());
create policy "own delete" on public.tracker_state for delete to authenticated using (auth.uid() = user_id and public.is_approved());

drop policy if exists "own music select" on storage.objects;
drop policy if exists "own music insert" on storage.objects;
drop policy if exists "own music update" on storage.objects;
drop policy if exists "own music delete" on storage.objects;
create policy "own music select" on storage.objects for select to authenticated using (bucket_id = 'music' and (storage.foldername(name))[1] = auth.uid()::text and public.is_approved());
create policy "own music insert" on storage.objects for insert to authenticated with check (bucket_id = 'music' and (storage.foldername(name))[1] = auth.uid()::text and public.is_approved());
create policy "own music update" on storage.objects for update to authenticated using (bucket_id = 'music' and (storage.foldername(name))[1] = auth.uid()::text and public.is_approved());
create policy "own music delete" on storage.objects for delete to authenticated using (bucket_id = 'music' and (storage.foldername(name))[1] = auth.uid()::text and public.is_approved());

-- أنت الأدمن
update public.profiles set role = 'admin', status = 'approved' where email = 'ysnlngg@gmail.com';
