create table if not exists public.tracker_state (
  id integer primary key check (id = 1),
  state_id text not null,
  updated_at timestamptz not null default now()
);

insert into public.tracker_state (id, state_id)
values (1, 'driving-to-restaurant')
on conflict (id) do nothing;

alter table public.tracker_state enable row level security;
