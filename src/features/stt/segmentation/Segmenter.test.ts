import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TokenScript } from './__fixtures__/tokens';
import { clauseRules, labRules } from './presets';
import { Segmenter } from './Segmenter';
import type { BoundaryRule, SegmentDraft, SttToken } from './types';

function segment(tokens: SttToken[], rules: BoundaryRule[] = clauseRules()): SegmentDraft[] {
  const out: SegmentDraft[] = [];
  const segmenter = new Segmenter(rules, (s) => out.push(s));
  segmenter.push(tokens);
  segmenter.flush('stop');
  return out;
}

// 문장부호 없이 쉬지 않고 이어 말한 한국어. lab 에서 5~6줄 덩어리가 되던 상황
const CONTINUOUS =
  '오늘은 다음 주 사용자 테스트 일정부터 정해 볼게요 일단 참가자는 다섯 명 정도로 생각하고 있는데 ' +
  '모집은 학교 커뮤니티에 올리면 될 것 같아요 그리고 프로토타입은 목요일까지 마무리해야 하는데 ' +
  '화면 흐름이 아직 확정이 안 돼서 그 부분부터 같이 보면 좋겠어요';

describe('continuous Korean speech without punctuation', () => {
  it('lab rules keep the whole 140-char speech as one chunk', () => {
    const lab = segment(new TokenScript().speak(CONTINUOUS).tokens, labRules());
    assert.equal(lab.length, 1);
    assert.equal(lab[0].text, CONTINUOUS);
  });

  it('clause rules cut at Korean endings into short segments', () => {
    const out = segment(new TokenScript().speak(CONTINUOUS).tokens);
    assert.ok(out.length >= 3, `expected 3+ segments, got ${out.length}`);
    assert.ok(out.every((s) => s.text.length <= 70), out.map((s) => s.text.length).join(','));
    assert.equal(out[0].text, '오늘은 다음 주 사용자 테스트 일정부터 정해 볼게요');
    assert.equal(out.map((s) => s.text).join(' '), CONTINUOUS);
  });

  it('does not cut inside a word split into sub-word tokens', () => {
    const out = segment(new TokenScript().speak(CONTINUOUS, { splitWords: true }).tokens);
    assert.equal(out.map((s) => s.text).join(' '), CONTINUOUS);
    assert.equal(out[0].text, '오늘은 다음 주 사용자 테스트 일정부터 정해 볼게요');
  });

  it('does not treat nouns like 참가자 / 까지 / 화면 as endings', () => {
    const out = segment(new TokenScript().speak('이번 테스트 참가자 모집은 목요일까지 화면 시안이랑 같이 할게요').tokens);
    assert.equal(out.length, 1);
  });
});

describe('code switching', () => {
  it('keeps English mixed inside a Korean sentence', () => {
    const tokens = new TokenScript()
      .speak('이번', { language: 'ko' })
      .speak('deadline', { language: 'en' })
      .tokens;
    tokens.push({ text: '은', isFinal: true, language: 'ko', speaker: '1', startMs: 1000, endMs: 1080 });
    tokens.push({ text: ' 금요일이에요', isFinal: true, language: 'ko', speaker: '1', startMs: 1080, endMs: 1500 });
    const out = segment(tokens);
    assert.equal(out.length, 1);
    assert.equal(out[0].text, '이번 deadline은 금요일이에요');
    assert.equal(out[0].language, 'ko');
  });

  it('cuts when a speaker switches to an English sentence', () => {
    const out = segment(
      new TokenScript()
        .speak('제가 정리해서 공유할게요', { language: 'ko' })
        .speak('Can we push it to Friday?', { language: 'en', speaker: '1', gapBeforeMs: 300 })
        .tokens
    );
    assert.deepEqual(
      out.map((s) => [s.text, s.language]),
      [
        ['제가 정리해서 공유할게요', 'ko'],
        ['Can we push it to Friday?', 'en'],
      ]
    );
  });
});

describe('other boundaries', () => {
  it('cuts on speaker change', () => {
    const out = segment(new TokenScript().speak('목요일 어떠세요', { speaker: '1' }).speak('좋습니다', { speaker: '2' }).tokens);
    assert.deepEqual(out.map((s) => [s.speaker, s.reason]), [['1', 'speaker'], ['2', 'stop']]);
  });

  it('cuts on a pause even for a one-character reply', () => {
    const out = segment(new TokenScript().speak('네').speak('그럼 그렇게 진행하죠', { gapBeforeMs: 800 }).tokens);
    assert.deepEqual(out.map((s) => s.text), ['네', '그럼 그렇게 진행하죠']);
    assert.equal(out[0].reason, 'pause');
  });

  it('cuts long unpunctuated English at a word boundary', () => {
    const words = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ');
    const out = segment(new TokenScript().speak(words, { language: 'en' }).tokens);
    assert.ok(out.length >= 2);
    assert.ok(out.every((s) => !s.text.startsWith(' ') && s.text.length <= 100));
  });

  it('flushes on the Soniox endpoint token and records timing', () => {
    const out: SegmentDraft[] = [];
    const segmenter = new Segmenter(clauseRules(), (s) => out.push(s));
    segmenter.push(new TokenScript().speak('회의 시작할게요').end().tokens);
    assert.equal(out.length, 1);
    assert.equal(out[0].startMs, 0);
    assert.ok((out[0].endMs ?? 0) > 0);
  });

  it('returns final plus interim text for display', () => {
    const segmenter = new Segmenter(clauseRules(), () => {});
    const display = segmenter.push([
      { text: '지금', isFinal: true, speaker: '1', language: 'ko' },
      { text: ' 말하는', isFinal: false },
    ]);
    assert.equal(display, '지금 말하는');
    assert.equal(segmenter.push([]), '지금');
  });
});
