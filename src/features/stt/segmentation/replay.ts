import { Segmenter } from './Segmenter';
import type { BoundaryRule, SegmentDraft, SttToken } from './types';

/** TokenLog 가 남긴 토큰 묶음 하나. atMs 는 녹음 시작부터 받은 시각 */
export interface TokenFrame {
  atMs: number;
  tokens: SttToken[];
}

// SonioxTranscriber 의 쉼 타이머와 같은 값. 마지막 확정 토큰 뒤로 이만큼 조용하면 확정한다
export const IDLE_FLUSH_MS = 5_000;

/**
 * 녹음한 토큰을 분절기에 다시 넣는다. 다시 녹음하지 않고 규칙만 바꿔 비교하려는 것.
 * 전사기의 쉼 타이머는 토큰이 받은 시각(atMs)으로 흉내 낸다.
 */
export function replay(frames: TokenFrame[], rules: BoundaryRule[]): SegmentDraft[] {
  const out: SegmentDraft[] = [];
  const segmenter = new Segmenter(rules, (s) => out.push(s));
  let lastFinalAt: number | null = null;

  for (const frame of frames) {
    if (lastFinalAt !== null && frame.atMs - lastFinalAt >= IDLE_FLUSH_MS && segmenter.hasPending) {
      segmenter.flush('idle');
    }
    segmenter.push(frame.tokens);
    if (frame.tokens.some((t) => t.isFinal)) lastFinalAt = frame.atMs;
  }
  segmenter.flush('stop');
  return out;
}

const SENTENCE_END = /[.?!。？！]["')\]]*$/;
const KOREAN_ENDING = /(다|요|죠|까|는데|은데|인데|니까|거든|지만|하고|이고|어서|아서|해서|으면|하면|려면)$/;

/**
 * 말이 끝난 자리에서 끊겼는지. 문장부호, 쉼표, 한국어 어미로 끝나면 깔끔하게 끊긴 것으로 본다.
 * "이 젠슨 / 황이" 처럼 어절 중간이나 구 중간에서 잘린 발화를 세려는 근사치다.
 */
export function endsCleanly(text: string): boolean {
  const trimmed = text.trim();
  if (SENTENCE_END.test(trimmed) || trimmed.endsWith(',')) return true;
  const word = trimmed.split(/\s+/).pop() ?? '';
  return word.length >= 2 && KOREAN_ENDING.test(word);
}

export interface ReplayStats {
  count: number;
  mean: number;
  median: number;
  p90: number;
  max: number;
  // 80자(화면 한 줄 남짓)를 넘는 발화 비율
  longRatio: number;
  // 15자 미만 조각 비율. 너무 잘게 끊는지 본다
  shortRatio: number;
  cleanEndRatio: number;
  reasons: Record<string, number>;
}

export const LONG_CHARS = 80;
export const SHORT_CHARS = 15;

export function stats(segments: SegmentDraft[]): ReplayStats {
  const lengths = segments.map((s) => s.text.length).sort((a, b) => a - b);
  const n = lengths.length;
  const ratio = (count: number) => (n ? Math.round((count / n) * 1000) / 1000 : 0);
  const reasons: Record<string, number> = {};
  for (const s of segments) reasons[s.reason] = (reasons[s.reason] ?? 0) + 1;
  return {
    count: n,
    mean: n ? Math.round((lengths.reduce((a, b) => a + b, 0) / n) * 10) / 10 : 0,
    median: n ? lengths[Math.floor(n / 2)] : 0,
    p90: n ? lengths[Math.min(n - 1, Math.floor(n * 0.9))] : 0,
    max: n ? lengths[n - 1] : 0,
    longRatio: ratio(lengths.filter((l) => l > LONG_CHARS).length),
    shortRatio: ratio(lengths.filter((l) => l < SHORT_CHARS).length),
    cleanEndRatio: ratio(segments.filter((s) => endsCleanly(s.text)).length),
    reasons,
  };
}
