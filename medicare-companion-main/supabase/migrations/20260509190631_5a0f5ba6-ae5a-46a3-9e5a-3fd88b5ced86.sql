
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop policy "gallery read" on storage.objects;
create policy "gallery public read individual" on storage.objects for select using (bucket_id = 'gallery');
