create extension if not exists pgcrypto;

create table if not exists public.trip_maps (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My Fishing Atlas',
  share_slug text not null unique,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.destinations (
  id uuid primary key,
  trip_map_id uuid not null references public.trip_maps(id) on delete cascade,
  title text not null,
  expedition_id uuid null,
  expedition_name text null,
  stop_order integer null,
  transport_from_previous jsonb null,
  city text null,
  country text not null,
  region text null,
  lat double precision not null,
  lng double precision not null,
  status text not null check (status in ('planned', 'visited')),
  water_type text null check (water_type in ('saltwater', 'freshwater', 'urban')),
  season text null,
  start_date date null,
  end_date date null,
  trip_date text null,
  summary text null,
  notes text null,
  species text[] not null default '{}',
  techniques text[] not null default '{}',
  tags text[] not null default '{}',
  guide_info jsonb null,
  boat_info jsonb null,
  rating integer null,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists destinations_trip_map_id_idx on public.destinations (trip_map_id);
create index if not exists destinations_expedition_id_idx on public.destinations (expedition_id);

create table if not exists public.destination_images (
  id uuid primary key,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  storage_path text null,
  public_url text not null,
  caption text null,
  alt text null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists destination_images_destination_id_idx on public.destination_images (destination_id);

alter table public.trip_maps enable row level security;
alter table public.destinations enable row level security;
alter table public.destination_images enable row level security;

drop policy if exists "trip maps owner full access" on public.trip_maps;
create policy "trip maps owner full access"
on public.trip_maps
for all
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "trip maps public read" on public.trip_maps;
create policy "trip maps public read"
on public.trip_maps
for select
using (is_public = true);

drop policy if exists "destinations owner full access" on public.destinations;
create policy "destinations owner full access"
on public.destinations
for all
using (
  exists (
    select 1
    from public.trip_maps
    where public.trip_maps.id = public.destinations.trip_map_id
      and public.trip_maps.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trip_maps
    where public.trip_maps.id = public.destinations.trip_map_id
      and public.trip_maps.owner_user_id = auth.uid()
  )
);

drop policy if exists "destinations public read" on public.destinations;
create policy "destinations public read"
on public.destinations
for select
using (
  exists (
    select 1
    from public.trip_maps
    where public.trip_maps.id = public.destinations.trip_map_id
      and public.trip_maps.is_public = true
  )
);

drop policy if exists "destination images owner full access" on public.destination_images;
create policy "destination images owner full access"
on public.destination_images
for all
using (
  exists (
    select 1
    from public.destinations
    join public.trip_maps on public.trip_maps.id = public.destinations.trip_map_id
    where public.destinations.id = public.destination_images.destination_id
      and public.trip_maps.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.destinations
    join public.trip_maps on public.trip_maps.id = public.destinations.trip_map_id
    where public.destinations.id = public.destination_images.destination_id
      and public.trip_maps.owner_user_id = auth.uid()
  )
);

drop policy if exists "destination images public read" on public.destination_images;
create policy "destination images public read"
on public.destination_images
for select
using (
  exists (
    select 1
    from public.destinations
    join public.trip_maps on public.trip_maps.id = public.destinations.trip_map_id
    where public.destinations.id = public.destination_images.destination_id
      and public.trip_maps.is_public = true
  )
);

insert into storage.buckets (id, name, public)
values ('destination-images', 'destination-images', true)
on conflict (id) do nothing;

update storage.buckets
set public = true
where id = 'destination-images';

drop policy if exists "destination image upload by owner" on storage.objects;
create policy "destination image upload by owner"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'destination-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "destination image update by owner" on storage.objects;
create policy "destination image update by owner"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'destination-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'destination-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "destination image delete by owner" on storage.objects;
create policy "destination image delete by owner"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'destination-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "destination image read public" on storage.objects;
create policy "destination image read public"
on storage.objects
for select
to public
using (
  bucket_id = 'destination-images'
);
