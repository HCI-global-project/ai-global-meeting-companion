import type { BoundaryRule, SegmentState, SttToken } from './types';

const SENTENCE_END = /[.?!。？！]["')\]]*\s*$/;
// 한국어 종결어미. 문장부호 없이 와도 여기서 말이 끝난 경우가 많다.
// '자'(참가자), '지'(까지), '네'(네 명) 처럼 명사·조사와 겹치는 끝은 넣지 않는다
const KOREAN_TERMINAL = /(다|요|죠|까)$/;
// 연결어미. 문장은 이어지지만 길어졌으면 여기서 끊어도 뜻이 통한다.
// '서'(보고서), '면'(화면) 처럼 한 글자만 보면 명사와 헷갈려서 두 글자 이상으로 본다
const KOREAN_CONNECTIVE = /(는데|은데|인데|니까|거든|지만|하고|이고|어서|아서|해서|으면|하면|려면)$/;

const length = (state: SegmentState) => state.text.trim().length;
// 마지막 어절. "다 같이"의 '다' 처럼 한 글자 어절은 어미로 보지 않는다
const lastWord = (text: string) => text.trimEnd().split(/\s+/).pop() ?? '';
const endsWith = (text: string, pattern: RegExp) => {
  const word = lastWord(text);
  return word.length >= 2 && pattern.test(word);
};
// Soniox 토큰은 새 단어를 공백으로 시작한다. 단어 중간("했어" + "요")에서 끊지 않으려고 본다
const startsWord = (token: SttToken) => /^\s/.test(token.text);
const gapMs = (state: SegmentState, next: SttToken) =>
  state.lastToken?.endMs !== undefined && next.startMs !== undefined
    ? next.startMs - state.lastToken.endMs
    : 0;

/** 화자가 바뀌면 그 앞까지가 한 발화다 */
export const speakerChange: BoundaryRule = {
  name: 'speaker',
  cutBefore: (state, next) =>
    Boolean(next.speaker && state.speaker && next.speaker !== state.speaker && length(state) > 0),
};

/** 문장부호로 끝나면 끊는다. 너무 짧은 감탄("네.")은 다음 말과 붙인다 */
export function sentenceEnd(minChars: number): BoundaryRule {
  return {
    name: 'sentence',
    cutAfter: (state) => length(state) >= minChars && SENTENCE_END.test(state.text),
  };
}

/**
 * Soniox 의 발화 끝 신호. 짧은 쉼에도 오므로 짧은 조각("그래서", "네")은 끊지 않고
 * 다음 말과 붙인다. 정말 말이 끝났으면 전사기의 쉼 타이머가 내보낸다.
 */
export function endpoint(minChars: number): BoundaryRule {
  return {
    name: 'endpoint',
    cutOnEndpoint: (state) => length(state) >= minChars,
  };
}

/** 말 사이 쉼. 토큰 시각이 있을 때만 쓴다 */
export function pause(minGapMs: number, minChars: number): BoundaryRule {
  return {
    name: 'pause',
    cutBefore: (state, next) => length(state) >= minChars && gapMs(state, next) >= minGapMs,
  };
}

/**
 * 한국어 어미. 다음 토큰이 새 단어로 시작할 때만 본다.
 * 종결어미는 짧아도 끊고, 연결어미는 발화가 길어졌을 때만 끊는다.
 */
export function koreanEnding(terminalMinChars: number, connectiveMinChars: number): BoundaryRule {
  return {
    name: 'korean-ending',
    cutBefore: (state, next) => {
      if (state.language && state.language !== 'ko') return false;
      if (!startsWord(next)) return false;
      const n = length(state);
      return (
        (n >= terminalMinChars && endsWith(state.text, KOREAN_TERMINAL)) ||
        (n >= connectiveMinChars && endsWith(state.text, KOREAN_CONNECTIVE))
      );
    },
  };
}

/**
 * 언어가 바뀌면 끊는다. 단, 문장 안에 섞어 말한 영어("이번 deadline은 금요일")에서 끊지 않도록
 * 쉼이 있거나 앞 발화가 말이 끝난 모양일 때만 끊는다.
 */
export function languageChange(minGapMs: number): BoundaryRule {
  return {
    name: 'language',
    cutBefore: (state, next) => {
      if (!next.language || !state.language || next.language === state.language) return false;
      if (length(state) === 0 || !next.text.trim()) return false;
      return (
        gapMs(state, next) >= minGapMs ||
        SENTENCE_END.test(state.text) ||
        endsWith(state.text, KOREAN_TERMINAL)
      );
    },
  };
}

/**
 * 길어진 발화가 쉼표로 끝나면 다음 단어 앞에서 끊는다.
 * 강의처럼 쉼표로 길게 이어 말하면 마침표가 안 와서 글자 수 상한에서 구 중간이 잘리던 것을 줄인다.
 */
export function commaBreak(minChars: number): BoundaryRule {
  return {
    name: 'comma',
    cutBefore: (state, next) => length(state) >= minChars && /,\s*$/.test(state.text) && startsWord(next),
  };
}

/** 길이 상한. 단어 경계에서 끊고, 경계가 안 나오면 여유분을 넘긴 뒤 그냥 끊는다 */
export function maxLength(maxChars: number, slackChars = 30): BoundaryRule {
  return {
    name: 'max-length',
    cutBefore: (state, next) => {
      const n = length(state);
      return (n >= maxChars && startsWord(next)) || n >= maxChars + slackChars;
    },
  };
}
