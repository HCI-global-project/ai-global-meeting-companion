"""녹음 기기 한 대와, 화자 분리 번호를 참여자에 잇는 표.

한 방에 모여 마이크 하나로 녹음하므로 Soniox 는 '화자 1·2'만 안다. 참여자가 화면에서
'화자 2 = 민지'를 고르면 그 화자의 지난 줄과 앞으로의 줄이 모두 민지가 된다.

Soniox 는 녹음을 새로 시작할 때마다 번호를 1부터 다시 매긴다. 그래서 화자 키는
'녹음 회차:번호' 로 만들고, 지난 회차에 고른 이름은 지난 줄에만 남게 한다.
"""

import uuid
from dataclasses import dataclass, field

from ..domain.models import Segment

UNKNOWN_SPEAKER = "?"


@dataclass
class SpeakerDirectory:
    assignments: dict[str, str] = field(default_factory=dict)
    recorder_id: str | None = None
    run_id: str = ""

    def start(self, participant_id: str) -> bool:
        """녹음 기기를 맡는다. 다른 참여자가 녹음 중이면 False."""
        if self.recorder_id and self.recorder_id != participant_id:
            return False
        if self.recorder_id != participant_id:
            self.run_id = uuid.uuid4().hex[:6]
            self.recorder_id = participant_id
        return True

    def stop(self, participant_id: str) -> bool:
        if self.recorder_id != participant_id:
            return False
        self.recorder_id = None
        return True

    def key(self, speaker: str) -> str:
        return f"{self.run_id}:{speaker or UNKNOWN_SPEAKER}"

    def participant_of(self, segment: Segment) -> str | None:
        if segment.participant_id:
            return segment.participant_id
        if segment.source == "speech" and segment.speaker:
            return self.assignments.get(segment.speaker)
        return None


def speaker_number(key: str) -> str:
    """'a1b2c3:2' → '2'. 회차가 없는 예전 발화는 그대로 둔다."""
    return key.rsplit(":", 1)[-1]
