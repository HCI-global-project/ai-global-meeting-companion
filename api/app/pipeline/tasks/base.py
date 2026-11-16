"""LLM 작업의 공통 모양. 새 기능은 이 클래스를 상속한 파일 하나 + 프롬프트 파일 하나로 더한다."""

from abc import ABC, abstractmethod

from ..background import BackgroundTasks
from ..events import Event
from ..scheduling import Immediate, Runner, SchedulingPolicy
from ..session import MeetingSession


class MeetingTask(ABC):
    name: str = "task"
    # 어떤 이벤트에 반응하는지
    subscriptions: tuple[type[Event], ...] = ()

    def accepts(self, session: MeetingSession, event: Event) -> bool:
        """같은 종류의 이벤트 중에서도 처리할 것만 고른다."""
        return True

    def make_policy(self, run: Runner, tasks: BackgroundTasks) -> SchedulingPolicy:
        """기본은 이벤트마다 바로 실행. 묶어서 돌릴 작업은 덮어쓴다."""
        return Immediate(run, tasks, self.name)

    @abstractmethod
    async def run(self, session: MeetingSession, events: list[Event]) -> None: ...
