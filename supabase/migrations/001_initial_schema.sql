-- ============================================================================
-- Nottura Admin Panel - Initial Supabase Schema & Row Level Security (RLS)
-- Target: PostgreSQL / Supabase
-- Tables: admin_whitelist, family_groups, customers, transactions
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Tabel Whitelist Admin (4 email tim internal Nottura)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_whitelist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_whitelist_lower_email
  on public.admin_whitelist (lower(email));

-- ----------------------------------------------------------------------------
-- 2. Tabel Grup Family Sharing / Akun Induk Google AI Pro
-- ----------------------------------------------------------------------------
create table if not exists public.family_groups (
  id uuid primary key default gen_random_uuid(),
  group_name text not null unique,
  manager_email text not null,
  group_type text not null default 'shared' check (group_type in ('shared', 'full')),
  max_slots integer not null default 5 check (max_slots > 0),
  master_expired_at date not null,
  status text not null default 'active' check (status in ('active', 'full', 'suspended')),
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. Tabel Pelanggan
-- ----------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp text not null check (whatsapp ~ '^62[0-9]{8,15}$'),
  gmail text not null,
  family_group_id uuid references public.family_groups (id) on delete set null,
  package_name text not null,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_customers_family_group_id
  on public.customers (family_group_id);

create index if not exists idx_customers_end_date
  on public.customers (end_date);

create index if not exists idx_customers_lower_gmail
  on public.customers (lower(gmail));

-- ----------------------------------------------------------------------------
-- 4. Tabel Transaksi Keuangan (Cashflow)
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  category text not null check (category in ('new_order', 'renewal', 'account_cost', 'operational')),
  amount integer not null check (amount >= 0),
  customer_id uuid references public.customers (id) on delete set null,
  payment_method text check (payment_method is null or payment_method in ('QRIS', 'Transfer', 'Cash', 'Lainnya')),
  description text,
  transaction_date date not null default current_date,
  recorded_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_transaction_date
  on public.transactions (transaction_date);

create index if not exists idx_transactions_type_date
  on public.transactions (type, transaction_date);

create index if not exists idx_transactions_customer_id
  on public.transactions (customer_id);

-- ----------------------------------------------------------------------------
-- 5. Helper Functions untuk RLS Policy (SECURITY DEFINER)
-- Mengecek apakah email dari JWT Supabase Auth terdaftar di admin_whitelist.
-- ----------------------------------------------------------------------------
create or replace function public.is_whitelisted_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') <> ''
    and exists (
      select 1
      from public.admin_whitelist aw
      where lower(aw.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

create or replace function public.is_whitelisted_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') <> ''
    and exists (
      select 1
      from public.admin_whitelist aw
      where lower(aw.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and aw.role = 'owner'
    );
$$;

revoke all on function public.is_whitelisted_admin() from public;
grant execute on function public.is_whitelisted_admin() to authenticated;

revoke all on function public.is_whitelisted_owner() from public;
grant execute on function public.is_whitelisted_owner() to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Aktifkan Row Level Security (RLS) di seluruh tabel
-- ----------------------------------------------------------------------------
alter table public.admin_whitelist enable row level security;
alter table public.family_groups enable row level security;
alter table public.customers enable row level security;
alter table public.transactions enable row level security;

-- Policies: admin_whitelist
drop policy if exists "admin_whitelist_select_whitelisted" on public.admin_whitelist;
create policy "admin_whitelist_select_whitelisted"
  on public.admin_whitelist
  for select
  to authenticated
  using (public.is_whitelisted_admin());

drop policy if exists "admin_whitelist_insert_owner" on public.admin_whitelist;
create policy "admin_whitelist_insert_owner"
  on public.admin_whitelist
  for insert
  to authenticated
  with check (public.is_whitelisted_owner());

drop policy if exists "admin_whitelist_update_owner" on public.admin_whitelist;
create policy "admin_whitelist_update_owner"
  on public.admin_whitelist
  for update
  to authenticated
  using (public.is_whitelisted_owner())
  with check (public.is_whitelisted_owner());

drop policy if exists "admin_whitelist_delete_owner" on public.admin_whitelist;
create policy "admin_whitelist_delete_owner"
  on public.admin_whitelist
  for delete
  to authenticated
  using (public.is_whitelisted_owner());

-- Policies: family_groups
drop policy if exists "family_groups_select_whitelisted" on public.family_groups;
create policy "family_groups_select_whitelisted"
  on public.family_groups
  for select
  to authenticated
  using (public.is_whitelisted_admin());

drop policy if exists "family_groups_insert_whitelisted" on public.family_groups;
create policy "family_groups_insert_whitelisted"
  on public.family_groups
  for insert
  to authenticated
  with check (public.is_whitelisted_admin());

drop policy if exists "family_groups_update_whitelisted" on public.family_groups;
create policy "family_groups_update_whitelisted"
  on public.family_groups
  for update
  to authenticated
  using (public.is_whitelisted_admin())
  with check (public.is_whitelisted_admin());

drop policy if exists "family_groups_delete_whitelisted" on public.family_groups;
create policy "family_groups_delete_whitelisted"
  on public.family_groups
  for delete
  to authenticated
  using (public.is_whitelisted_admin());

-- Policies: customers
drop policy if exists "customers_select_whitelisted" on public.customers;
create policy "customers_select_whitelisted"
  on public.customers
  for select
  to authenticated
  using (public.is_whitelisted_admin());

drop policy if exists "customers_insert_whitelisted" on public.customers;
create policy "customers_insert_whitelisted"
  on public.customers
  for insert
  to authenticated
  with check (public.is_whitelisted_admin());

drop policy if exists "customers_update_whitelisted" on public.customers;
create policy "customers_update_whitelisted"
  on public.customers
  for update
  to authenticated
  using (public.is_whitelisted_admin())
  with check (public.is_whitelisted_admin());

drop policy if exists "customers_delete_whitelisted" on public.customers;
create policy "customers_delete_whitelisted"
  on public.customers
  for delete
  to authenticated
  using (public.is_whitelisted_admin());

-- Policies: transactions
drop policy if exists "transactions_select_whitelisted" on public.transactions;
create policy "transactions_select_whitelisted"
  on public.transactions
  for select
  to authenticated
  using (public.is_whitelisted_admin());

drop policy if exists "transactions_insert_whitelisted" on public.transactions;
create policy "transactions_insert_whitelisted"
  on public.transactions
  for insert
  to authenticated
  with check (public.is_whitelisted_admin());

drop policy if exists "transactions_update_whitelisted" on public.transactions;
create policy "transactions_update_whitelisted"
  on public.transactions
  for update
  to authenticated
  using (public.is_whitelisted_admin())
  with check (public.is_whitelisted_admin());

drop policy if exists "transactions_delete_whitelisted" on public.transactions;
create policy "transactions_delete_whitelisted"
  on public.transactions
  for delete
  to authenticated
  using (public.is_whitelisted_admin());
