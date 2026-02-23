-- Complete DataRand Database Setup
-- Run this in Supabase SQL Editor to ensure all functions and tables are deployed

-- ============================================
-- 1. DELETE USER ACCOUNT FUNCTION
-- ============================================
create or replace function delete_user_account(p_profile_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Delete in order to respect foreign key constraints
  -- Only delete from tables that exist
  
  -- Delete notifications (if table exists)
  if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'notifications') then
    delete from public.notifications where user_id = p_profile_id;
  end if;
  
  -- Delete withdrawal requests (if table exists)
  if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'withdrawal_requests') then
    delete from public.withdrawal_requests where profile_id = p_profile_id;
  end if;
  
  -- Delete transactions (if table exists)
  if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'transactions') then
    delete from public.transactions where profile_id = p_profile_id;
  end if;
  
  -- Delete task assignments (this will cascade to related records)
  delete from public.task_assignments where worker_id = p_profile_id;
  
  -- Delete compute devices
  delete from public.compute_devices where user_id = p_profile_id;
  
  -- Delete compute sessions
  delete from public.compute_sessions where worker_id = p_profile_id;
  
  -- Delete tasks created by this user (if they're a client)
  delete from public.tasks where client_id = p_profile_id;
  
  -- Finally, delete the profile
  delete from public.profiles where id = p_profile_id;
end;
$$;

grant execute on function delete_user_account(uuid) to authenticated;

-- ============================================
-- 2. COMPUTE DEVICES & NETWORK STATS
-- ============================================

-- Ensure compute_devices table exists
create table if not exists public.compute_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_name text,
  device_type text check (device_type in ('phone', 'laptop', 'desktop', 'server')),
  ram_gb numeric not null default 0,
  cpu_cores integer not null default 0,
  storage_gb numeric not null default 0,
  compute_score numeric not null default 0,
  is_active boolean not null default false,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compute score calculation function
create or replace function calculate_compute_score(
  p_ram_gb numeric,
  p_cpu_cores integer,
  p_storage_gb numeric
)
returns numeric as $$
begin
  return (p_ram_gb * 2) + (p_cpu_cores * 5) + (p_storage_gb * 0.05);
end;
$$ language plpgsql;

-- Trigger to auto-update compute score
create or replace function update_compute_score()
returns trigger as $$
begin
  new.compute_score := calculate_compute_score(new.ram_gb, new.cpu_cores, new.storage_gb);
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_compute_score on public.compute_devices;
create trigger trigger_update_compute_score
  before insert or update
  on public.compute_devices
  for each row
  execute function update_compute_score();

-- Network stats aggregation function
create or replace function get_network_stats()
returns table (
  active_nodes bigint,
  total_ram_gb numeric,
  total_cpu_cores bigint,
  total_storage_gb numeric,
  total_compute_score numeric
) as $$
begin
  return query
  select
    count(*)::bigint as active_nodes,
    coalesce(sum(ram_gb), 0) as total_ram_gb,
    coalesce(sum(cpu_cores), 0)::bigint as total_cpu_cores,
    coalesce(sum(storage_gb), 0) as total_storage_gb,
    coalesce(sum(compute_score), 0) as total_compute_score
  from public.compute_devices
  where is_active = true
    and last_seen > now() - interval '5 minutes';
end;
$$ language plpgsql;

-- ============================================
-- 3. COMPUTE SESSIONS & EDUCATION FUND
-- ============================================

-- Ensure compute_sessions table exists
create table if not exists public.compute_sessions (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  device_type text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_earned numeric not null default 0,
  earnings_rate numeric not null default 0.001,
  is_active boolean not null default false
);

-- Ensure education_fund_stats table exists
create table if not exists public.education_fund_stats (
  id uuid primary key default gen_random_uuid(),
  region text unique not null default 'global',
  total_raised numeric not null default 0,
  children_enrolled integer not null default 0,
  last_updated timestamptz not null default now()
);

-- Seed education fund stats
insert into public.education_fund_stats(region, total_raised, children_enrolled)
values ('global', 0, 0)
on conflict (region) do nothing;

-- ============================================
-- 4. INDEXES
-- ============================================

create index if not exists idx_compute_devices_active on public.compute_devices(is_active, last_seen);
create index if not exists idx_compute_devices_user on public.compute_devices(user_id);
create index if not exists idx_compute_sessions_worker on public.compute_sessions(worker_id);

-- ============================================
-- 5. RLS POLICIES
-- ============================================

alter table public.compute_devices enable row level security;
alter table public.compute_sessions enable row level security;
alter table public.education_fund_stats enable row level security;

-- Compute devices policies
drop policy if exists "Users can view their own devices" on public.compute_devices;
create policy "Users can view their own devices"
  on public.compute_devices for select
  using (user_id in (select id from public.profiles where auth_id::text = auth.uid()::text));

drop policy if exists "Users can insert their own devices" on public.compute_devices;
create policy "Users can insert their own devices"
  on public.compute_devices for insert
  with check (user_id in (select id from public.profiles where auth_id::text = auth.uid()::text));

drop policy if exists "Users can update their own devices" on public.compute_devices;
create policy "Users can update their own devices"
  on public.compute_devices for update
  using (user_id in (select id from public.profiles where auth_id::text = auth.uid()::text));

-- Compute sessions policies
drop policy if exists "compute_sessions_select_all" on public.compute_sessions;
create policy "compute_sessions_select_all" on public.compute_sessions for select using (true);

drop policy if exists "compute_sessions_insert_all" on public.compute_sessions;
create policy "compute_sessions_insert_all" on public.compute_sessions for insert with check (true);

-- Education fund policies
drop policy if exists "education_fund_stats_select_all" on public.education_fund_stats;
create policy "education_fund_stats_select_all" on public.education_fund_stats for select using (true);

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

grant execute on function get_network_stats() to authenticated;
grant execute on function calculate_compute_score(numeric, integer, numeric) to authenticated;
grant execute on function delete_user_account(uuid) to authenticated;
