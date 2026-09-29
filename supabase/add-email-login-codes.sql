-- Customer sign-in with a one-time code sent by email (no passwords).
-- Run ONCE (idempotent). Used only by the login-code Edge Function, which
-- runs with the service role; the table and function below are closed to
-- anon/authenticated entirely.
--
-- Flow: the shopper enters email + mobile → login-code "send" stores a
-- SHA-256 hash of a random 6-digit code here (never the code itself) and
-- emails the code → "verify" checks it (10 minutes, 5 attempts), creates
-- the account on first sign-in, and returns a one-time Supabase sign-in
-- token that the browser exchanges for a normal session.

-- 1) One pending code per email (a new request replaces the previous one).
create table if not exists public.login_codes (
  email       text primary key,
  code_hash   text not null,
  phone       text not null default '',
  expires_at  timestamptz not null,
  attempts    integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.login_codes enable row level security;
-- No policies on purpose: only the service role (the Edge Function) reads or
-- writes this table.
revoke all on table public.login_codes from public, anon, authenticated;

-- 2) Find an existing auth user by email (the admin API has no lookup by
-- email). Service role only.
create or replace function public.auth_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke execute on function public.auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.auth_user_id_by_email(text) to service_role;
