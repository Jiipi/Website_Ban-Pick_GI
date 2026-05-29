-- Supabase RLS policies for the Ban/Pick app.
-- Apply in Supabase SQL Editor after the tables exist.
-- The Next.js server still acts as the trusted backend with service-role writes;
-- these policies protect direct anon/authenticated Supabase access and Realtime.

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select "role"
  from public."User"
  where "id" = auth.uid()::text
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'ADMIN', false)
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('ADMIN', 'REFEREE'), false)
$$;

grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;

alter table public."ActivityEvent" enable row level security;
alter table public."CharacterBuild" enable row level security;
alter table public."ChatMessage" enable row level security;
alter table public."DraftLog" enable row level security;
alter table public."Friendship" enable row level security;
alter table public."LobbyPlayer" enable row level security;
alter table public."Notification" enable row level security;
alter table public."Room" enable row level security;
alter table public."Tournament" enable row level security;
alter table public."TournamentMatch" enable row level security;
alter table public."TournamentParticipant" enable row level security;
alter table public."TournamentTeamMember" enable row level security;
alter table public."User" enable row level security;
alter table public."UserSettings" enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public."ActivityEvent", public."CharacterBuild", public."ChatMessage", public."DraftLog",
  public."Room", public."Tournament", public."TournamentMatch", public."TournamentParticipant",
  public."TournamentTeamMember" to anon, authenticated;
grant select, insert, update, delete on public."Friendship", public."LobbyPlayer", public."Notification",
  public."UserSettings" to authenticated;
grant select, insert, update, delete on public."User" to authenticated;

drop policy if exists "user read self or admin" on public."User";
create policy "user read self or admin"
on public."User"
for select
to authenticated
using ("id" = auth.uid()::text or public.is_admin());

drop policy if exists "user insert own player" on public."User";
create policy "user insert own player"
on public."User"
for insert
to authenticated
with check ("id" = auth.uid()::text and "role" = 'PLAYER');

drop policy if exists "user admin update" on public."User";
create policy "user admin update"
on public."User"
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "user admin delete" on public."User";
create policy "user admin delete"
on public."User"
for delete
to authenticated
using (public.is_admin());

drop policy if exists "room public read" on public."Room";
create policy "room public read"
on public."Room"
for select
to anon, authenticated
using ("isPublic" = true or "hostUserId" = auth.uid()::text or public.is_staff());

drop policy if exists "room staff insert" on public."Room";
create policy "room staff insert"
on public."Room"
for insert
to authenticated
with check (public.is_staff() and ("hostUserId" is null or "hostUserId" = auth.uid()::text or public.is_admin()));

drop policy if exists "room host staff update" on public."Room";
create policy "room host staff update"
on public."Room"
for update
to authenticated
using (public.is_staff() or "hostUserId" = auth.uid()::text)
with check (public.is_staff() or "hostUserId" = auth.uid()::text);

drop policy if exists "room host staff delete" on public."Room";
create policy "room host staff delete"
on public."Room"
for delete
to authenticated
using (public.is_staff() or "hostUserId" = auth.uid()::text);

drop policy if exists "draft log room read" on public."DraftLog";
create policy "draft log room read"
on public."DraftLog"
for select
to anon, authenticated
using (
  exists (
    select 1
    from public."Room" r
    where r."id" = "DraftLog"."roomId"
      and (r."isPublic" = true or r."hostUserId" = auth.uid()::text or public.is_staff())
  )
);

drop policy if exists "draft log staff write" on public."DraftLog";
create policy "draft log staff write"
on public."DraftLog"
for all
to authenticated
using (
  exists (
    select 1
    from public."Room" r
    where r."id" = "DraftLog"."roomId"
      and (r."hostUserId" = auth.uid()::text or public.is_staff())
  )
)
with check (
  exists (
    select 1
    from public."Room" r
    where r."id" = "DraftLog"."roomId"
      and (r."hostUserId" = auth.uid()::text or public.is_staff())
  )
);

drop policy if exists "character build room read" on public."CharacterBuild";
create policy "character build room read"
on public."CharacterBuild"
for select
to anon, authenticated
using (
  exists (
    select 1
    from public."Room" r
    where r."id" = "CharacterBuild"."roomId"
      and (r."isPublic" = true or r."hostUserId" = auth.uid()::text or public.is_staff())
  )
);

drop policy if exists "character build staff write" on public."CharacterBuild";
create policy "character build staff write"
on public."CharacterBuild"
for all
to authenticated
using (
  exists (
    select 1
    from public."Room" r
    where r."id" = "CharacterBuild"."roomId"
      and (r."hostUserId" = auth.uid()::text or public.is_staff())
  )
)
with check (
  exists (
    select 1
    from public."Room" r
    where r."id" = "CharacterBuild"."roomId"
      and (r."hostUserId" = auth.uid()::text or public.is_staff())
  )
);

drop policy if exists "chat message room read" on public."ChatMessage";
create policy "chat message room read"
on public."ChatMessage"
for select
to anon, authenticated
using (
  exists (
    select 1
    from public."Room" r
    where r."id" = "ChatMessage"."roomId"
      and (r."isPublic" = true or r."hostUserId" = auth.uid()::text or public.is_staff())
  )
);

drop policy if exists "chat message authenticated write" on public."ChatMessage";
create policy "chat message authenticated write"
on public."ChatMessage"
for insert
to authenticated
with check (
  exists (
    select 1
    from public."Room" r
    where r."id" = "ChatMessage"."roomId"
      and (r."isPublic" = true or r."hostUserId" = auth.uid()::text or public.is_staff())
  )
);

drop policy if exists "lobby player read authenticated" on public."LobbyPlayer";
create policy "lobby player read authenticated"
on public."LobbyPlayer"
for select
to authenticated
using (true);

drop policy if exists "lobby player write authenticated" on public."LobbyPlayer";
create policy "lobby player write authenticated"
on public."LobbyPlayer"
for all
to authenticated
using (true)
with check (true);

drop policy if exists "activity feed public read" on public."ActivityEvent";
create policy "activity feed public read"
on public."ActivityEvent"
for select
to anon, authenticated
using (true);

drop policy if exists "activity feed authenticated insert" on public."ActivityEvent";
create policy "activity feed authenticated insert"
on public."ActivityEvent"
for insert
to authenticated
with check (true);

drop policy if exists "friendship authenticated access" on public."Friendship";
create policy "friendship authenticated access"
on public."Friendship"
for all
to authenticated
using (true)
with check (true);

drop policy if exists "notification authenticated access" on public."Notification";
create policy "notification authenticated access"
on public."Notification"
for all
to authenticated
using (true)
with check (true);

drop policy if exists "tournament public read" on public."Tournament";
create policy "tournament public read"
on public."Tournament"
for select
to anon, authenticated
using (true);

drop policy if exists "tournament admin write" on public."Tournament";
create policy "tournament admin write"
on public."Tournament"
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "tournament participant public read" on public."TournamentParticipant";
create policy "tournament participant public read"
on public."TournamentParticipant"
for select
to anon, authenticated
using (true);

drop policy if exists "tournament participant authenticated insert" on public."TournamentParticipant";
create policy "tournament participant authenticated insert"
on public."TournamentParticipant"
for insert
to authenticated
with check (true);

drop policy if exists "tournament participant admin update delete" on public."TournamentParticipant";
create policy "tournament participant admin update delete"
on public."TournamentParticipant"
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "tournament participant admin delete" on public."TournamentParticipant";
create policy "tournament participant admin delete"
on public."TournamentParticipant"
for delete
to authenticated
using (public.is_admin());

drop policy if exists "tournament member public read" on public."TournamentTeamMember";
create policy "tournament member public read"
on public."TournamentTeamMember"
for select
to anon, authenticated
using (true);

drop policy if exists "tournament member authenticated insert" on public."TournamentTeamMember";
create policy "tournament member authenticated insert"
on public."TournamentTeamMember"
for insert
to authenticated
with check (true);

drop policy if exists "tournament member admin update delete" on public."TournamentTeamMember";
create policy "tournament member admin update delete"
on public."TournamentTeamMember"
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "tournament member admin delete" on public."TournamentTeamMember";
create policy "tournament member admin delete"
on public."TournamentTeamMember"
for delete
to authenticated
using (public.is_admin());

drop policy if exists "tournament match public read" on public."TournamentMatch";
create policy "tournament match public read"
on public."TournamentMatch"
for select
to anon, authenticated
using (true);

drop policy if exists "tournament match admin write" on public."TournamentMatch";
create policy "tournament match admin write"
on public."TournamentMatch"
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "user settings authenticated access" on public."UserSettings";
create policy "user settings authenticated access"
on public."UserSettings"
for all
to authenticated
using (true)
with check (true);
