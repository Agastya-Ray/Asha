-- Medicine photos sent by family (idea: "she shows the pill").
-- A family member picks one of the elder's medicines and adds a photo; the elder's phone asks before using it.

alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check
  check (kind in ('preset', 'custom', 'status', 'heart', 'voice', 'alert', 'nudge', 'digest', 'photo'));

-- photos live in the same private "voice" bucket, under the circle's folder
alter table public.messages add column if not exists photo_path text;

-- the elder's medicine names (id, name, dose only), so family can pick which one a photo is for
alter table public.circles add column if not exists meds jsonb not null default '[]'::jsonb;
