/**
 * 녹음한 Soniox 로그(VITE_TOKEN_LOG=true 로 받은 soniox-log-*.json)를 분절 규칙별로 다시 끊어 비교한다.
 *
 * 사용: npm run replay:segments -- <로그.json> [--show <프리셋>] [--limit 20]
 *   --show 를 주면 그 프리셋으로 끊은 발화를 앞에서부터 보여 준다
 *
 * 새 규칙을 시험하려면 아래 CANDIDATES 에 한 줄 더하면 된다. 좋으면 presets.ts 로 옮긴다.
 */
import { readFileSync } from 'node:fs';
import { clauseRules, labRules, labSplitRules, splitCommaRules } from '../src/features/stt/segmentation/presets.ts';
import { replay, stats, type TokenFrame } from '../src/features/stt/segmentation/replay.ts';
import type { BoundaryRule, SegmentDraft } from '../src/features/stt/segmentation/types.ts';

const CANDIDATES: Record<string, () => BoundaryRule[]> = {
  lab: labRules,
  'lab-split': labSplitRules,
  clause: () => clauseRules(),
  'clause-100': () => clauseRules({ maxChars: 100 }),
  'split-comma': splitCommaRules,
};

interface TokenLogFile {
  meta: Record<string, unknown>;
  frames: TokenFrame[];
  segments: SegmentDraft[];
}

function parseArgs(argv: string[]) {
  const [path, ...rest] = argv;
  if (!path) throw new Error('사용: npm run replay:segments -- <soniox-log.json> [--show <프리셋>] [--limit N]');
  const flag = (name: string) => {
    const i = rest.indexOf(name);
    return i >= 0 ? rest[i + 1] : undefined;
  };
  return { path, show: flag('--show'), limit: Number(flag('--limit') ?? 20) };
}

const pct = (v: number) => `${Math.round(v * 100)}%`.padStart(4);

function main() {
  const { path, show, limit } = parseArgs(process.argv.slice(2));
  const log = JSON.parse(readFileSync(path, 'utf-8')) as TokenLogFile;
  const lastMs = log.frames.at(-1)?.atMs ?? 0;
  console.log(`${path}`);
  console.log(`녹음 당시 프리셋: ${String(log.meta.preset)} · ${(lastMs / 60_000).toFixed(1)}분 · 토큰 묶음 ${log.frames.length}개\n`);

  // 재생이 실제 전사기와 같은지: 녹음 당시 프리셋으로 다시 끊은 결과가 로그의 발화와 같아야 한다
  const recordedPreset = String(log.meta.preset);
  if (CANDIDATES[recordedPreset]) {
    const again = replay(log.frames, CANDIDATES[recordedPreset]());
    const same =
      again.length === log.segments.length && again.every((s, i) => s.text === log.segments[i].text);
    console.log(same ? `재생 검증: ${recordedPreset} 재생 결과가 녹음 때와 같음\n` : `재생 검증: 녹음 때와 다름 (${again.length} vs ${log.segments.length}개) — 아래 숫자는 근사치\n`);
  }

  console.log('프리셋        발화  평균  중앙  p90  최대  80자↑  15자↓  깔끔한끝  끊은 이유');
  const results: Record<string, SegmentDraft[]> = {};
  for (const [name, rules] of Object.entries(CANDIDATES)) {
    const segments = replay(log.frames, rules());
    results[name] = segments;
    const s = stats(segments);
    const reasons = Object.entries(s.reasons)
      .sort((a, b) => b[1] - a[1])
      .map(([r, n]) => `${r} ${n}`)
      .join(', ');
    console.log(
      `${name.padEnd(12)} ${String(s.count).padStart(4)} ${String(s.mean).padStart(5)} ${String(s.median).padStart(5)}` +
        ` ${String(s.p90).padStart(4)} ${String(s.max).padStart(5)}   ${pct(s.longRatio)}   ${pct(s.shortRatio)}     ${pct(s.cleanEndRatio)}   ${reasons}`,
    );
  }

  if (show) {
    const segments = results[show];
    if (!segments) throw new Error(`모르는 프리셋: ${show} (${Object.keys(CANDIDATES).join(', ')})`);
    console.log(`\n-- ${show} 발화 (앞 ${limit}개)`);
    for (const [i, s] of segments.slice(0, limit).entries()) {
      console.log(`${String(i).padStart(3)} 화자${s.speaker} [${s.reason}] (${s.text.length}) ${s.text}`);
    }
  }
}

main();
