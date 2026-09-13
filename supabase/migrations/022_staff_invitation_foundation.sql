begin;

-- Membership never changes profiles.role or venues.owner_id. Operational RLS
-- integration is a separate step; owns_venue deliberately retains its meaning.
create table public.venue_staff (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('manager', 'reception', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, user_id)
);
create index venue_staff_user_idx on public.venue_staff(user_id);
alter table public.venue_staff enable row level security;
create trigger venue_staff_updated_at before update on public.venue_staff
  for each row execute function public.set_updated_at();

create table public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and length(email) between 3 and 254),
  role text not null check (role in ('manager', 'reception', 'viewer')),
  token_hash text not null unique,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (accepted_at is null or revoked_at is null)
);
create index staff_invites_venue_idx on public.staff_invites(venue_id, created_at desc);
create index staff_invites_inviter_idx on public.staff_invites(invited_by);
create unique index staff_invites_pending_email_idx on public.staff_invites(venue_id, email)
  where accepted_at is null and revoked_at is null;
alter table public.staff_invites enable row level security;
create trigger staff_invites_updated_at before update on public.staff_invites
  for each row execute function public.set_updated_at();

create function public.has_venue_permission(p_venue_id uuid, p_permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
    and p_permission in ('calendar.read', 'reservations.write', 'customers.read',
      'customers.write', 'reports.read', 'venue.write', 'staff.manage')
    and exists (
      select 1 from public.venues v where v.id = p_venue_id and (
        v.owner_id = auth.uid() or public.is_admin() or exists (
          select 1 from public.venue_staff s where s.venue_id = v.id and s.user_id = auth.uid()
          and (s.role = 'manager'
            or (s.role = 'reception' and p_permission in
              ('calendar.read', 'reservations.write', 'customers.read', 'customers.write'))
            or (s.role = 'viewer' and p_permission = 'calendar.read'))
        )
      )
    );
$$;
revoke all on function public.has_venue_permission(uuid,text) from public, anon;
grant execute on function public.has_venue_permission(uuid,text) to authenticated;

revoke all on public.venue_staff, public.staff_invites from public, anon, authenticated;
grant select on public.venue_staff to authenticated;
-- Even a manager cannot read the token hash through the browser API.
grant select (id,venue_id,email,role,invited_by,expires_at,accepted_at,revoked_at,created_at,updated_at)
  on public.staff_invites to authenticated;
create policy staff_read on public.venue_staff for select to authenticated
  using (user_id = auth.uid() or public.has_venue_permission(venue_id,'staff.manage'));
create policy invites_read on public.staff_invites for select to authenticated
  using (public.has_venue_permission(venue_id,'staff.manage'));

-- All membership mutations lock the venue first, including invitation acceptance.
-- Managers may only manage reception/viewer; owner/admin manage managers as well.
create function public.manage_venue_staff(p_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_venue uuid := (p_input->>'venueId')::uuid;
  v_action text := p_input->>'action';
  v_role text := p_input->>'role';
  v_owner uuid;
  v_privileged boolean;
  v_email text;
  v_token text;
  v_invite public.staff_invites%rowtype;
  v_staff public.venue_staff%rowtype;
begin
  select owner_id into v_owner from public.venues where id = v_venue for update;
  if auth.uid() is null or v_owner is null or not public.has_venue_permission(v_venue,'staff.manage') then
    raise exception 'Personel yönetimi için yetkiniz yok';
  end if;
  v_privileged := v_owner = auth.uid() or public.is_admin();
  if v_action in ('invite','change_role') then
    if v_role is null or v_role not in ('manager','reception','viewer') then
      raise exception 'Geçersiz personel rolü';
    end if;
    if v_role = 'manager' and not v_privileged then
      raise exception 'Yönetici rolünü yalnızca tesis sahibi veya admin atayabilir';
    end if;
  end if;
  if v_action = 'invite' then
    v_email := lower(btrim(p_input->>'email'));
    if v_email is null or length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'Geçerli bir e-posta adresi girin';
    end if;
    -- A new link revokes the previous outstanding link; raw tokens are never stored.
    select * into v_invite from public.staff_invites
      where venue_id=v_venue and email=v_email and accepted_at is null and revoked_at is null;
    if found and v_invite.role='manager' and not v_privileged then
      raise exception 'Yönetici davetini yalnızca tesis sahibi veya admin değiştirebilir';
    end if;
    update public.staff_invites set revoked_at=now()
      where venue_id=v_venue and email=v_email and accepted_at is null and revoked_at is null;
    v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text,'-','');
    insert into public.staff_invites(venue_id,email,role,token_hash,invited_by)
      values(v_venue,v_email,v_role,encode(sha256(convert_to(v_token,'UTF8')),'hex'),auth.uid())
      returning * into v_invite;
    return jsonb_build_object('id',v_invite.id,'token',v_token,'expiresAt',v_invite.expires_at);
  elsif v_action = 'revoke_invite' then
    select * into v_invite from public.staff_invites
      where id=(p_input->>'id')::uuid and venue_id=v_venue and accepted_at is null and revoked_at is null;
    if not found then raise exception 'Aktif davet bulunamadı'; end if;
    if v_invite.role='manager' and not v_privileged then
      raise exception 'Yönetici davetini yalnızca tesis sahibi veya admin değiştirebilir';
    end if;
    update public.staff_invites set revoked_at=now() where id=v_invite.id;
  elsif v_action in ('change_role','remove') then
    select * into v_staff from public.venue_staff where id=(p_input->>'id')::uuid and venue_id=v_venue;
    if not found then raise exception 'Personel bulunamadı'; end if;
    if v_staff.user_id=v_owner or v_staff.user_id=auth.uid() then
      raise exception 'Kendi erişiminizi veya tesis sahibini değiştiremezsiniz';
    end if;
    if v_staff.role='manager' and not v_privileged then
      raise exception 'Yöneticiyi yalnızca tesis sahibi veya admin değiştirebilir';
    end if;
    -- Demotion/removal must not leave delegated invitations usable later.
    update public.staff_invites set revoked_at=now()
      where venue_id=v_venue and accepted_at is null and revoked_at is null
        and (invited_by=v_staff.user_id or email=(select lower(email) from auth.users where id=v_staff.user_id));
    if v_action='remove' then
      delete from public.venue_staff where id=v_staff.id;
    else
      update public.venue_staff set role=v_role where id=v_staff.id;
    end if;
  else
    raise exception 'Geçersiz personel işlemi';
  end if;
  return jsonb_build_object('success',true);
end;
$$;

create function public.accept_staff_invite(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_invite public.staff_invites%rowtype;
  v_venue uuid;
  v_owner uuid;
  v_email text;
begin
  if auth.uid() is null then raise exception 'Daveti kabul etmek için giriş yapın'; end if;
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'Davet geçersiz veya süresi dolmuş'; end if;
  select venue_id into v_venue from public.staff_invites
    where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
  select owner_id into v_owner from public.venues where id=v_venue for update;
  select * into v_invite from public.staff_invites
    where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')
      and accepted_at is null and revoked_at is null and expires_at > now();
  if not found or v_owner is null then raise exception 'Davet geçersiz veya süresi dolmuş'; end if;
  select lower(email) into v_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
  if v_email is distinct from v_invite.email then
    raise exception 'Davet edilen doğrulanmış e-posta hesabıyla giriş yapın';
  end if;
  if auth.uid()=v_owner then raise exception 'Tesis sahibi personel olarak eklenemez'; end if;
  if not (
    v_invite.invited_by=v_owner
    or exists(select 1 from public.profiles where id=v_invite.invited_by and role='admin')
    or (v_invite.role<>'manager' and exists(select 1 from public.venue_staff
      where venue_id=v_venue and user_id=v_invite.invited_by and role='manager'))
  ) then raise exception 'Davet veren kişinin yetkisi artık geçerli değil'; end if;
  if exists(select 1 from public.venue_staff where venue_id=v_venue and user_id=auth.uid()) then
    raise exception 'Bu tesiste zaten personel erişiminiz var';
  end if;
  insert into public.venue_staff(venue_id,user_id,role) values(v_venue,auth.uid(),v_invite.role);
  update public.staff_invites set accepted_at=now() where id=v_invite.id;
  return v_venue;
end;
$$;
revoke all on function public.manage_venue_staff(jsonb), public.accept_staff_invite(text) from public, anon;
grant execute on function public.manage_venue_staff(jsonb), public.accept_staff_invite(text) to authenticated;
notify pgrst, 'reload schema';
commit;
