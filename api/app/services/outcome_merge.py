"""회의 결과에 LLM 이 낸 변경 사항(add/update/move/remove)을 적용한다.

매번 전체를 다시 만들면 항목이 흔들리고 사라진다. 그래서 변경분만 받아 고정 id 를 지키며 합친다.
"""

import logging
import uuid
from typing import Literal, get_args

from pydantic import BaseModel

from ..domain.models import MeetingOutcome, OutcomeBucket, OutcomeItem, now

log = logging.getLogger(__name__)

BUCKETS: tuple[OutcomeBucket, ...] = get_args(OutcomeBucket)


class Operation(BaseModel):
    op: Literal["add", "update", "move", "remove"]
    id: str | None = None
    bucket: OutcomeBucket | None = None
    text: str | None = None
    owner: str | None = None


def new_id() -> str:
    return f"o-{uuid.uuid4().hex[:8]}"


def apply_operations(outcome: MeetingOutcome, operations: list[Operation]) -> tuple[MeetingOutcome, set[str]]:
    """새 결과와 글이 바뀐(번역이 필요한) 항목 id 를 돌려준다. 원본은 건드리지 않는다."""
    result = outcome.model_copy(deep=True)
    changed: set[str] = set()
    for op in operations:
        try:
            _apply(result, op, changed)
        except ValueError as e:
            log.warning("회의 결과 변경 무시: %s (%s)", e, op)
    if changed or result != outcome:
        result.updated_at = now()
    return result, changed


def _apply(outcome: MeetingOutcome, op: Operation, changed: set[str]) -> None:
    if op.op == "add":
        text = (op.text or "").strip()
        if not text or op.bucket is None:
            raise ValueError("add 에 bucket·text 가 없다")
        if _find_by_text(outcome, text):
            return  # 이미 있는 내용을 다시 넣는 경우
        item = OutcomeItem(id=new_id(), text=text, owner=_clean_owner(op.owner))
        outcome.bucket(op.bucket).append(item)
        changed.add(item.id)
        return

    bucket, item = _find(outcome, op.id)
    if op.op == "remove":
        bucket.remove(item)
    elif op.op == "move":
        if op.bucket is None:
            raise ValueError("move 에 bucket 이 없다")
        bucket.remove(item)
        outcome.bucket(op.bucket).append(item)
    else:  # update
        if op.text and op.text.strip() != item.text:
            item.text = op.text.strip()
            item.translations = {}
            changed.add(item.id)
        if op.owner is not None:
            item.owner = _clean_owner(op.owner)


def _find(outcome: MeetingOutcome, item_id: str | None) -> tuple[list[OutcomeItem], OutcomeItem]:
    for name in BUCKETS:
        bucket = outcome.bucket(name)
        for item in bucket:
            if item.id == item_id:
                return bucket, item
    raise ValueError(f"없는 항목 id: {item_id}")


def _find_by_text(outcome: MeetingOutcome, text: str) -> OutcomeItem | None:
    return next((i for name in BUCKETS for i in outcome.bucket(name) if i.text == text), None)


def _clean_owner(owner: str | None) -> str | None:
    return owner.strip() if owner and owner.strip() else None


def describe(outcome: MeetingOutcome) -> str:
    """프롬프트에 넣을 현재 목록."""
    lines = [
        f"[{item.id}] ({name}) {item.text}" + (f" (담당: {item.owner})" if item.owner else "")
        for name in BUCKETS
        for item in outcome.bucket(name)
    ]
    return "\n".join(lines) or "(없음)"
