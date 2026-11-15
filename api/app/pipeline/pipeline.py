"""작업 목록을 세션의 이벤트 버스에 연결한다. 어떤 작업을 켤지는 여기 목록 하나로 정해진다."""

from collections.abc import Sequence

from .events import Event
from .session import MeetingSession
from .tasks.base import MeetingTask


class Pipeline:
    def __init__(self, tasks: Sequence[MeetingTask]):
        self.tasks = list(tasks)

    def attach(self, session: MeetingSession) -> None:
        for task in self.tasks:
            self._attach_task(session, task)

    @staticmethod
    def _attach_task(session: MeetingSession, task: MeetingTask) -> None:
        async def run(events: list[Event]) -> None:
            await task.run(session, events)

        policy = task.make_policy(run, session.background)
        session.policies.append(policy)

        def offer(event: Event) -> None:
            if task.accepts(session, event):
                policy.offer(event)

        for event_type in task.subscriptions:
            session.bus.subscribe(event_type, offer)

    def find(self, task_type: type[MeetingTask]) -> MeetingTask | None:
        return next((t for t in self.tasks if isinstance(t, task_type)), None)
