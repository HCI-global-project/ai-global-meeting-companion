import { endpoint, koreanEnding, languageChange, maxLength, pause, sentenceEnd, speakerChange } from './rules';
import type { BoundaryRule } from './types';

/**
 * 끊기 규칙 묶음. 실험 조건으로 바꿔 가며 비교한다.
 * - lab: synq-realtime-lab 과 같은 규칙. 쉬지 않고 말하면 150자 덩어리가 된다(비교 기준)
 * - clause: 쉼·한국어 어미·언어 전환까지 보고 짧게 끊는다(기본)
 */
export type SegmentationPreset = 'lab' | 'clause';

export interface ClauseOptions {
  pauseMs: number;
  // 쉼·발화 끝 신호·문장부호로 끊을 최소 길이. 이보다 짧으면 다음 말과 붙인다
  minChars: number;
  maxChars: number;
  terminalMinChars: number;
  connectiveMinChars: number;
  languageSwitchGapMs: number;
}

// 실제 회의에서 0.5초 쉼·8자 기준은 문장 중간에서 너무 자주 끊었다. 짧은 조각은 붙이는 쪽으로 잡는다
export const DEFAULT_CLAUSE_OPTIONS: ClauseOptions = {
  pauseMs: 900,
  minChars: 12,
  maxChars: 80,
  terminalMinChars: 15,
  connectiveMinChars: 40,
  languageSwitchGapMs: 250,
};

export function labRules(): BoundaryRule[] {
  return [speakerChange, maxLength(150, Number.POSITIVE_INFINITY), sentenceEnd(40), endpoint(1)];
}

export function clauseRules(options: Partial<ClauseOptions> = {}): BoundaryRule[] {
  const o = { ...DEFAULT_CLAUSE_OPTIONS, ...options };
  return [
    speakerChange,
    languageChange(o.languageSwitchGapMs),
    pause(o.pauseMs, o.minChars),
    koreanEnding(o.terminalMinChars, o.connectiveMinChars),
    maxLength(o.maxChars),
    sentenceEnd(o.minChars),
    endpoint(o.minChars),
  ];
}

export function rulesFor(preset: SegmentationPreset, options?: Partial<ClauseOptions>): BoundaryRule[] {
  return preset === 'lab' ? labRules() : clauseRules(options);
}
