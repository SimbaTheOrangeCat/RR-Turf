-- Enable required extension.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.time_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'available' check (status in ('available', 'booked', 'blocked')),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (slot_date, start_time, end_time)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slot_id uuid not null references public.time_slots (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'cancelled', 'modified')),
  modified_to_slot_id uuid references public.time_slots (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings add column if not exists customer_name text;
alter table public.bookings add column if not exists phone text;
alter table public.bookings add column if not exists contact_email text;
alter table public.bookings add column if not exists food_items text[] not null default '{}';
alter table public.bookings add column if not exists advance_payment_amount integer not null default 200;
alter table public.bookings add column if not exists payment_status text not null default 'pending';
alter table public.bookings add column if not exists razorpay_order_id text;
alter table public.bookings add column if not exists razorpay_payment_id text;

create unique index if not exists bookings_one_active_per_slot_idx
  on public.bookings (slot_id)
  where status = 'active';

create table if not exists public.booking_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  action text not null check (action in ('created', 'modified', 'cancelled')),
  old_slot_id uuid references public.time_slots (id),
  new_slot_id uuid references public.time_slots (id),
  acted_by uuid references auth.users (id),
  acted_at timestamptz not null default now()
);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at_timestamp();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.time_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_history enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "slots_select_authenticated" on public.time_slots;
create policy "slots_select_authenticated"
on public.time_slots for select
using (auth.uid() is not null);

drop policy if exists "slots_admin_manage" on public.time_slots;
create policy "slots_admin_manage"
on public.time_slots for all
using (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "bookings_select_own_or_admin" on public.bookings;
create policy "bookings_select_own_or_admin"
on public.bookings for select
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "booking_history_select_own_or_admin" on public.booking_history;
create policy "booking_history_select_own_or_admin"
on public.booking_history for select
using (
  exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and (
        b.user_id = auth.uid()
        or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
        )
      )
  )
);

create or replace function public.book_slot_for_user(
  p_user_id uuid,
  p_slot_id uuid,
  p_customer_name text,
  p_phone text,
  p_contact_email text default null,
  p_food_items text[] default '{}',
  p_razorpay_order_id text default null,
  p_razorpay_payment_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
  v_slot_status text;
  v_existing_booking uuid;
  v_payment_status text;
begin
  if p_user_id is null then
    raise exception 'User is required';
  end if;

  if p_customer_name is null or length(trim(p_customer_name)) = 0 then
    raise exception 'Name is required';
  end if;

  if p_phone is null or length(trim(p_phone)) = 0 then
    raise exception 'Phone number is required';
  end if;

  v_payment_status := case
    when p_razorpay_payment_id is not null and length(trim(p_razorpay_payment_id)) > 0 then 'paid'
    else 'pending'
  end;

  select status into v_slot_status
  from public.time_slots
  where id = p_slot_id
  for update;

  if v_slot_status is null then
    raise exception 'Slot not found';
  end if;

  select id into v_existing_booking
  from public.bookings
  where slot_id = p_slot_id
    and status = 'active'
  limit 1;

  if v_existing_booking is not null then
    update public.time_slots
    set status = 'booked'
    where id = p_slot_id;
    raise exception 'Slot is already booked';
  end if;

  if v_slot_status <> 'available' then
    raise exception 'Slot is not available';
  end if;

  update public.time_slots
  set status = 'booked'
  where id = p_slot_id;

  insert into public.bookings (
    user_id,
    slot_id,
    status,
    customer_name,
    phone,
    contact_email,
    food_items,
    payment_status,
    razorpay_order_id,
    razorpay_payment_id
  )
  values (
    p_user_id,
    p_slot_id,
    'active',
    trim(p_customer_name),
    trim(p_phone),
    nullif(trim(coalesce(p_contact_email, '')), ''),
    coalesce(p_food_items, '{}'),
    v_payment_status,
    nullif(trim(coalesce(p_razorpay_order_id, '')), ''),
    nullif(trim(coalesce(p_razorpay_payment_id, '')), '')
  )
  returning id into v_booking_id;

  insert into public.booking_history (booking_id, action, new_slot_id, acted_by)
  values (v_booking_id, 'created', p_slot_id, p_user_id);

  return v_booking_id;
end;
$$;

create or replace function public.book_slot(
  p_slot_id uuid,
  p_customer_name text,
  p_phone text,
  p_contact_email text default null,
  p_food_items text[] default '{}',
  p_razorpay_order_id text default null,
  p_razorpay_payment_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  return public.book_slot_for_user(
    v_uid,
    p_slot_id,
    p_customer_name,
    p_phone,
    p_contact_email,
    p_food_items,
    p_razorpay_order_id,
    p_razorpay_payment_id
  );
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_slot_id uuid;
  v_owner uuid;
  v_is_admin boolean := false;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select role = 'admin' into v_is_admin
  from public.profiles
  where id = v_user_id;

  select slot_id, user_id into v_slot_id, v_owner
  from public.bookings
  where id = p_booking_id
    and status = 'active';

  if v_slot_id is null then
    raise exception 'Active booking not found';
  end if;

  if v_owner <> v_user_id and not coalesce(v_is_admin, false) then
    raise exception 'Not authorized to cancel this booking';
  end if;

  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id;

  update public.time_slots
  set status = 'available'
  where id = v_slot_id;

  insert into public.booking_history (booking_id, action, old_slot_id, acted_by)
  values (p_booking_id, 'cancelled', v_slot_id, v_user_id);
end;
$$;

create or replace function public.modify_booking(p_booking_id uuid, p_new_slot_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_slot_id uuid;
  v_owner uuid;
  v_is_admin boolean := false;
  v_new_booking_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select role = 'admin' into v_is_admin
  from public.profiles
  where id = v_user_id;

  select slot_id, user_id into v_old_slot_id, v_owner
  from public.bookings
  where id = p_booking_id
    and status = 'active';

  if v_old_slot_id is null then
    raise exception 'Active booking not found';
  end if;

  if v_owner <> v_user_id and not coalesce(v_is_admin, false) then
    raise exception 'Not authorized to modify this booking';
  end if;

  update public.time_slots
  set status = 'booked'
  where id = p_new_slot_id
    and status = 'available';

  if not found then
    raise exception 'New slot is not available';
  end if;

  update public.bookings
  set status = 'modified',
      modified_to_slot_id = p_new_slot_id
  where id = p_booking_id;

  update public.time_slots
  set status = 'available'
  where id = v_old_slot_id;

  insert into public.bookings (user_id, slot_id, status)
  values (v_owner, p_new_slot_id, 'active')
  returning id into v_new_booking_id;

  insert into public.booking_history (booking_id, action, old_slot_id, new_slot_id, acted_by)
  values (v_new_booking_id, 'modified', v_old_slot_id, p_new_slot_id, v_user_id);

  return v_new_booking_id;
end;
$$;

grant execute on function public.book_slot(uuid, text, text, text, text[], text, text) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.modify_booking(uuid, uuid) to authenticated;

-- Checkout state: written only from trusted server (service role); users may read their own rows.
create table if not exists public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slot_id uuid not null references public.time_slots (id) on delete cascade,
  amount_paise integer not null,
  currency text not null default 'INR',
  customer_name text not null,
  phone text not null,
  contact_email text,
  food_items text[] not null default '{}',
  razorpay_order_id text not null,
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'expired')),
  expires_at timestamptz not null,
  booking_id uuid references public.bookings (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists payment_sessions_user_id_idx on public.payment_sessions (user_id);
create index if not exists payment_sessions_razorpay_order_id_idx on public.payment_sessions (razorpay_order_id);

alter table public.payment_sessions enable row level security;

drop policy if exists "payment_sessions_select_own" on public.payment_sessions;
create policy "payment_sessions_select_own"
on public.payment_sessions for select
using (auth.uid() = user_id);

create or replace function public.finalize_booking_payment_session(
  p_session_id uuid,
  p_razorpay_order_id text,
  p_razorpay_payment_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  s public.payment_sessions%rowtype;
  v_booking_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into s
  from public.payment_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Payment session not found';
  end if;

  if s.user_id <> v_uid then
    raise exception 'Unauthorized';
  end if;

  if s.status = 'paid' and s.booking_id is not null then
    return s.booking_id;
  end if;

  if s.status <> 'created' then
    raise exception 'Payment session is not payable';
  end if;

  if s.expires_at < now() then
    update public.payment_sessions set status = 'expired' where id = p_session_id;
    raise exception 'Payment session expired';
  end if;

  if s.razorpay_order_id is distinct from p_razorpay_order_id then
    raise exception 'Order mismatch';
  end if;

  v_booking_id := public.book_slot_for_user(
    s.user_id,
    s.slot_id,
    s.customer_name,
    s.phone,
    s.contact_email,
    s.food_items,
    p_razorpay_order_id,
    p_razorpay_payment_id
  );

  update public.payment_sessions
  set status = 'paid', booking_id = v_booking_id
  where id = p_session_id;

  return v_booking_id;
end;
$$;

create or replace function public.finalize_booking_by_order_webhook(
  p_razorpay_order_id text,
  p_razorpay_payment_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.payment_sessions%rowtype;
  v_booking_id uuid;
begin
  select * into s
  from public.payment_sessions
  where razorpay_order_id = p_razorpay_order_id
  for update;

  if not found then
    return null;
  end if;

  if s.status = 'paid' and s.booking_id is not null then
    return s.booking_id;
  end if;

  if s.status <> 'created' then
    return null;
  end if;

  if s.expires_at < now() then
    update public.payment_sessions set status = 'expired' where id = s.id;
    return null;
  end if;

  v_booking_id := public.book_slot_for_user(
    s.user_id,
    s.slot_id,
    s.customer_name,
    s.phone,
    s.contact_email,
    s.food_items,
    p_razorpay_order_id,
    p_razorpay_payment_id
  );

  update public.payment_sessions
  set status = 'paid', booking_id = v_booking_id
  where id = s.id;

  return v_booking_id;
end;
$$;

revoke all on function public.book_slot_for_user(uuid, uuid, text, text, text, text[], text, text) from public;
grant execute on function public.book_slot_for_user(uuid, uuid, text, text, text, text[], text, text) to service_role;

grant execute on function public.finalize_booking_payment_session(uuid, text, text) to authenticated;
revoke all on function public.finalize_booking_payment_session(uuid, text, text) from public;
grant execute on function public.finalize_booking_payment_session(uuid, text, text) to service_role;

revoke all on function public.finalize_booking_by_order_webhook(text, text) from public;
grant execute on function public.finalize_booking_by_order_webhook(text, text) to service_role;
