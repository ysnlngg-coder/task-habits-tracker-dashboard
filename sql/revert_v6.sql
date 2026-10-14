-- التراجع عن النقاط والمتصدرين (SQL Editor > Run ثم Run query عند التحذير)

drop function if exists public.ai_charge();
drop function if exists public.claim_points(int, int);
drop function if exists public.leaderboard(text);
drop function if exists public.set_board(boolean);

-- المساعد يعود إلى الحد اليومي للرسائل (بلا نقاط)
create or replace function public.ai_use(p_limit int) returns int language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if auth.uid() is null or not public.is_approved() then raise exception 'Not allowed'; end if;
  insert into ai_usage(user_id, day, n) values (auth.uid(), current_date, 1)
    on conflict (user_id, day) do update set n = ai_usage.n + 1 returning n into v;
  if v > p_limit then raise exception 'limit reached'; end if;
  return p_limit - v;
end $$;
create or replace function public.ai_left(p_limit int) returns int language sql security definer set search_path = public stable
as $$ select greatest(p_limit - coalesce((select n from ai_usage where user_id = auth.uid() and day = current_date), 0), 0) $$;

-- اختياري: امسح بيانات النقاط نهائيًا (أزل علامتي -- لتنفيذها)
-- drop table if exists public.daily_points;
-- alter table public.profiles drop column if exists points, drop column if exists xp, drop column if exists show_board;
