import asyncio

from app.pipeline.background import BackgroundTasks
from app.pipeline.events import Event
from app.pipeline.scheduling import Batched, Immediate


def event(n: int) -> Event:
    return Event(meeting_id=f"m{n}")


async def test_immediate_runs_each_event():
    tasks, seen = BackgroundTasks(), []

    async def run(events):
        seen.append([e.meeting_id for e in events])

    policy = Immediate(run, tasks, "t")
    policy.offer(event(1))
    policy.offer(event(2))
    await tasks.drain()
    assert sorted(seen) == [["m1"], ["m2"]]


async def test_batched_runs_when_batch_is_full():
    tasks, seen = BackgroundTasks(), []

    async def run(events):
        seen.append([e.meeting_id for e in events])

    policy = Batched(run, tasks, "t", min_items=2, max_wait_s=60)
    policy.offer(event(1))
    await asyncio.sleep(0)
    assert seen == []
    policy.offer(event(2))
    await asyncio.sleep(0.01)
    assert seen == [["m1", "m2"]]
    await policy.flush()
    await tasks.drain()


async def test_batched_runs_after_max_wait_even_if_not_full():
    tasks, seen = BackgroundTasks(), []

    async def run(events):
        seen.append(len(events))

    policy = Batched(run, tasks, "t", min_items=5, max_wait_s=0.02)
    policy.offer(event(1))
    await asyncio.sleep(0.06)
    assert seen == [1]


async def test_batched_never_runs_concurrently_and_keeps_late_events():
    tasks, running, peak, seen = BackgroundTasks(), 0, 0, []

    async def run(events):
        nonlocal running, peak
        running += 1
        peak = max(peak, running)
        await asyncio.sleep(0.02)
        seen.extend(e.meeting_id for e in events)
        running -= 1

    policy = Batched(run, tasks, "t", min_items=1, max_wait_s=60)
    for n in range(5):
        policy.offer(event(n))
        await asyncio.sleep(0.005)
    await policy.flush()
    await tasks.drain()
    assert peak == 1
    assert seen == [f"m{n}" for n in range(5)]
