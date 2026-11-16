"""결과 묶음 → 터미널 요약과 저장용 JSON."""

import hashlib
import json
import statistics
import subprocess
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

from app.prompts.loader import PROMPT_DIR

from .suite import CaseResult

RESULTS_DIR = Path(__file__).parent / "results"


def percentile(values: list[int], q: float) -> int:
    if not values:
        return 0
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, round(q * (len(ordered) - 1)))]


def summarize(results: list[CaseResult]) -> dict[str, Any]:
    """작업별·케이스별 통과율과 지연 시간."""
    by_case: dict[tuple[str, str], list[CaseResult]] = defaultdict(list)
    for r in results:
        by_case[(r.task, r.case_id)].append(r)

    tasks: dict[str, dict[str, Any]] = {}
    for (task, case_id), runs in by_case.items():
        t = tasks.setdefault(
            task,
            {"cases": {}, "runs": 0, "passed": 0, "errors": 0, "checks": 0, "checks_passed": 0, "ms": [],
             "models": Counter()},
        )
        passed = sum(r.passed for r in runs)
        # 오류(429·503 등)는 프롬프트가 틀린 것과 구분한다
        errors = sum(r.error is not None for r in runs)
        t["cases"][case_id] = {"passed": passed, "runs": len(runs), "errors": errors}
        t["runs"] += len(runs)
        t["passed"] += passed
        t["errors"] += errors
        t["checks"] += sum(len(r.checks) for r in runs)
        t["checks_passed"] += sum(c.passed for r in runs for c in r.checks)
        # 케이스 작업 이름과 LLM 호출 이름(StructuredRequest.task)이 같다
        ok_calls = [c for r in runs for c in r.calls if c.task == task and c.error is None]
        t["ms"] += [c.ms for c in ok_calls]
        # 기본 모델이 한도에 걸리면 대체 모델이 답한다. 실제로 답한 모델을 남긴다
        t["models"].update(c.model for c in ok_calls)

    for t in tasks.values():
        ms = t.pop("ms")
        t["latency_ms"] = {"mean": round(statistics.mean(ms)) if ms else 0, "p95": percentile(ms, 0.95)}
        t["models"] = dict(t["models"])
    return tasks


def print_summary(results: list[CaseResult], verbose: bool = False) -> None:
    summary = summarize(results)
    failures = [r for r in results if not r.passed]

    for task, t in summary.items():
        errors = f" · 오류 {t['errors']}" if t["errors"] else ""
        models = ", ".join(f"{m} {n}회" for m, n in t["models"].items()) or "-"
        print(f"\n== {task}  케이스 {t['passed']}/{t['runs']} 통과{errors} · 검사 {t['checks_passed']}/{t['checks']}"
              f" · 평균 {t['latency_ms']['mean']}ms · p95 {t['latency_ms']['p95']}ms")
        print(f"   응답 모델: {models}")
        for case_id, c in t["cases"].items():
            if c["passed"] == c["runs"]:
                mark = "PASS"
            elif c["errors"] == c["runs"] - c["passed"]:
                mark = "ERROR"  # 검사에서 떨어진 게 아니라 호출이 실패했다
            else:
                mark = "FLAKY" if c["passed"] else "FAIL"
            print(f"  [{mark:>5}] {case_id}  ({c['passed']}/{c['runs']})")

    if failures:
        print("\n-- 실패 내역")
        for r in failures:
            print(f"\n  {r.task}/{r.case_id} #{r.attempt}")
            if r.error:
                print(f"    오류: {r.error.splitlines()[0][:160]}")
            for c in r.checks:
                if not c.passed:
                    print(f"    - {c.check} {c.field}: {c.detail}")
            if verbose or r.error is None:
                print("    출력: " + json.dumps(r.output, ensure_ascii=False)[:600])


def prompt_hashes() -> dict[str, str]:
    """프롬프트 파일 지문. 결과를 비교할 때 어느 프롬프트로 돌렸는지 알려고 남긴다."""
    return {
        p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:12] for p in sorted(PROMPT_DIR.glob("*.md"))
    }


def git_state() -> dict[str, Any]:
    def git(*args: str) -> str:
        try:
            return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout.strip()
        except (OSError, subprocess.CalledProcessError):
            return ""

    return {"commit": git("rev-parse", "--short", "HEAD"), "dirty": bool(git("status", "--porcelain", "--", "."))}


def save(results: list[CaseResult], meta: dict[str, Any], label: str) -> Path:
    RESULTS_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    path = RESULTS_DIR / f"{stamp}-{label}.json"
    payload = {
        "meta": {**meta, "label": label, "git": git_state(), "prompts": prompt_hashes()},
        "summary": summarize(results),
        "results": [r.to_dict() for r in results],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    return path
