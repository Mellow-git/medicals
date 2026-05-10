
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  age integer,
  blood_type text,
  allergies text,
  conditions text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Medications
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  notes text,
  start_date date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.medications enable row level security;
create policy "own meds all" on public.medications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Gallery
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  image_url text not null,
  medicine_name text,
  notes text,
  ai_analysis text,
  created_at timestamptz not null default now()
);
alter table public.gallery_items enable row level security;
create policy "own gallery all" on public.gallery_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Chat messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  conversation_id uuid not null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
create policy "own chats all" on public.chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto profile creation
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Storage
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true);
create policy "gallery read" on storage.objects for select using (bucket_id = 'gallery');
create policy "gallery upload own" on storage.objects for insert with check (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "gallery update own" on storage.objects for update using (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "gallery delete own" on storage.objects for delete using (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);
