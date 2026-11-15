"""발화 길이 분포. "말을 끊지 않으면 5~6줄 덩어리로 끊긴다" 문제가 줄었는지 숫자로 본다.

프론트 토큰 로거가 내보낸 JSON(segments 배열의 text)을 읽는다.
사용: python -m eval.segment_stats soniox-log-*.json
"""

import argparse
import json
import statistics
from pathlib import Path

# 화면 한 줄에 들어가는 글자 수의 대략값. 이보다 길면 '덩어리'로 본다.
LONG_SEGMENT_CHARS = 80


def stats(lengths: list[int]) -> dict[str, float]:
    if not lengths:
        return {"count": 0}
    ordered = sorted(lengths)
    return {
        "count": len(ordered),
        "mean": round(statistics.mean(ordered), 1),
        "median": statistics.median(ordered),
        "p90": ordered[min(len(ordered) - 1, int(len(ordered) * 0.9))],
        "max": ordered[-1],
        "long_ratio": round(sum(n > LONG_SEGMENT_CHARS for n in ordered) / len(ordered), 3),
    }


def lengths_from(path: Path) -> list[int]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return [len(s["text"]) for s in data.get("segments", [])]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("logs", nargs="+", type=Path)
    args = parser.parse_args()
    for path in args.logs:
        print(path.name, stats(lengths_from(path)))


if __name__ == "__main__":
    main()
