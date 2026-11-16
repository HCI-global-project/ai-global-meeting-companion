-- 보정 테스트 페이지용: AI 가 문맥으로 고친 전사. 원문(content)은 그대로 두고 따로 저장한다.
alter table public.transcript_segments add column corrected_content text;
alter table public.transcript_segments add column corrected_ms int;
