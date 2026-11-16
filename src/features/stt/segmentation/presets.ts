import {
  commaBreak,
  endpoint,
  koreanEnding,
  languageChange,
  maxLength,
  pause,
  sentenceEnd,
  speakerChange,
} from './rules';
import type { BoundaryRule } from './types';

/**
 * 끊기 규칙 묶음. 실험 조건으로 바꿔 가며 비교한다.
 * - lab: synq-realtime-lab 과 같은 규칙. 쉬지 않고 말하면 150자 덩어리가 된다(비교 기준)
 * - lab-split: lab 그대로 두고 긴 덩어리만 푼다(기본). 50자를 넘긴 뒤 한국어 종결어미가 오면 끊고, 상한을 100자로 낮춘다
 * - clause: 쉼·한국어 어미·언어 전환까지 보고 짧게 끊는다. 실제 회의에서 문장이 너무 잘게 잘려 기본에서 뺐다
 * - split-comma: lab-split 에 '40자를 넘기고 쉼표로 끝나면 끊기'를 더하고, 문장 끝 기준을 40자 → 30자로 낮춘다(실험).
 *   15분 강의 재생에서 80자 넘는 발화가 68% → 2% 로 줄었다. 짧은 문장이 여럿 이어지는 시연 녹음에서는
 *   문장 끝 기준 40자일 때 문장이 뭉쳐 100자 덩어리가 됐다(6% → 30자에서 4%, 더 낮춰도 같았다)
 */
export type SegmentationPreset = 'lab' | 'lab-split' | 'clause' | 'split-comma';

export const SEGMENTATION_PRESETS: readonly SegmentationPreset[] = ['lab', 'lab-split', 'clause', 'split-comma'];

const COMMA_MIN_CHARS = 40;
const SPLIT_COMMA_SENTENCE_MIN_CHARS = 30;

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

export function labSplitRules(): BoundaryRule[] {
  return [
    speakerChange,
    // 연결어미는 사실상 쓰지 않는다(상한보다 크게). 끝난 문장에서만 끊는다
    koreanEnding(50, Number.POSITIVE_INFINITY),
    maxLength(100),
    sentenceEnd(40),
    endpoint(1),
  ];
}

export function splitCommaRules(): BoundaryRule[] {
  return [
    speakerChange,
    koreanEnding(50, Number.POSITIVE_INFINITY),
    // 상한보다 앞에 둔다. 쉼표가 나오면 100자까지 가기 전에 끊는다
    commaBreak(COMMA_MIN_CHARS),
    maxLength(100),
    sentenceEnd(SPLIT_COMMA_SENTENCE_MIN_CHARS),
    endpoint(1),
  ];
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
  if (preset === 'lab') return labRules();
  if (preset === 'clause') return clauseRules(options);
  if (preset === 'split-comma') return splitCommaRules();
  return labSplitRules();
}
