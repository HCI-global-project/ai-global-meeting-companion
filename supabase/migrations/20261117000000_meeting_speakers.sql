-- 화자 분리 번호('녹음 회차:번호')를 참여자에 잇는 표.
-- 한 방에서 마이크 하나로 녹음하므로, 참여자가 화면에서 '화자 2 = 민지'를 고른다.
-- 해제는 행을 지우지 않고 participant_id 를 비운다.
create table public.meeting_speakers (
  meeting_id text not null,
  speaker_key text not null,
  participant_id text,
  updated_at timestamptz not null default now(),
  primary key (meeting_id, speaker_key)
);

create or replace function public.touch_meeting_speakers()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger meeting_speakers_touch
  before update on public.meeting_speakers
  for each row execute function public.touch_meeting_speakers();

alter table public.meeting_speakers enable row level security;

create policy "pipeline: read speakers" on public.meeting_speakers
  for select to authenticated using (true);

alter publication supabase_realtime add table public.meeting_speakers;
