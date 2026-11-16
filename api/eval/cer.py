"""전사 정확도(CER, 문자 오류율). 한국어는 띄어쓰기가 흔들려서 단어 단위(WER)보다 문자 단위가 맞다.

정답과 전사를 같은 규칙으로 정규화한 뒤 편집 거리 / 정답 길이로 계산한다.
한국어·영어가 섞인 발화는 언어별 CER 도 따로 본다(영어를 한국어로 잘못 받아 적는 경우를 잡으려고).

사용: python -m eval.cer --ref reference.txt --hyp hypothesis.txt
      (줄 단위로 짝을 맞춘다. 한 줄 = 발화 하나)
"""

import argparse
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

PUNCTUATION = re.compile(r"[^\w]|_", re.UNICODE)
HANGUL = re.compile(r"[가-힣]")
LATIN = re.compile(r"[a-z]")


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).lower()
    return PUNCTUATION.sub("", text)


def edit_distance(a: str, b: str) -> int:
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        current = [i]
        for j, cb in enumerate(b, 1):
            current.append(min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (ca != cb)))
        previous = current
    return previous[-1]


@dataclass
class CerResult:
    errors: int
    length: int

    @property
    def cer(self) -> float:
        return self.errors / self.length if self.length else 0.0


def cer(reference: str, hypothesis: str, keep: re.Pattern | None = None) -> CerResult:
    ref, hyp = normalize(reference), normalize(hypothesis)
    if keep is not None:
        ref, hyp = "".join(keep.findall(ref)), "".join(keep.findall(hyp))
    return CerResult(edit_distance(ref, hyp), len(ref))


def corpus_cer(pairs: list[tuple[str, str]], keep: re.Pattern | None = None) -> CerResult:
    results = [cer(r, h, keep) for r, h in pairs]
    return CerResult(sum(r.errors for r in results), sum(r.length for r in results))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--ref", type=Path, required=True)
    parser.add_argument("--hyp", type=Path, required=True)
    args = parser.parse_args()

    refs = args.ref.read_text(encoding="utf-8").splitlines()
    hyps = args.hyp.read_text(encoding="utf-8").splitlines()
    if len(refs) != len(hyps):
        raise SystemExit(f"줄 수가 다릅니다: 정답 {len(refs)}줄, 전사 {len(hyps)}줄")
    pairs = list(zip(refs, hyps, strict=True))

    for label, keep in (("전체", None), ("한글만", HANGUL), ("영문만", LATIN)):
        result = corpus_cer(pairs, keep)
        print(f"{label:>4} CER {result.cer:6.2%}  (오류 {result.errors} / {result.length}자)")


if __name__ == "__main__":
    main()
