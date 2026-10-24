-- Family voice notes can wait for a chosen time ("play it for Maa at 8 am").
-- A held note has pending = true and is not shown or pushed to the elder; the cron delivers it at deliver_at.
alter table public.messages add column if not exists pending boolean not null default false;
alter table public.messages add column if not exists deliver_at timestamptz;
create index if not exists messages_pending_idx on public.messages (deliver_at) where pending;
