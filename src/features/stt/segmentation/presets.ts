import { koreanEnding, languageChange, maxLength, pause, sentenceEnd, speakerChange } from './rules';
import type { BoundaryRule } from './types';

/**
 * 끊기 규칙 묶음. 실험 조건으로 바꿔 가며 비교한다.
 * - lab: synq-realtime-lab 과 같은 규칙. 쉬지 않고 말하면 150자 덩어리가 된다(비교 기준)
 * - clause: 쉼·한국어 어미·언어 전환까지 보고 짧게 끊는다(기본)
 */
export type SegmentationPreset = 'lab' | 'clause';

export interface ClauseOptions {
  pauseMs: number;
  maxChars: number;
  terminalMinChars: number;
  connectiveMinChars: number;
  languageSwitchGapMs: number;
}

export const DEFAULT_CLAUSE_OPTIONS: ClauseOptions = {
  pauseMs: 500,
  maxChars: 70,
  terminalMinChars: 8,
  connectiveMinChars: 35,
  languageSwitchGapMs: 250,
};

export function labRules(): BoundaryRule[] {
  return [speakerChange, maxLength(150, Number.POSITIVE_INFINITY), sentenceEnd(40)];
}

export function clauseRules(options: Partial<ClauseOptions> = {}): BoundaryRule[] {
  const o = { ...DEFAULT_CLAUSE_OPTIONS, ...options };
  return [
    speakerChange,
    languageChange(o.languageSwitchGapMs),
    pause(o.pauseMs, 1),
    koreanEnding(o.terminalMinChars, o.connectiveMinChars),
    maxLength(o.maxChars),
    sentenceEnd(2),
  ];
}

export function rulesFor(preset: SegmentationPreset, options?: Partial<ClauseOptions>): BoundaryRule[] {
  return preset === 'lab' ? labRules() : clauseRules(options);
}
