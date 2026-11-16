"""프롬프트·모델 성능 평가를 돌린다. 실제 LLM 을 부르므로 api/.env 의 키를 쓴다(비용이 든다).

사용 (api 폴더에서):
    python -m eval.llm.run                          # 전체, .env 의 AI_PROVIDER
    python -m eval.llm.run --task translate --repeat 3
    python -m eval.llm.run --case burmese-script -v
    python -m eval.llm.run --model gemini-3.5-flash-lite --label flash
    python -m eval.llm.run --check                  # 케이스 파일만 검사(LLM 호출 없음)

결과는 eval/llm/results/ 에 JSON 으로 남는다. 두 결과 비교: python -m eval.llm.compare A.json B.json
"""

import argparse
import asyncio
import sys

import httpx

from app.clients.factory import build_llm_client
from app.config import Settings

from .report import print_summary, save
from .runners import RUNNERS
from .suite import load_cases, problems, run_suite


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--task", action="append", choices=sorted(RUNNERS), help="이 작업만 (여러 번 쓸 수 있음)")
    parser.add_argument("--case", action="append", help="이 케이스 id 만 (여러 번 쓸 수 있음)")
    parser.add_argument("--repeat", type=int, default=1, help="케이스마다 몇 번 돌릴지 (기본 1)")
    parser.add_argument("--concurrency", type=int, default=4, help="동시에 부를 LLM 호출 수 (기본 4)")
    parser.add_argument("--provider", choices=["gemini", "openai", "fake"], help=".env 의 AI_PROVIDER 대신")
    parser.add_argument("--model", help="기본 모델 대신 (gemini 면 GEMINI_MODEL, openai 면 OPENAI_MODEL)")
    parser.add_argument("--label", help="결과 파일 이름에 붙일 이름 (기본: 모델 이름)")
    parser.add_argument("--no-save", action="store_true", help="결과 파일을 남기지 않음")
    parser.add_argument("--check", action="store_true", help="케이스 파일만 검사하고 끝냄")
    parser.add_argument("-v", "--verbose", action="store_true", help="실패한 케이스의 출력을 자르지 않고 보여 줌")
    return parser.parse_args()


def make_settings(args: argparse.Namespace) -> Settings:
    settings = Settings()
    overrides: dict = {}
    if args.provider:
        overrides["ai_provider"] = args.provider
    if args.model:
        overrides["openai_model" if (args.provider or settings.ai_provider) == "openai" else "gemini_model"] = args.model
    return settings.model_copy(update=overrides)


def model_name(settings: Settings) -> str:
    return {"gemini": settings.gemini_model, "openai": settings.openai_model}.get(settings.ai_provider, "fake")


async def main() -> int:
    args = parse_args()
    cases = load_cases(args.task, args.case)
    if found := problems(cases):
        print("케이스 파일 문제:\n  " + "\n  ".join(found))
        return 2
    if not cases:
        print("돌릴 케이스가 없습니다.")
        return 2
    if args.check:
        print(f"케이스 {len(cases)}개 이상 없음")
        return 0

    settings = make_settings(args)
    model = model_name(settings)
    print(f"{settings.ai_provider} / {model} · 케이스 {len(cases)}개 × {args.repeat}회")

    async with httpx.AsyncClient() as http:
        llm = build_llm_client(settings, http)
        results = await run_suite(cases, llm, args.repeat, args.concurrency)

    print_summary(results, args.verbose)
    if not args.no_save:
        meta = {
            "provider": settings.ai_provider,
            "model": model,
            "fallback_model": settings.gemini_fallback_model if settings.ai_provider == "gemini" else None,
            "repeat": args.repeat,
            "tasks": args.task,
            "cases": args.case,
        }
        path = save(results, meta, args.label or model)
        print(f"\n결과 저장: {path}")
    return 0 if all(r.passed for r in results) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
