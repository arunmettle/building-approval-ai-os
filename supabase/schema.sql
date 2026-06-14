create extension if not exists "pgcrypto";

create table if not exists app_tenants (
  tenant_id text primary key,
  tenant_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists app_operators (
  operator_id text primary key,
  tenant_id text not null references app_tenants (tenant_id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null,
  access_code text,
  created_at timestamptz not null default now()
);

create table if not exists app_sessions (
  token text primary key,
  operator_id text not null references app_operators (operator_id) on delete cascade,
  tenant_id text not null references app_tenants (tenant_id) on delete cascade,
  created_at timestamptz not null,
  last_seen_at timestamptz not null
);

create table if not exists app_cases (
  case_id text primary key,
  tenant_id text not null references app_tenants (tenant_id) on delete cascade,
  project_type text not null,
  jurisdiction_id text,
  address text,
  risk_rating text not null,
  pathway_label text not null,
  assigned_reviewer_id text references app_operators (operator_id),
  assigned_reviewer text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  payload jsonb not null
);

create table if not exists app_curation_reviews (
  item_id text not null,
  tenant_id text not null references app_tenants (tenant_id) on delete cascade,
  status text not null,
  disposition text,
  note text,
  corrected_value text,
  reviewed_at timestamptz,
  reviewed_by jsonb,
  primary key (item_id, tenant_id)
);

create index if not exists app_cases_tenant_updated_idx
  on app_cases (tenant_id, updated_at desc);

create index if not exists app_cases_tenant_reviewer_idx
  on app_cases (tenant_id, assigned_reviewer_id);

create index if not exists app_curation_reviews_tenant_status_idx
  on app_curation_reviews (tenant_id, status);
