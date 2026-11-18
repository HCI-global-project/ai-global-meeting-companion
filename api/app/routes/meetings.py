"""회의 HTTP 엔드포인트: 채팅·의견 보내기, 수동 추천 요청, 노트, 나중에 들어온 참여자용 현재 상태."""

import asyncio
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request

from ..container import Container
from ..domain.models import MeetingNote, SegmentDraft
from ..pipeline.wire import transcript_final
from ..services.languages import translation_targets
from .access import client_ip, enforce, require_access
from .deps import container, participant_or_404
from .schemas import MessageRequest, NoteRequest, OpinionRequest

log = logging.getLogger(__name__)

# 회의 종료 화면이 '정리 중'으로 기다리는 최대 시간
FINALIZE_TIMEOUT_S = 20

# 모든 회의 요청은 접속 코드를 확인한다
router = APIRouter(prefix="/api/meetings/{meeting_id}", dependencies=[Depends(require_access)])


@router.get("/state")
async def state(meeting_id: str, c: Container = Depends(container)) -> dict:
    session = await c.registry.get(meeting_id)
    return {
        "primaryLanguage": session.primary_language,
        "languages": session.languages,
        "segments": [transcript_final(session, s) for s in session.window],
        "context": session.context.dump() if session.context else None,
        "outcome": session.outcome.dump() if session.outcome else None,
    }


@router.post("/outcome/finalize")
async def finalize_outcome(meeting_id: str, c: Container = Depends(container)) -> dict:
    """회의 종료 화면: 모아 두던 마지막 발화까지 회의 결과에 바로 반영하고 돌려준다.

    회의 결과는 발화를 몇 개씩(최대 30초) 모아 정리해서, 그냥 두면 마지막 결정이 늦게 들어온다.
    오래 걸리면 지금까지의 결과를 돌려준다. 처리 중인 작업은 끊지 않고 마저 끝낸다(shield).
    """
    session = await c.registry.get(meeting_id)
    try:
        await asyncio.wait_for(asyncio.shield(session.flush()), timeout=FINALIZE_TIMEOUT_S)
    except TimeoutError:
        log.warning("회의 결과 마무리가 %s초를 넘김 (%s)", FINALIZE_TIMEOUT_S, meeting_id)
    return {"outcome": session.outcome.dump() if session.outcome else None}


@router.post("/messages", status_code=201)
async def send_message(meeting_id: str, body: MessageRequest, c: Container = Depends(container)) -> dict:
    session = await c.registry.get(meeting_id)
    sender = participant_or_404(session, body.participant_id)
    enforce(c.limits.messages, sender.id, "messages")
    text = body.text.strip()
    if not text:
        raise HTTPException(400, "내용이 비어 있습니다.")
    anonymous = body.kind == "opinion" and body.anonymous
    segment = await session.add_segment(
        SegmentDraft(
            text=text,
            # 직접 입력한 글은 보낸 사람 언어로 쓴 것으로 본다
            language=sender.language,
            source=body.kind,
            # 익명 의견은 서버에도 보낸 사람을 남기지 않는다
            participant_id=None if anonymous else sender.id,
            speaker="" if anonymous else sender.name,
            is_anonymous=anonymous,
        )
    )
    return {"segmentId": segment.id}


@router.post("/signals/wait", status_code=201)
async def request_wait(meeting_id: str, request: Request, c: Container = Depends(container)) -> dict:
    """'잠깐 기다려 주세요' — 누가 보냈는지 남기지 않는 요청 알림. LLM 은 부르지 않는다.

    보낸 사람을 받지 않으므로 IP 로 센다. 같은 Wi-Fi 의 여러 명이 함께 세지지만 드물게 쓰는 버튼이라 충분하다.
    """
    enforce(c.limits.messages, f"wait:{client_ip(request)}", "wait")
    session = await c.registry.get(meeting_id)
    segment = await session.add_segment(SegmentDraft(text="", source="signal", is_anonymous=True))
    return {"segmentId": segment.id}


@router.post("/opinions", status_code=202)
async def request_opinion(meeting_id: str, body: OpinionRequest, c: Container = Depends(container)) -> dict:
    session = await c.registry.get(meeting_id)
    participant = participant_or_404(session, body.participant_id)
    enforce(c.limits.opinions, participant.id, "opinions")
    target = session.find_segment(body.segment_id)
    if target is None:
        raise HTTPException(404, "발화를 찾을 수 없습니다.")
    c.opinion.request(session, participant, target, source="manual")
    return {"status": "accepted"}


@router.post("/notes", status_code=201)
async def add_note(meeting_id: str, body: NoteRequest, c: Container = Depends(container)) -> dict:
    session = await c.registry.get(meeting_id)
    content = body.content.strip()
    if not content:
        raise HTTPException(400, "내용이 비어 있습니다.")
    enforce(c.limits.messages, f"note:{meeting_id}:{body.author}", "notes")
    targets = translation_targets(session.languages, body.language)
    translated = await c.translator.translate([content], targets) if targets else {}
    note = MeetingNote(
        id=f"note-{uuid.uuid4().hex[:8]}",
        meeting_id=meeting_id,
        author=body.author,
        content=content,
        translated_content={lang: texts[0] for lang, texts in translated.items() if texts and texts[0]},
    )
    await session.store.save_note(note)
    return note.dump()
