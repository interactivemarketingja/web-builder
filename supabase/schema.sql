-- Atelier Frame Production Schema for Supabase (PostgreSQL)
-- Run this migration in your Supabase Project > SQL Editor.

create extension if not exists "pgcrypto";

-- 1. Client Website Projects
create table if not exists public.af_projects (
  id text primary key,
  client_name text not null default 'Internal Studio',
  name text not null,
  slug text not null,
  description text not null default '',
  theme jsonb not null,
  blocks jsonb not null default '[]'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  last_deployed_slug text,
  last_deployed_url text,
  last_deployed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists af_projects_updated_idx on public.af_projects (updated_at desc);
create index if not exists af_projects_slug_idx on public.af_projects (slug);

-- 2. Published Live Deployments
create table if not exists public.af_deployments (
  slug text primary key,
  project_id text references public.af_projects(id) on delete set null,
  client_name text not null default 'Internal Studio',
  name text not null,
  description text not null default '',
  html text not null,
  block_count integer not null default 0,
  custom_domain text,
  domain_verified boolean not null default false,
  domain_verified_at timestamptz,
  deployed_at timestamptz not null default now()
);

-- Safe idempotent upgrade for existing databases
alter table public.af_deployments add column if not exists custom_domain text;
alter table public.af_deployments add column if not exists domain_verified boolean not null default false;
alter table public.af_deployments add column if not exists domain_verified_at timestamptz;

create index if not exists af_deployments_deployed_idx on public.af_deployments (deployed_at desc);
create unique index if not exists af_deployments_custom_domain_uidx
  on public.af_deployments (lower(custom_domain))
  where custom_domain is not null;

-- 3. Captured Lead Submissions from Deployed Client Sites
create table if not exists public.af_form_submissions (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null references public.af_deployments(slug) on delete cascade,
  name text not null,
  email text not null,
  message text not null,
  submitted_at timestamptz not null default now()
);

create index if not exists af_submissions_slug_idx on public.af_form_submissions (site_slug, submitted_at desc);

-- 4. Website Analytics Events (Page Views, CTA Clicks, Form Submissions)
create table if not exists public.af_analytics_events (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null references public.af_deployments(slug) on delete cascade,
  event_type text not null check (event_type in ('page_view', 'cta_click', 'form_submit')),
  device_type text not null default 'desktop' check (device_type in ('desktop', 'tablet', 'mobile')),
  referrer text not null default 'Direct',
  target_label text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists af_analytics_slug_created_idx on public.af_analytics_events (site_slug, created_at desc);
create index if not exists af_analytics_created_idx on public.af_analytics_events (created_at desc);

-- 5. Paid Digital Marketing Campaigns & Orders
create table if not exists public.af_marketing_orders (
  id text primary key,
  site_slug text not null,
  site_name text not null,
  client_name text not null default 'Internal Studio',
  customer_email text not null,
  package_id text not null,
  package_name text not null,
  billing_type text not null default 'one_time',
  ad_budget_usd integer not null default 0,
  service_fee_usd integer not null default 0,
  total_usd integer not null default 0,
  channels jsonb not null default '[]'::jsonb,
  target_audience text not null default '',
  campaign_goal text not null default 'Leads & Inquiries',
  utm_campaign text not null default '',
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'active', 'paused', 'completed')),
  payment_provider text not null default 'invoice',
  stripe_session_id text,
  generated_kit jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists af_marketing_orders_created_idx on public.af_marketing_orders (created_at desc);
create index if not exists af_marketing_orders_slug_idx on public.af_marketing_orders (site_slug);

-- Row-Level Security (Server uses service_role key; public anon access locked by default)
alter table public.af_projects enable row level security;
alter table public.af_deployments enable row level security;
alter table public.af_form_submissions enable row level security;
alter table public.af_analytics_events enable row level security;
alter table public.af_marketing_orders enable row level security;

-- Allow public read of published deployments if querying directly via anon key
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'af_deployments'
      and policyname = 'Public read published deployments'
  ) then
    create policy "Public read published deployments"
      on public.af_deployments for select
      using (true);
  end if;
end $$;
