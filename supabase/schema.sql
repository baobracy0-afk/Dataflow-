-- DataFlow authentication + multi-tenant RBAC + RLS
create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
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

insert into public.roles(name) values
('SUPER_ADMIN'),('ADMIN_ENTREPRISE'),('MEMBRE')
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

create index if not exists idx_company_members_company on public.company_members(company_id);
create index if not exists idx_company_members_user on public.company_members(user_id);
create index if not exists idx_activity_logs_company_created on public.activity_logs(company_id,created_at desc);
create index if not exists idx_invitations_company on public.invitations(company_id);
create index if not exists idx_subscriptions_company on public.subscriptions(company_id);

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path=public
as $$
  select exists (
    select 1 from public.company_members cm
    join public.roles r on r.id=cm.role_id
    where cm.user_id=auth.uid() and cm.status='active' and r.name='SUPER_ADMIN'
  );
$$;

create or replace function public.current_company_ids()
returns setof uuid language sql stable security definer set search_path=public
as $$
  select c.id from public.companies c
  where public.is_super_admin()
     or exists (
       select 1 from public.company_members cm
       where cm.company_id=c.id and cm.user_id=auth.uid() and cm.status='active'
     );
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
    where cm.user_id=auth.uid()
      and cm.company_id=p_company_id
      and cm.status='active'
      and (r.name in ('SUPER_ADMIN','ADMIN_ENTREPRISE') or p.code=p_permission)
  );
$$;

create or replace function public.create_company_for_current_user(p_company_name text)
returns uuid language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_company uuid;
  v_role uuid;
  v_email text;
  v_name text;
begin
  if v_user is null then raise exception 'UNAUTHORIZED'; end if;
  if length(trim(coalesce(p_company_name,''))) < 2 then raise exception 'INVALID_COMPANY_NAME'; end if;

  if exists(select 1 from public.company_members where user_id=v_user) then
    select company_id into v_company
    from public.company_members
    where user_id=v_user
    order by joined_at limit 1;
    return v_company;
  end if;

  select email, coalesce(raw_user_meta_data->>'full_name','')
    into v_email, v_name
  from auth.users where id=v_user;

  insert into public.users(id,full_name,email)
  values(v_user,coalesce(v_name,''),coalesce(v_email,''))
  on conflict(id) do update set full_name=excluded.full_name,email=excluded.email;

  insert into public.companies(name) values(trim(p_company_name)) returning id into v_company;
  select id into v_role from public.roles where name='ADMIN_ENTREPRISE';

  insert into public.company_members(company_id,user_id,role_id)
  values(v_company,v_user,v_role);

  insert into public.subscriptions(company_id,plan,status,expires_at)
  values(v_company,'trial','trialing',now()+interval '7 days');

  insert into public.activity_logs(company_id,user_id,action,module,metadata)
  values(v_company,v_user,'company_created','administration',jsonb_build_object('source','signup'));

  return v_company;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.users(id,full_name,email)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),coalesce(new.email,''))
  on conflict(id) do update set full_name=excluded.full_name,email=excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.company_members enable row level security;
alter table public.member_permissions enable row level security;
alter table public.invitations enable row level security;
alter table public.subscriptions enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists company_isolation_select on public.companies;
create policy company_isolation_select on public.companies
for select to authenticated using (id in (select public.current_company_ids()));

drop policy if exists company_admin_update on public.companies;
create policy company_admin_update on public.companies
for update to authenticated
using (public.has_company_permission(id,'COMPANY_SETTINGS_EDIT'))
with check (public.has_company_permission(id,'COMPANY_SETTINGS_EDIT'));

drop policy if exists user_self_select on public.users;
create policy user_self_select on public.users
for select to authenticated using (id=auth.uid() or public.is_super_admin());

drop policy if exists roles_select_authenticated on public.roles;
create policy roles_select_authenticated on public.roles
for select to authenticated using (true);

drop policy if exists permissions_select_authenticated on public.permissions;
create policy permissions_select_authenticated on public.permissions
for select to authenticated using (true);

drop policy if exists member_select on public.company_members;
create policy member_select on public.company_members
for select to authenticated using (company_id in (select public.current_company_ids()));

drop policy if exists member_insert on public.company_members;
create policy member_insert on public.company_members
for insert to authenticated
with check (
  public.has_company_permission(company_id,'MEMBERS_INVITE')
  and role_id in (select id from public.roles where name in ('ADMIN_ENTREPRISE','MEMBRE'))
);

drop policy if exists member_update on public.company_members;
create policy member_update on public.company_members
for update to authenticated
using (
  company_id in (select public.current_company_ids())
  and (
    public.is_super_admin()
    or (public.has_company_permission(company_id,'MEMBERS_EDIT')
        and role_id <> (select id from public.roles where name='SUPER_ADMIN'))
  )
)
with check (
  company_id in (select public.current_company_ids())
  and (
    public.is_super_admin()
    or (public.has_company_permission(company_id,'MEMBERS_EDIT')
        and role_id in (select id from public.roles where name in ('ADMIN_ENTREPRISE','MEMBRE')))
  )
);

drop policy if exists member_delete on public.company_members;
create policy member_delete on public.company_members
for delete to authenticated
using (
  public.has_company_permission(company_id,'MEMBERS_DELETE')
  and (
    public.is_super_admin()
    or role_id = (select id from public.roles where name='MEMBRE')
    or (
      role_id = (select id from public.roles where name='ADMIN_ENTREPRISE')
      and exists (
        select 1 from public.company_members cm2
        join public.roles r2 on r2.id=cm2.role_id
        where cm2.company_id=company_members.company_id
          and cm2.status='active'
          and r2.name='ADMIN_ENTREPRISE'
          and cm2.id<>company_members.id
      )
    )
  )
  and (public.is_super_admin() or role_id <> (select id from public.roles where name='SUPER_ADMIN'))
);

drop policy if exists permission_select on public.member_permissions;
create policy permission_select on public.member_permissions
for select to authenticated using (
  exists(select 1 from public.company_members cm
         where cm.id=member_permissions.member_id
           and cm.company_id in (select public.current_company_ids()))
);

drop policy if exists permission_manage on public.member_permissions;
create policy permission_manage on public.member_permissions
for all to authenticated
using (
  exists(select 1 from public.company_members cm
         where cm.id=member_permissions.member_id
           and public.has_company_permission(cm.company_id,'MEMBERS_EDIT')
           and cm.role_id <> (select id from public.roles where name='SUPER_ADMIN'))
)
with check (
  exists(select 1 from public.company_members cm
         where cm.id=member_permissions.member_id
           and public.has_company_permission(cm.company_id,'MEMBERS_EDIT')
           and cm.role_id <> (select id from public.roles where name='SUPER_ADMIN'))
);

drop policy if exists invitation_select on public.invitations;
create policy invitation_select on public.invitations
for select to authenticated using (public.has_company_permission(company_id,'MEMBERS_VIEW'));

drop policy if exists invitation_insert on public.invitations;
create policy invitation_insert on public.invitations
for insert to authenticated with check (public.has_company_permission(company_id,'MEMBERS_INVITE'));

drop policy if exists invitation_update on public.invitations;
create policy invitation_update on public.invitations
for update to authenticated
using (public.has_company_permission(company_id,'MEMBERS_INVITE'))
with check (public.has_company_permission(company_id,'MEMBERS_INVITE'));

drop policy if exists subscription_select on public.subscriptions;
create policy subscription_select on public.subscriptions
for select to authenticated using (public.has_company_permission(company_id,'BILLING_VIEW'));

drop policy if exists subscription_manage on public.subscriptions;
create policy subscription_manage on public.subscriptions
for all to authenticated
using (public.has_company_permission(company_id,'BILLING_MANAGE'))
with check (public.has_company_permission(company_id,'BILLING_MANAGE'));

drop policy if exists activity_select on public.activity_logs;
create policy activity_select on public.activity_logs
for select to authenticated using (public.has_company_permission(company_id,'ACTIVITY_LOG_VIEW'));

revoke all on function public.is_super_admin() from public;
revoke all on function public.current_company_ids() from public;
revoke all on function public.has_company_permission(uuid,text) from public;
revoke all on function public.create_company_for_current_user(text) from public;
revoke all on function public.handle_new_auth_user() from public;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.current_company_ids() to authenticated;
grant execute on function public.has_company_permission(uuid,text) to authenticated;
grant execute on function public.create_company_for_current_user(text) to authenticated;
