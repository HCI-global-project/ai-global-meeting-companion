-- 외부 참여자를 받기 전에 브라우저(익명 로그인 포함)의 직접 접근을 닫는다.
--
-- lab 에서는 화면이 Supabase 에서 직접 읽고(Realtime) 발화도 RPC 로 직접 썼다. 지금은 모든 읽기·쓰기를
-- FastAPI 가 service role 로 하고 화면은 FastAPI WebSocket 으로 받는다. 그런데 앞선 마이그레이션의
-- "로그인한 사용자면 누구나 읽기" 정책이 남아 있어서, 익명 로그인만 하면 publishable key 로
-- 다른 방의 전사까지 읽고, append_segment 로 아무 방에나 발화를 써 넣을 수 있었다.
--
-- RLS 는 켜 둔 채 정책을 지운다. 정책이 없으면 anon·authenticated 는 아무것도 못 하고,
-- service role(FastAPI)은 RLS 를 거치지 않아 그대로 쓴다. 화면이 직접 읽어야 하는 기능이 생기면
-- 그때 회의 참여자로 범위를 좁힌 정책을 따로 만든다.

drop policy if exists "lab: read segments" on public.transcript_segments;
drop policy if exists "lab: read live context" on public.live_context;
drop policy if exists "own suggestions" on public.opinion_suggestions;
drop policy if exists "lab: read translations" on public.segment_translations;
drop policy if exists "pipeline: read meetings" on public.meetings;
drop policy if exists "pipeline: read participants" on public.meeting_participants;
drop policy if exists "pipeline: read outcome" on public.meeting_outcome;
drop policy if exists "pipeline: read notes" on public.meeting_notes;
drop policy if exists "pipeline: read speakers" on public.meeting_speakers;

-- 발화 순번 함수는 FastAPI 만 부른다
revoke execute on function public.append_segment(text, text, text, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.append_segment(text, text, text, text, text, text, boolean) to service_role;

-- 화면이 Realtime 으로 받지 않으므로 발행 목록에서도 뺀다(정책이 없어 어차피 전달되지 않는다)
alter publication supabase_realtime
  drop table public.transcript_segments, public.live_context, public.segment_translations,
    public.meeting_outcome, public.opinion_suggestions, public.meeting_notes, public.meeting_speakers;
