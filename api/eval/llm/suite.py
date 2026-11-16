"""케이스 파일을 읽고, 케이스마다 실행기 → 검사를 돌린다."""

import asyncio
import json
import traceback
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from app.clients.llm import LlmClient

from .checks import CheckResult, run_check, validate
from .recording import Call, RecordingLlmClient
from .runners import RUNNERS

CASES_DIR = Path(__file__).parent / "cases"


@dataclass(frozen=True)
class Case:
    task: str
    id: str
    note: str
    input: dict[str, Any]
    checks: list[dict[str, Any]]


@dataclass
class CaseResult:
    task: str
    case_id: str
    attempt: int
    checks: list[CheckResult] = field(default_factory=list)
    output: dict[str, Any] = field(default_factory=dict)
    calls: list[Call] = field(default_factory=list)
    error: str | None = None

    @property
    def passed(self) -> bool:
        return self.error is None and all(c.passed for c in self.checks)

    def to_dict(self) -> dict[str, Any]:
        return {**asdict(self), "passed": self.passed}


def load_cases(tasks: list[str] | None = None, case_ids: list[str] | None = None) -> list[Case]:
    cases: list[Case] = []
    for path in sorted(CASES_DIR.glob("*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        task = raw["task"]
        if tasks and task not in tasks:
            continue
        for c in raw["cases"]:
            if case_ids and c["id"] not in case_ids:
                continue
            cases.append(Case(task, c["id"], c.get("note", ""), c["input"], c["checks"]))
    return cases


def problems(cases: list[Case]) -> list[str]:
    """케이스 파일 문제(모르는 작업, 검사 오타, 중복 id)."""
    found: list[str] = []
    seen: set[tuple[str, str]] = set()
    for case in cases:
        where = f"{case.task}/{case.id}"
        if case.task not in RUNNERS:
            found.append(f"{where}: 모르는 작업")
        if (case.task, case.id) in seen:
            found.append(f"{where}: id 중복")
        seen.add((case.task, case.id))
        if not case.checks:
            found.append(f"{where}: 검사가 없음")
        found += [f"{where}: {p}" for spec in case.checks for p in validate(spec)]
    return found


async def run_case(case: Case, llm: LlmClient, attempt: int = 1) -> CaseResult:
    recorder = RecordingLlmClient(llm)
    result = CaseResult(case.task, case.id, attempt)
    try:
        result.output = await RUNNERS[case.task](case.input, recorder)
        result.checks = [run_check(result.output, spec) for spec in case.checks]
    except Exception as e:
        result.error = f"{type(e).__name__}: {e}"
        result.output = {"traceback": traceback.format_exc(limit=3)}
    result.calls = recorder.calls
    return result


async def run_suite(cases: list[Case], llm: LlmClient, repeat: int = 1, concurrency: int = 4) -> list[CaseResult]:
    """같은 케이스를 repeat 번 돌린다. LLM 은 같은 입력에도 답이 흔들려서 한 번으로는 통과율을 믿기 어렵다."""
    semaphore = asyncio.Semaphore(concurrency)

    async def one(case: Case, attempt: int) -> CaseResult:
        async with semaphore:
            return await run_case(case, llm, attempt)

    return list(await asyncio.gather(*(one(c, a) for a in range(1, repeat + 1) for c in cases)))
