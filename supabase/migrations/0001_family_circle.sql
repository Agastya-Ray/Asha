-- Asha Family Circle: phones, circles (one per elder), members, messages.
-- Every table has Row Level Security ON and NO policies, so the public API keys cannot read anything.
-- Only the "family" Edge Function (service role) touches these tables, after checking the phone's secret.

create extension if not exists pgcrypto with schema extensions;

-- One row per phone that uses Family features.
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  secret_hash text not null,                         -- sha256 of the phone's secret; the secret itself is never stored
  role text not null check (role in ('elder', 'family')),
  name text not null default '',
  lang text not null default 'en' check (lang in ('en', 'hi')),
  voice_lang text not null default 'en' check (voice_lang in ('en', 'hi')),
  fcm_token text,
  pro boolean not null default false,
  tz text not null default 'Asia/Kolkata',
  quiet_start text not null default '21:30',        -- HH:MM local
  quiet_end text not null default '07:00',
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- One circle per elder.
create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null unique references public.devices(id) on delete cascade,
  elder_label text not null default '',             -- what the family calls her: "Maa"
  invite_code text unique,
  invite_expires timestamptz,
  -- what the elder agreed to share
  share_meds boolean not null default true,
  share_meals boolean not null default true,
  share_mood boolean not null default true,
  share_missed boolean not null default true,
  digest boolean not null default false,             -- true = one summary at night instead of each update
  nudge boolean not null default false,              -- tell family if she has not opened Asha by afternoon
  last_digest_day date,
  last_nudge_day date,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  circle_id uuid not null references public.circles(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  relation text not null default '',                 -- "Son", "Daughter", "Husband"
  display_name text not null default '',             -- "Rahul"
  muted boolean not null default false,              -- elder muted this person
  blocked boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (circle_id, device_id)
);
create index if not exists members_device_idx on public.members(device_id);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  circle_id uuid not null references public.circles(id) on delete cascade,
  from_device uuid references public.devices(id) on delete set null,
  to_device uuid references public.devices(id) on delete cascade,  -- null = everyone in the circle except the sender
  kind text not null check (kind in ('preset', 'custom', 'status', 'heart', 'voice', 'alert', 'nudge', 'digest')),
  template text,                                     -- preset / status id
  text_en text not null default '',
  text_hi text not null default '',
  original text,                                     -- custom text as typed
  audio_path text,                                   -- voice notes in Storage
  silent boolean not null default false,             -- stored, but no push (digest mode)
  heard_at timestamptz,
  heard_by uuid references public.devices(id) on delete set null,
  reaction text,
  created_at timestamptz not null default now()
);
create index if not exists messages_circle_idx on public.messages(circle_id, id desc);
create index if not exists messages_sender_day_idx on public.messages(from_device, created_at);

alter table public.devices enable row level security;
alter table public.circles enable row level security;
alter table public.members enable row level security;
alter table public.messages enable row level security;
revoke all on public.devices, public.circles, public.members, public.messages from anon, authenticated;

-- Messages older than 90 days are deleted every night (see cron migration).

-- Private storage bucket for voice notes (only the Edge Function can read/write).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice', 'voice', false, 600000, array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/mpeg', 'audio/wav'])
on conflict (id) do nothing;

-- Lets the Edge Function read the Firebase key from the Vault. Only the service role may call it.
create or replace function public.asha_secret(secret_name text)
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets
  where name = secret_name and secret_name in ('firebase_service_account', 'asha_cron_secret', 'gemini_api_key')
  limit 1;
$$;
revoke all on function public.asha_secret(text) from public, anon, authenticated;
grant execute on function public.asha_secret(text) to service_role;
