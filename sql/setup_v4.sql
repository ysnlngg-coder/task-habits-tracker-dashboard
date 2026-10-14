-- شغّله مرة واحدة (SQL Editor > Run ثم Run query عند التحذير)

alter table public.profiles add column if not exists visits int not null default 0;
alter table public.profiles add column if not exists last_login timestamptz;

-- زيارة جديدة للصفحة، ونبضة كل دقيقتين لمعرفة من هو متصل الآن
create or replace function public.touch_visit() returns void language sql security definer set search_path = public
as $$ update profiles set visits = visits + 1, last_login = now(), last_seen = now() where id = auth.uid() $$;
create or replace function public.heartbeat() returns void language sql security definer set search_path = public
as $$ update profiles set last_seen = now() where id = auth.uid() $$;
grant execute on function public.touch_visit(), public.heartbeat() to authenticated;

-- حذف مستخدم نهائيًا (للأدمن فقط): يحذف حسابه وبياناته، ولا يمكنك حذف نفسك
create or replace function public.admin_remove_user(p_id uuid) returns void language plpgsql security definer set search_path = public
as $$ begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  if p_id = auth.uid() then raise exception 'You cannot remove yourself'; end if;
  delete from auth.users where id = p_id;
end $$;
revoke all on function public.admin_remove_user(uuid) from public, anon;
grant execute on function public.admin_remove_user(uuid) to authenticated;

-- يسمح للأدمن بمسح ملفات موسيقى من يحذفه
drop policy if exists "admin music select" on storage.objects;
drop policy if exists "admin music delete" on storage.objects;
create policy "admin music select" on storage.objects for select to authenticated using (bucket_id = 'music' and public.is_admin());
create policy "admin music delete" on storage.objects for delete to authenticated using (bucket_id = 'music' and public.is_admin());
