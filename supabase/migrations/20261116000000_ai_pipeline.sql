-- AI 파이프라인(FastAPI)용 스키마. 쓰기는 FastAPI 가 service role 로 하고, 화면은 Realtime 으로 받는다.
-- 앞선 lab 마이그레이션 위에 얹는다.

-- 회의 설정. 주 언어는 맥락·결과·추천을 쓰는 언어다(기본 한국어).
create table public.meetings (
  meeting_id text primary key,
  primary_language text not null default 'ko',
  created_at timestamptz not null default now()
);

-- 참여자. 번역 대상 언어와 추천 개인화(역할)에 쓴다.
create table public.meeting_participants (
  meeting_id text not null,
  participant_id text not null,
  -- Supabase 익명 로그인 사용자. 추천을 본인에게만 보이게 하는 데 쓴다.
  user_id uuid,
  name text not null default '',
  role text not null default '',
  language text not null default 'ko',
  joined_at timestamptz not null default now(),
  primary key (meeting_id, participant_id)
);

-- 발화 출처: 음성(speech), 채팅(chat), 의견(opinion), '잠깐 기다려 주세요' 요청(signal)
alter table public.transcript_segments
  add column source text not null default 'speech' check (source in ('speech', 'chat', 'opinion', 'signal')),
  -- 채팅·의견처럼 보낸 사람을 아는 경우. 익명 의견은 null 로 두어 서버에도 남기지 않는다.
  add column participant_id text,
  add column is_anonymous boolean not null default false;

-- 맥락을 쓴 언어와 다른 언어 번역 {언어: {topic, summary}}
alter table public.live_context
  add column language text not null default 'ko',
  add column translations jsonb not null default '{}';

-- 회의 결과 누적. 항목마다 고정 id 가 있다 [{id, text, owner, translations}]
create table public.meeting_outcome (
  meeting_id text primary key,
  decided jsonb not null default '[]',
  action_items jsonb not null default '[]',
  undecided jsonb not null default '[]',
  language text not null default 'ko',
  updated_at timestamptz not null default now()
);

-- 의견 추천은 참여자 단위로 만든다. FastAPI 는 Supabase 사용자를 모를 수 있어 participant_id 로 구분한다.
alter table public.opinion_suggestions
  alter column user_id drop not null,
  add column participant_id text,
  -- opinion_extra_english 실험 조건일 때 영어 문장 {agree, disagree, alternative}
  add column english jsonb;
alter table public.opinion_suggestions
  add constraint opinion_suggestions_participant_unique unique (meeting_id, participant_id, segment_id, source);

create table public.meeting_notes (
  id bigint generated always as identity primary key,
  meeting_id text not null,
  author text not null default '',
  content text not null,
  translations jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- 출처·참여자까지 받도록 순번 함수를 바꾼다. 회의 단위 advisory lock 으로 순번이 겹치지 않는다.
drop function public.append_segment(text, text, text, text);

create function public.append_segment(
  p_meeting text,
  p_speaker text,
  p_content text,
  p_language text default null,
  p_source text default 'speech',
  p_participant_id text default null,
  p_is_anonymous boolean default false
)
returns public.transcript_segments
language plpgsql security definer set search_path = public as $$
declare
  v_row public.transcript_segments;
begin
  perform pg_advisory_xact_lock(hashtext(p_meeting));
  insert into public.transcript_segments
    (meeting_id, sequence_index, speaker, content, language, source, participant_id, is_anonymous)
  values (
    p_meeting,
    coalesce((select max(sequence_index) from public.transcript_segments where meeting_id = p_meeting), -1) + 1,
    p_speaker,
    p_content,
    p_language,
    p_source,
    p_participant_id,
    p_is_anonymous
  )
  returning * into v_row;
  return v_row;
end $$;

revoke execute on function public.append_segment(text, text, text, text, text, text, boolean) from public, anon;
grant execute on function public.append_segment(text, text, text, text, text, text, boolean) to authenticated, service_role;

alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.meeting_outcome enable row level security;
alter table public.meeting_notes enable row level security;

-- 실험용이라 로그인한 사용자는 방 코드만 알면 읽을 수 있다(lab 과 같은 수준). 쓰기는 FastAPI(service role)만 한다.
create policy "pipeline: read meetings" on public.meetings
  for select to authenticated using (true);
create policy "pipeline: read participants" on public.meeting_participants
  for select to authenticated using (true);
create policy "pipeline: read outcome" on public.meeting_outcome
  for select to authenticated using (true);
create policy "pipeline: read notes" on public.meeting_notes
  for select to authenticated using (true);
-- 추천은 기존 "own suggestions"(user_id = auth.uid()) 정책 그대로 본인 것만 보인다.

-- FastAPI 가 쓴 결과를 화면이 Realtime 으로 받는다.
-- 추천은 RLS 가 적용돼 본인 것만 전달된다.
alter publication supabase_realtime
  add table public.segment_translations, public.meeting_outcome, public.opinion_suggestions, public.meeting_notes;
