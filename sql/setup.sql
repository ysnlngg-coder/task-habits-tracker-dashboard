-- الصق هذا كله في Supabase > SQL Editor ثم Run

create table public.tracker_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.tracker_state enable row level security;

create policy "own select" on public.tracker_state for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on public.tracker_state for insert to authenticated with check (auth.uid() = user_id);
create policy "own update" on public.tracker_state for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own delete" on public.tracker_state for delete to authenticated using (auth.uid() = user_id);

-- مخزن خاص لملفات الموسيقى، لكل مستخدم مجلد باسم id حسابه
insert into storage.buckets (id, name, public) values ('music', 'music', false) on conflict (id) do nothing;

create policy "own music select" on storage.objects for select to authenticated using (bucket_id = 'music' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own music insert" on storage.objects for insert to authenticated with check (bucket_id = 'music' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own music update" on storage.objects for update to authenticated using (bucket_id = 'music' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own music delete" on storage.objects for delete to authenticated using (bucket_id = 'music' and (storage.foldername(name))[1] = auth.uid()::text);
