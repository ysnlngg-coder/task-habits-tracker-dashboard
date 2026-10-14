-- حدود الأمان والأداء (SQL Editor > Run ثم Run query عند التحذير)

-- 1) حجم بيانات كل مستخدم لا يتجاوز ~500 كيلوبايت (يمنع تضخم الجدول)
alter table public.tracker_state drop constraint if exists tracker_state_size;
alter table public.tracker_state add constraint tracker_state_size check (octet_length(data::text) <= 500000);

-- 2) مخزن الموسيقى: ملفات صوتية فقط، وبحد 20 ميغابايت للملف الواحد
update storage.buckets set file_size_limit = 20971520, allowed_mime_types = array['audio/*'] where id = 'music';

-- 3) سقف مساحة الموسيقى لكل مستخدم: 150 ميغابايت
drop policy if exists "own music insert" on storage.objects;
create policy "own music insert" on storage.objects for insert to authenticated
with check (
  bucket_id = 'music' and (storage.foldername(name))[1] = auth.uid()::text and public.is_approved()
  and (select coalesce(sum((o.metadata->>'size')::bigint), 0) from storage.objects o
       where o.bucket_id = 'music' and (storage.foldername(o.name))[1] = auth.uid()::text) < 157286400
);
