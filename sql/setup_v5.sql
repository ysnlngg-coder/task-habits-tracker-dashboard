-- شغّله مرة واحدة (SQL Editor > Run ثم Run query عند التحذير)

-- ===== الأخبار =====
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 80),
  body text not null check (char_length(body) <= 1000),
  image_url text,
  author text not null default 'yacine',
  created_at timestamptz not null default now()
);
alter table public.news enable row level security;
drop policy if exists "approved read news" on public.news;
drop policy if exists "admin insert news" on public.news;
drop policy if exists "admin delete news" on public.news;
create policy "approved read news" on public.news for select to authenticated using (public.is_approved());
create policy "admin insert news" on public.news for insert to authenticated with check (public.is_admin());
create policy "admin delete news" on public.news for delete to authenticated using (public.is_admin());

alter table public.profiles add column if not exists news_seen_at timestamptz not null default now();
create or replace function public.news_mark_seen() returns void language sql security definer set search_path = public
as $$ update profiles set news_seen_at = now() where id = auth.uid() $$;
grant execute on function public.news_mark_seen() to authenticated;

-- ===== حدود المساعد الذكي: عدد الرسائل اليومي لكل مستخدم =====
create table if not exists public.ai_usage (
  user_id uuid references auth.users(id) on delete cascade,
  day date not null default current_date,
  n int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;

create or replace function public.ai_use(p_limit int) returns int language plpgsql security definer set search_path = public
as $$ declare v int; begin
  if auth.uid() is null or not public.is_approved() then raise exception 'Not allowed'; end if;
  insert into ai_usage(user_id, day, n) values (auth.uid(), current_date, 1)
    on conflict (user_id, day) do update set n = ai_usage.n + 1 returning n into v;
  if v > p_limit then raise exception 'limit reached'; end if;
  return p_limit - v;
end $$;
create or replace function public.ai_left(p_limit int) returns int language sql security definer set search_path = public stable
as $$ select greatest(p_limit - coalesce((select n from ai_usage where user_id = auth.uid() and day = current_date), 0), 0) $$;
grant execute on function public.ai_use(int), public.ai_left(int) to authenticated;

-- أول رسالة أخبار (يمكنك حذفها من لوحة الأدمن)
insert into public.news (title, body)
select 'What''s new', E'✨ Assistant: tap the sparkle icon at the top right to plan your day or get ideas.\n🔔 News: updates from me will appear here.\n🎵 Sound effects: choose which sounds you want in the Music page.\n◎ A cleaner focus timer.'
where not exists (select 1 from public.news);
