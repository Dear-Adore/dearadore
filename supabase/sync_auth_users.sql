-- Sinkronisasi otomatis auth.users -> public.users
-- Jalankan sekali di Supabase Dashboard > SQL Editor.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id::text,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Backfill: user yang sudah signup sebelumnya tapi belum ada di public.users
insert into public.users (id, name, email, role)
select
  au.id::text,
  coalesce(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  au.email,
  'user'
from auth.users au
where au.email is not null
  and not exists (select 1 from public.users pu where pu.id = au.id::text)
  and not exists (select 1 from public.users pu where pu.email = au.email);
