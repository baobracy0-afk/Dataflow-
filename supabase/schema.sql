-- DataFlow RBAC / multi-tenant schema
create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null check (name in ('SUPER_ADMIN','ADMIN_ENTREPRISE','MEMBRE'))
);

insert into public.roles(name) values ('SUPER_ADMIN'),('ADMIN_ENTREPRISE'),('MEMBRE')
on conflict (name) do nothing;

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null
);

insert into public.permissions(code) values
('CLIENTS_VIEW'),('CLIENTS_CREATE'),('CLIENTS_EDIT'),('CLIENTS_DELETE'),
('PROSPECTS_VIEW'),('PROSPECTS_CREATE'),('PROSPECTS_EDIT'),('PROSPECTS_DELETE'),
('PARTNERS_VIEW'),('PARTNERS_CREATE'),('PARTNERS_EDIT'),('PARTNERS_DELETE'),
('PRODUCTS_VIEW'),('PRODUCTS_CREATE'),('PRODUCTS_EDIT'),('PRODUCTS_DELETE'),
('SALES_VIEW'),('SALES_CREATE'),('SALES_EDIT'),('SALES_DELETE'),
('TASKS_VIEW'),('TASKS_CREATE'),('TASKS_EDIT'),('TASKS_DELETE'),
('STATISTICS_VIEW'),('MEMBERS_VIEW'),('MEMBERS_INVITE'),('MEMBERS_EDIT'),('MEMBERS_DELETE'),
('COMPANY_SETTINGS_VIEW'),('COMPANY_SETTINGS_EDIT'),('BILLING_VIEW'),('BILLING_MANAGE'),
('ACTIVITY_LOG_VIEW')
on conflict (code) do nothing;

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  status text not null default 'active' check (status in ('active','disabled')),
  joined_at timestamptz not null default now(),
  last_activity_at timestamptz,
  unique(company_id,user_id)
);

create table if not exists public.member_permissions (
  member_id uuid not null references public.company_members(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key(member_id,permission_id)
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role_id uuid not null references public.roles(id),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  invited_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan text not null default 'trial',
  status text not null default 'trialing',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  module text,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

-- Existing business tables can use these columns when present.
-- Keep every tenant-owned table keyed by company_id and index it.
create index if not exists idx_company_members_company on public.company_members(company_id);
create index if not exists idx_activity_logs_company_created on public.activity_logs(company_id,created_at desc);
create index if not exists idx_invitations_company on public.invitations(company_id);
create index if not exists idx_subscriptions_company on public.subscriptions(company_id);

create or replace function public.current_company_ids()
returns setof uuid language sql stable security definer set search_path=public
as $$
  select cm.company_id
  from public.company_members cm
  where cm.user_id = auth.uid() and cm.status='active'
$$;

create or replace function public.has_company_permission(p_company_id uuid,p_permission text)
returns boolean language sql stable security definer set search_path=public
as $$
  select exists(
    select 1
    from public.company_members cm
    join public.roles r on r.id=cm.role_id
    left join public.member_permissions mp on mp.member_id=cm.id
    left join public.permissions p on p.id=mp.permission_id
    where cm.user_id=auth.uid() and cm.company_id=p_company_id and cm.status='active'
      and (r.name in ('SUPER_ADMIN','ADMIN_ENTREPRISE') or p.code=p_permission)
  )
$$;

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.member_permissions enable row level security;
alter table public.invitations enable row level security;
alter table public.subscriptions enable row level security;
alter table public.activity_logs enable row level security;
alter table public.users enable row level security;

drop policy if exists company_isolation_select on public.companies;
create policy company_isolation_select on public.companies for select using (
  id in (select public.current_company_ids())
);

drop policy if exists member_isolation on public.company_members;
create policy member_isolation on public.company_members for all using (
  company_id in (select public.current_company_ids())
) with check (
  company_id in (select public.current_company_ids())
);

drop policy if exists permission_isolation on public.member_permissions;
create policy permission_isolation on public.member_permissions for all using (
  exists(select 1 from public.company_members cm where cm.id=member_permissions.member_id and cm.company_id in (select public.current_company_ids()))
) with check (
  exists(select 1 from public.company_members cm where cm.id=member_permissions.member_id and cm.company_id in (select public.current_company_ids()))
);

drop policy if exists invitation_isolation on public.invitations;
create policy invitation_isolation on public.invitations for all using (
  company_id in (select public.current_company_ids())
) with check (
  company_id in (select public.current_company_ids())
);

drop policy if exists subscription_isolation on public.subscriptions;
create policy subscription_isolation on public.subscriptions for select using (
  company_id in (select public.current_company_ids())
);

drop policy if exists activity_isolation on public.activity_logs;
create policy activity_isolation on public.activity_logs for select using (
  company_id in (select public.current_company_ids())
);

drop policy if exists user_self on public.users;
create policy user_self on public.users for select using (id=auth.uid());

-- Prevent normal clients from self-assigning privileged roles/permissions:
-- all role/member mutations should be performed through server-side RPCs/actions
-- after checking the actor's role and company_id.
