-- Post-Phase-3 adjustment — Mid-round rule changes (host-only)
--
-- The round's active-rule set (round_rules, a frozen snapshot created in 0003)
-- was previously fixed at Start. This migration lets the round's host add and
-- remove active rules while the round is in the lobby or live, via SECURITY
-- DEFINER RPCs that enforce host-only writes. round_rules is published to
-- Realtime so every participant's rule list updates live.
--
-- Snapshot integrity (architecture principle 2) is preserved: each round_rules
-- row still freezes the rule's name/points at the moment it is added, and point
-- events (Phase 4) will continue to snapshot at log time, so history is never
-- rewritten by a later change to the group library.

-- ---------------------------------------------------------------------------
-- Add an active rule to a round (host only; lobby or active rounds).
-- Snapshots the group rule's fields, mirroring create_round. Idempotent: adding
-- a rule that's already active refreshes its snapshot from the library.
-- ---------------------------------------------------------------------------
create or replace function public.add_round_rule(
  p_round_id uuid,
  p_rule_id uuid
)
returns public.round_rules
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rounds;
  ru public.rules;
  rr public.round_rules;
begin
  select * into r from public.rounds where id = p_round_id;
  if r.id is null then
    raise exception 'Round not found';
  end if;
  if r.created_by <> auth.uid() then
    raise exception 'Only the host can change this round''s rules';
  end if;
  if r.status not in ('lobby', 'active') then
    raise exception 'Rules can only be changed while the round is live';
  end if;

  select * into ru from public.rules where id = p_rule_id;
  if ru.id is null then
    raise exception 'Rule not found';
  end if;
  if ru.group_id <> r.group_id then
    raise exception 'Rule belongs to a different group';
  end if;

  insert into public.round_rules
    (round_id, rule_id, name_snapshot, display_name_snapshot,
     description_snapshot, points_snapshot, player_scope, is_repeatable)
  values
    (r.id, ru.id, ru.name, ru.display_name, ru.description,
     ru.points, ru.player_scope, ru.is_repeatable)
  on conflict (round_id, rule_id) do update set
    name_snapshot = excluded.name_snapshot,
    display_name_snapshot = excluded.display_name_snapshot,
    description_snapshot = excluded.description_snapshot,
    points_snapshot = excluded.points_snapshot,
    player_scope = excluded.player_scope,
    is_repeatable = excluded.is_repeatable
  returning * into rr;

  return rr;
end;
$$;

-- ---------------------------------------------------------------------------
-- Remove an active rule from a round (host only; lobby or active rounds).
-- ---------------------------------------------------------------------------
create or replace function public.remove_round_rule(
  p_round_id uuid,
  p_rule_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rounds;
begin
  select * into r from public.rounds where id = p_round_id;
  if r.id is null then
    raise exception 'Round not found';
  end if;
  if r.created_by <> auth.uid() then
    raise exception 'Only the host can change this round''s rules';
  end if;
  if r.status not in ('lobby', 'active') then
    raise exception 'Rules can only be changed while the round is live';
  end if;

  delete from public.round_rules
  where round_id = p_round_id and rule_id = p_rule_id;
end;
$$;

revoke all on function public.add_round_rule(uuid, uuid) from public;
revoke all on function public.remove_round_rule(uuid, uuid) from public;
grant execute on function public.add_round_rule(uuid, uuid) to authenticated;
grant execute on function public.remove_round_rule(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: publish round_rules so a host's mid-round change reaches every
-- participant's device live (mirrors round_players / rounds in 0003).
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'round_rules'
  ) then
    alter publication supabase_realtime add table public.round_rules;
  end if;
end $$;
