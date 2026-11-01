-- Authenticated game sessions and atomic multiplayer operations.
create extension if not exists pgcrypto;

alter table public.players
  add column if not exists session_token_hash text,
  add column if not exists active_powerups jsonb not null default '{}'::jsonb,
  add column if not exists freeze_clock_until timestamptz,
  add column if not exists last_seen_at timestamptz not null default now();

alter table public.players alter column powerups
  set default '{"double_points":1,"freeze_clock":1}'::jsonb;
update public.players set powerups = powerups - 'shield';

do $$
declare
  v_crypto_schema text;
begin
  select n.nspname into v_crypto_schema
  from pg_catalog.pg_extension e
  join pg_catalog.pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if v_crypto_schema is null then
    raise exception 'pgcrypto must be available to hash player session tokens.';
  end if;

  execute format(
    'update public.players set session_token_hash = encode(%I.digest(player_token::text, %L), %L) where session_token_hash is null',
    v_crypto_schema,
    'sha256',
    'hex'
  );
end;
$$;

alter table public.players
  alter column session_token_hash set not null;

create unique index if not exists players_session_token_hash_idx
  on public.players(session_token_hash);

alter table public.players drop column if exists player_token;
alter table public.rooms drop column if exists host_token;

create table if not exists public.game_action_requests (
  player_id uuid not null references public.players(id) on delete cascade,
  request_id uuid not null,
  operation text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (player_id, request_id)
);

alter table public.game_action_requests enable row level security;

create or replace function public.bb_room_state(p_room_id uuid, p_player_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
  select jsonb_build_object(
    'room', jsonb_build_object(
      'code', r.code,
      'phase', r.status,
      'questionIndex', r.current_question,
      'questionCount', jsonb_array_length(r.question_set),
      'updatedAt', r.updated_at,
      'deadline', case
        when r.status = 'question' and r.question_started_at is not null
          then r.question_started_at + interval '15 seconds'
        else null
      end,
      'advanceDeadline', case
        when r.status = 'question' and r.question_started_at is not null then greatest(
          r.question_started_at + interval '15 seconds',
          coalesce((
            select max(p.freeze_clock_until)
            from public.players p
            where p.room_id = r.id
              and p.freeze_clock_until is not null
              and not exists (
                select 1 from public.answers a
                where a.player_id = p.id and a.question_index = r.current_question
              )
          ), r.question_started_at + interval '15 seconds')
        )
        else null
      end
    ),
    'question', case
      when r.status in ('question', 'reveal') then
        case when r.status = 'reveal'
          then r.question_set -> r.current_question
          else (r.question_set -> r.current_question) - 'correctIndex' - 'explanation'
        end
      else null
    end,
    'players', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', p.id,
        'nickname', p.nickname,
        'isHost', p.is_host,
        'score', p.score - case when r.status = 'question' then coalesce((
          select sum(a.points_awarded)
          from public.answers a
          where a.player_id = p.id and a.question_index = r.current_question
        ), 0) else 0 end,
        'connected', p.last_seen_at > now() - interval '30 seconds',
        'powerups', p.powerups,
        'answerSubmitted', exists (
          select 1 from public.answers a
          where a.player_id = p.id and a.question_index = r.current_question
        )
      ) order by p.score desc, p.joined_at asc), '[]'::jsonb)
      from public.players p where p.room_id = r.id
    ),
    'myPlayerId', p_player_id,
    'playerDeadline', (
      select case
        when r.status <> 'question' or r.question_started_at is null then null
        when p.freeze_clock_until > r.question_started_at + interval '15 seconds'
          then p.freeze_clock_until
        else r.question_started_at + interval '15 seconds'
      end
      from public.players p where p.id = p_player_id
    ),
    'myAnswer', (
      select jsonb_build_object(
        'optionIndex', a.option_index,
        'isCorrect', case when r.status in ('reveal', 'finished') then a.is_correct else null end,
        'pointsAwarded', case when r.status in ('reveal', 'finished') then a.points_awarded else null end
      )
      from public.answers a
      where a.player_id = p_player_id and a.question_index = r.current_question
    )
  )
  from public.rooms r
  where r.id = p_room_id;
$$;

create or replace function public.create_room(
  p_code text,
  p_nickname text,
  p_session_token text,
  p_questions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  v_room public.rooms%rowtype;
  v_player public.players%rowtype;
begin
  if p_code !~ '^[A-HJ-NP-Z2-9]{6}$' then
    raise exception 'Invalid room code.';
  end if;
  if char_length(trim(p_nickname)) not between 2 and 18 then
    raise exception 'Nickname must be 2–18 characters.';
  end if;
  if length(p_session_token) < 32 then
    raise exception 'Invalid player session.';
  end if;
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) <> 6 then
    raise exception 'A match requires exactly six questions.';
  end if;

  insert into public.rooms(code, status, current_question, question_set)
  values (p_code, 'lobby', 0, p_questions)
  returning * into v_room;

  insert into public.players(
    room_id, nickname, session_token_hash, is_host, score, powerups
  )
  values (
    v_room.id,
    trim(p_nickname),
    encode(digest(p_session_token, 'sha256'), 'hex'),
    true,
    0,
    '{"double_points":1,"freeze_clock":1}'::jsonb
  )
  returning * into v_player;

  return jsonb_build_object(
    'roomCode', v_room.code,
    'playerId', v_player.id,
    'state', public.bb_room_state(v_room.id, v_player.id)
  );
end;
$$;

create or replace function public.join_room(
  p_code text,
  p_nickname text,
  p_session_token text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  v_room public.rooms%rowtype;
  v_player public.players%rowtype;
begin
  select * into v_room from public.rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'Room not found. Check the code and try again.'; end if;
  if v_room.status <> 'lobby' then raise exception 'This match has already started.'; end if;
  if char_length(trim(p_nickname)) not between 2 and 18 then
    raise exception 'Nickname must be 2–18 characters.';
  end if;
  if length(p_session_token) < 32 then raise exception 'Invalid player session.'; end if;
  if (select count(*) from public.players where room_id = v_room.id) >= 8 then
    raise exception 'This room is full.';
  end if;
  if exists (
    select 1 from public.players
    where room_id = v_room.id and lower(nickname) = lower(trim(p_nickname))
  ) then
    raise exception 'That nickname is already taken in this room.';
  end if;

  insert into public.players(
    room_id, nickname, session_token_hash, is_host, score, powerups
  )
  values (
    v_room.id,
    trim(p_nickname),
    encode(digest(p_session_token, 'sha256'), 'hex'),
    false,
    0,
    '{"double_points":1,"freeze_clock":1}'::jsonb
  )
  returning * into v_player;

  return jsonb_build_object(
    'roomCode', v_room.code,
    'playerId', v_player.id,
    'state', public.bb_room_state(v_room.id, v_player.id)
  );
end;
$$;

create or replace function public.get_room_state(p_code text, p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  v_player public.players%rowtype;
begin
  update public.players p
  set last_seen_at = now()
  from public.rooms r
  where r.id = p.room_id
    and r.code = upper(trim(p_code))
    and p.session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex')
  returning p.* into v_player;

  if not found then raise exception 'A valid room session is required.'; end if;
  return public.bb_room_state(v_player.room_id, v_player.id);
end;
$$;

create or replace function public.start_match(
  p_code text,
  p_session_token text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  v_player public.players%rowtype;
  v_room public.rooms%rowtype;
  v_cached jsonb;
  v_state jsonb;
begin
  select * into v_player
  from public.players
  where session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex');
  if not found then raise exception 'A valid room session is required.'; end if;
  select * into v_room from public.rooms where id = v_player.room_id for update;
  if not found then raise exception 'Room not found.'; end if;
  select * into v_player
  from public.players
  where id = v_player.id
    and session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex')
  for update;
  if not found then raise exception 'A valid room session is required.'; end if;

  select response into v_cached
  from public.game_action_requests
  where player_id = v_player.id and request_id = p_request_id and operation = 'start_match';
  if found then return v_cached; end if;
  if not v_player.is_host then raise exception 'Only the host can start the match.'; end if;

  if v_room.status = 'lobby' then
    if (select count(*) from public.players where room_id = v_room.id) < 4 then
      raise exception 'At least four players are required to start.';
    end if;
    update public.rooms
    set status = 'question', current_question = 0, question_started_at = now(), updated_at = now()
    where id = v_room.id;
  elsif v_room.status not in ('question', 'reveal') then
    raise exception 'This match cannot be started.';
  end if;

  v_state := public.bb_room_state(v_room.id, v_player.id);
  insert into public.game_action_requests(player_id, request_id, operation, response)
  values (v_player.id, p_request_id, 'start_match', v_state);
  return v_state;
end;
$$;

create or replace function public.submit_answer(
  p_code text,
  p_session_token text,
  p_question_index integer,
  p_option_index integer,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  v_player public.players%rowtype;
  v_room public.rooms%rowtype;
  v_question jsonb;
  v_correct boolean;
  v_points integer;
  v_elapsed_ms integer;
  v_deadline timestamptz;
  v_double boolean;
  v_cached jsonb;
  v_state jsonb;
begin
  select * into v_player
  from public.players
  where session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex');
  if not found then raise exception 'A valid room session is required.'; end if;
  select * into v_room from public.rooms where id = v_player.room_id for update;
  if not found then raise exception 'Room not found.'; end if;
  select * into v_player
  from public.players
  where id = v_player.id
    and session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex')
  for update;
  if not found then raise exception 'A valid room session is required.'; end if;

  select response into v_cached
  from public.game_action_requests
  where player_id = v_player.id and request_id = p_request_id and operation = 'submit_answer';
  if found then return v_cached; end if;
  if v_room.code <> upper(trim(p_code)) then raise exception 'Room session does not match this room.'; end if;
  if v_room.status <> 'question' then raise exception 'This question is no longer accepting answers.'; end if;
  if p_question_index <> v_room.current_question then raise exception 'The question has changed.'; end if;
  if p_option_index not between 0 and 3 then raise exception 'Choose a valid answer.'; end if;
  if exists (
    select 1 from public.answers
    where player_id = v_player.id and question_index = v_room.current_question
  ) then
    raise exception 'You have already answered this question.';
  end if;

  v_deadline := v_room.question_started_at + interval '15 seconds';
  if now() > v_deadline and (v_player.freeze_clock_until is null or now() > v_player.freeze_clock_until) then
    raise exception 'Time is up.';
  end if;
  v_question := v_room.question_set -> v_room.current_question;
  v_correct := p_option_index = (v_question ->> 'correctIndex')::integer;
  v_elapsed_ms := greatest(0, least(15000, floor(extract(epoch from (now() - v_room.question_started_at)) * 1000)::integer));
  v_double := coalesce((v_player.active_powerups ->> 'double_points')::boolean, false);
  v_points := case
    when v_correct then (1000 + greatest(0, least(500, floor((15000 - v_elapsed_ms)::numeric / 30)::integer))) * case when v_double then 2 else 1 end
    else 0
  end;

  insert into public.answers(room_id, player_id, question_index, option_index, is_correct, points_awarded)
  values (v_room.id, v_player.id, v_room.current_question, p_option_index, v_correct, v_points);
  update public.players
  set score = score + v_points,
      active_powerups = active_powerups - 'double_points',
      freeze_clock_until = null
  where id = v_player.id;

  if not exists (
    select 1 from public.players p
    where p.room_id = v_room.id
      and not exists (
        select 1 from public.answers a
        where a.player_id = p.id and a.question_index = v_room.current_question
      )
  ) then
    update public.rooms set status = 'reveal', updated_at = now() where id = v_room.id;
    update public.players
    set active_powerups = active_powerups - 'double_points',
        freeze_clock_until = null
    where room_id = v_room.id;
  end if;

  v_state := public.bb_room_state(v_room.id, v_player.id);
  insert into public.game_action_requests(player_id, request_id, operation, response)
  values (v_player.id, p_request_id, 'submit_answer', v_state);
  return v_state;
end;
$$;

create or replace function public.use_powerup(
  p_code text,
  p_session_token text,
  p_powerup text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  v_player public.players%rowtype;
  v_room public.rooms%rowtype;
  v_cached jsonb;
  v_state jsonb;
begin
  select * into v_player
  from public.players
  where session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex');
  if not found then raise exception 'A valid room session is required.'; end if;
  select * into v_room from public.rooms where id = v_player.room_id for update;
  if not found then raise exception 'Room not found.'; end if;
  select * into v_player
  from public.players
  where id = v_player.id
    and session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex')
  for update;
  if not found then raise exception 'A valid room session is required.'; end if;
  select response into v_cached
  from public.game_action_requests
  where player_id = v_player.id and request_id = p_request_id and operation = 'use_powerup';
  if found then return v_cached; end if;
  if v_room.code <> upper(trim(p_code)) then raise exception 'Room session does not match this room.'; end if;
  if v_room.status <> 'question' then raise exception 'Power-ups are only available during a question.'; end if;
  if p_powerup not in ('double_points', 'freeze_clock') then
    raise exception 'That power-up is not enabled in this game.';
  end if;
  if now() > v_room.question_started_at + interval '15 seconds' then
    raise exception 'Time is up.';
  end if;
  if exists (
    select 1 from public.answers
    where player_id = v_player.id and question_index = v_room.current_question
  ) then raise exception 'Power-ups must be used before answering.'; end if;
  if coalesce((v_player.powerups ->> p_powerup)::integer, 0) < 1 then
    raise exception 'You have no uses of that power-up remaining.';
  end if;
  if p_powerup = 'double_points'
     and coalesce((v_player.active_powerups ->> 'double_points')::boolean, false) then
    raise exception 'Double Points is already active.';
  end if;
  if p_powerup = 'freeze_clock'
     and v_player.freeze_clock_until is not null then
    raise exception 'Freeze Clock is already active.';
  end if;

  update public.players
  set powerups = jsonb_set(powerups, array[p_powerup], to_jsonb((powerups ->> p_powerup)::integer - 1)),
      active_powerups = case when p_powerup = 'double_points'
        then jsonb_set(active_powerups, '{double_points}', 'true'::jsonb, true)
        else active_powerups end,
      freeze_clock_until = case when p_powerup = 'freeze_clock'
        then v_room.question_started_at + interval '18 seconds'
        else freeze_clock_until end
  where id = v_player.id;

  v_state := public.bb_room_state(v_room.id, v_player.id);
  insert into public.game_action_requests(player_id, request_id, operation, response)
  values (v_player.id, p_request_id, 'use_powerup', v_state);
  return v_state;
end;
$$;

create or replace function public.advance_round(
  p_code text,
  p_session_token text,
  p_expected_question integer,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  v_player public.players%rowtype;
  v_room public.rooms%rowtype;
  v_cached jsonb;
  v_state jsonb;
  v_all_answered boolean;
begin
  select * into v_player
  from public.players
  where session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex');
  if not found then raise exception 'A valid room session is required.'; end if;
  select * into v_room from public.rooms where id = v_player.room_id for update;
  if not found then raise exception 'Room not found.'; end if;
  select * into v_player
  from public.players
  where id = v_player.id
    and session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex')
  for update;
  if not found then raise exception 'A valid room session is required.'; end if;
  select response into v_cached
  from public.game_action_requests
  where player_id = v_player.id and request_id = p_request_id and operation = 'advance_round';
  if found then return v_cached; end if;
  if v_room.code <> upper(trim(p_code)) then raise exception 'Room session does not match this room.'; end if;

  if v_room.current_question = p_expected_question then
    if v_room.status = 'question' then
      select not exists (
        select 1 from public.players p
        where p.room_id = v_room.id
          and not exists (
            select 1 from public.answers a
            where a.player_id = p.id and a.question_index = v_room.current_question
          )
      ) into v_all_answered;
      if not v_all_answered and now() < greatest(
        v_room.question_started_at + interval '15 seconds',
        coalesce((
          select max(p.freeze_clock_until)
          from public.players p
          where p.room_id = v_room.id
            and p.freeze_clock_until is not null
            and not exists (
              select 1 from public.answers a
              where a.player_id = p.id and a.question_index = v_room.current_question
            )
        ), v_room.question_started_at + interval '15 seconds')
      ) then
        raise exception 'Wait for everyone to answer or for the timer to expire.';
      end if;
      update public.rooms set status = 'reveal', updated_at = now() where id = v_room.id;
      update public.players
      set active_powerups = active_powerups - 'double_points',
          freeze_clock_until = null
      where room_id = v_room.id;
    elsif v_room.status = 'reveal' then
      if now() < v_room.updated_at + interval '3 seconds' then
        raise exception 'Wait for the reveal before continuing.';
      end if;
      if v_room.current_question + 1 >= jsonb_array_length(v_room.question_set) then
        update public.rooms set status = 'finished', updated_at = now() where id = v_room.id;
      else
        update public.rooms
        set status = 'question',
            current_question = current_question + 1,
            question_started_at = now(),
            updated_at = now()
        where id = v_room.id;
      end if;
    end if;
  end if;

  v_state := public.bb_room_state(v_room.id, v_player.id);
  insert into public.game_action_requests(player_id, request_id, operation, response)
  values (v_player.id, p_request_id, 'advance_round', v_state);
  return v_state;
end;
$$;

create or replace function public.rematch(
  p_code text,
  p_session_token text,
  p_questions jsonb,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  v_player public.players%rowtype;
  v_room public.rooms%rowtype;
  v_cached jsonb;
  v_state jsonb;
begin
  select * into v_player
  from public.players
  where session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex');
  if not found then raise exception 'A valid room session is required.'; end if;
  select * into v_room from public.rooms where id = v_player.room_id for update;
  if not found then raise exception 'Room not found.'; end if;
  select * into v_player
  from public.players
  where id = v_player.id
    and session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex')
  for update;
  if not found then raise exception 'A valid room session is required.'; end if;
  select response into v_cached
  from public.game_action_requests
  where player_id = v_player.id and request_id = p_request_id and operation = 'rematch';
  if found then return v_cached; end if;
  if not v_player.is_host then raise exception 'Only the host can start a rematch.'; end if;
  if v_room.code <> upper(trim(p_code)) then raise exception 'Room session does not match this room.'; end if;
  if v_room.status not in ('finished', 'closed') then raise exception 'Finish the current match before starting a rematch.'; end if;
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) <> 6 then
    raise exception 'A rematch requires exactly six questions.';
  end if;

  delete from public.answers where room_id = v_room.id;
  update public.players
  set score = 0,
      powerups = '{"double_points":1,"freeze_clock":1}'::jsonb,
      active_powerups = '{}'::jsonb,
      freeze_clock_until = null,
      last_seen_at = now()
  where room_id = v_room.id;
  update public.rooms
  set status = 'lobby',
      current_question = 0,
      question_started_at = null,
      question_set = p_questions,
      updated_at = now()
  where id = v_room.id;

  v_state := public.bb_room_state(v_room.id, v_player.id);
  insert into public.game_action_requests(player_id, request_id, operation, response)
  values (v_player.id, p_request_id, 'rematch', v_state);
  return v_state;
end;
$$;

create or replace function public.close_room(
  p_code text,
  p_session_token text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  v_player public.players%rowtype;
  v_room public.rooms%rowtype;
  v_cached jsonb;
  v_state jsonb;
begin
  select * into v_player
  from public.players
  where session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex');
  if not found then raise exception 'A valid room session is required.'; end if;
  select * into v_room from public.rooms where id = v_player.room_id for update;
  if not found then raise exception 'Room not found.'; end if;
  select * into v_player
  from public.players
  where id = v_player.id
    and session_token_hash = encode(digest(p_session_token, 'sha256'), 'hex')
  for update;
  if not found then raise exception 'A valid room session is required.'; end if;
  select response into v_cached
  from public.game_action_requests
  where player_id = v_player.id and request_id = p_request_id and operation = 'close_room';
  if found then return v_cached; end if;
  if not v_player.is_host then raise exception 'Only the host can close the room.'; end if;
  if v_room.code <> upper(trim(p_code)) then raise exception 'Room session does not match this room.'; end if;
  update public.rooms set status = 'closed', updated_at = now() where id = v_room.id;
  v_state := public.bb_room_state(v_room.id, v_player.id);
  insert into public.game_action_requests(player_id, request_id, operation, response)
  values (v_player.id, p_request_id, 'close_room', v_state);
  return v_state;
end;
$$;

revoke all on function public.bb_room_state(uuid, uuid) from public, anon, authenticated;
revoke all on function public.create_room(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.join_room(text, text, text) from public, anon, authenticated;
revoke all on function public.get_room_state(text, text) from public, anon, authenticated;
revoke all on function public.start_match(text, text, uuid) from public, anon, authenticated;
revoke all on function public.submit_answer(text, text, integer, integer, uuid) from public, anon, authenticated;
revoke all on function public.use_powerup(text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.advance_round(text, text, integer, uuid) from public, anon, authenticated;
revoke all on function public.rematch(text, text, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.close_room(text, text, uuid) from public, anon, authenticated;

grant execute on function public.create_room(text, text, text, jsonb) to service_role;
grant execute on function public.join_room(text, text, text) to service_role;
grant execute on function public.get_room_state(text, text) to service_role;
grant execute on function public.start_match(text, text, uuid) to service_role;
grant execute on function public.submit_answer(text, text, integer, integer, uuid) to service_role;
grant execute on function public.use_powerup(text, text, text, uuid) to service_role;
grant execute on function public.advance_round(text, text, integer, uuid) to service_role;
grant execute on function public.rematch(text, text, jsonb, uuid) to service_role;
grant execute on function public.close_room(text, text, uuid) to service_role;
