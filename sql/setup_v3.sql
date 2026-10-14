-- شغّله مرة واحدة (SQL Editor > Run)

-- 1) فحص وجود الإيميل مع حد للمحاولات: 10 في الدقيقة لكل عنوان IP
create table if not exists public.rl (ip text, ts timestamptz default now());
alter table public.rl enable row level security;
create or replace function public.email_exists(p_email text) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_ip text := coalesce(nullif(nullif(current_setting('request.headers', true), '')::json->>'x-forwarded-for', ''), '?');
begin
  delete from rl where ts < now() - interval '10 minutes';
  if (select count(*) from rl where rl.ip = v_ip and ts > now() - interval '1 minute') >= 10 then
    raise exception 'Too many attempts';
  end if;
  insert into rl(ip) values (v_ip);
  return exists(select 1 from auth.users where lower(email) = lower(trim(p_email)));
end $$;
grant execute on function public.email_exists(text) to anon, authenticated;

-- 2) سقف لطلبات الانتظار: لو وصلت 25 طلبًا معلقًا يُرفض التسجيل الجديد (يمنع إغراق لوحتك بطلبات وهمية)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if (select count(*) from profiles where status = 'pending') >= 25 then raise exception 'Registrations are full'; end if;
  insert into profiles(id, email, name) values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)));
  return new;
end $$;

-- لإعادة شخص إلى قائمة الانتظار (غيّر الإيميل):
-- update public.profiles set status = 'pending' where email = 'someone@example.com';
