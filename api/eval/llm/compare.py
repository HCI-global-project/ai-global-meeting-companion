"""평가 결과 두 개를 비교한다. 프롬프트를 고치기 전(A)과 후(B), 모델 A 와 B 처럼.

사용: python -m eval.llm.compare eval/llm/results/A.json eval/llm/results/B.json
"""

import argparse
import json
from pathlib import Path
from typing import Any


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def rate(case: dict[str, int] | None) -> str:
    return f"{case['passed']}/{case['runs']}" if case else "-"


def ratio(case: dict[str, int] | None) -> float | None:
    return case["passed"] / case["runs"] if case and case["runs"] else None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("a", type=Path)
    parser.add_argument("b", type=Path)
    args = parser.parse_args()
    a, b = load(args.a), load(args.b)

    for side, data in (("A", a), ("B", b)):
        meta = data["meta"]
        print(f"{side}: {meta['label']}  ({meta['provider']}/{meta['model']}, {meta['git']['commit']}"
              f"{'+수정' if meta['git']['dirty'] else ''})")
    changed = sorted(n for n, h in b["meta"]["prompts"].items() if a["meta"]["prompts"].get(n) != h)
    print(f"바뀐 프롬프트: {', '.join(changed) or '없음'}")

    # 한쪽에서만 돌린 작업은 나빠진 게 아니라 비교할 수 없는 것이다
    only = sorted(set(a["summary"]) ^ set(b["summary"]))
    if only:
        print(f"한쪽에서만 돌린 작업(비교 안 함): {', '.join(only)}")

    for task in sorted(set(a["summary"]) & set(b["summary"])):
        ta, tb = a["summary"].get(task), b["summary"].get(task)
        print(f"\n== {task}  A {rate(ta)} · B {rate(tb)}"
              f"  (평균 {ta['latency_ms']['mean'] if ta else '-'}ms → {tb['latency_ms']['mean'] if tb else '-'}ms)")
        cases_a = ta["cases"] if ta else {}
        cases_b = tb["cases"] if tb else {}
        for case_id in sorted(set(cases_a) | set(cases_b)):
            ra, rb = ratio(cases_a.get(case_id)), ratio(cases_b.get(case_id))
            if ra is None or rb is None:
                mark = "? "  # 한쪽에만 있는 케이스
            else:
                mark = "  " if ra == rb else ("▲ " if rb > ra else "▼ ")
            print(f"  {mark}{case_id}: {rate(cases_a.get(case_id))} → {rate(cases_b.get(case_id))}")


if __name__ == "__main__":
    main()
