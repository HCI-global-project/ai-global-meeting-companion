import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { labSplitRules } from './presets';
import { IDLE_FLUSH_MS, endsCleanly, replay, stats, type TokenFrame } from './replay';

const word = (text: string, startMs: number): TokenFrame['tokens'][number] => ({
  text,
  isFinal: true,
  startMs,
  endMs: startMs + 200,
  speaker: '1',
  language: 'ko',
});

describe('replay', () => {
  it('flushes on silence like the transcriber idle timer', () => {
    const frames: TokenFrame[] = [
      { atMs: 0, tokens: [word('회의', 0), word(' 시작할게요', 200)] },
      // 마지막 확정 토큰 뒤로 쉼 타이머보다 오래 조용했다
      { atMs: IDLE_FLUSH_MS + 1, tokens: [word(' 다음', IDLE_FLUSH_MS + 1)] },
    ];
    const out = replay(frames, labSplitRules());
    assert.deepEqual(
      out.map((s) => [s.text, s.reason]),
      [
        ['회의 시작할게요', 'idle'],
        ['다음', 'stop'],
      ],
    );
  });

  it('keeps talking together when the gap is short', () => {
    const frames: TokenFrame[] = [
      { atMs: 0, tokens: [word('회의', 0)] },
      { atMs: 1_000, tokens: [word(' 시작할게요', 1_000)] },
    ];
    assert.equal(replay(frames, labSplitRules()).length, 1);
  });
});

describe('endsCleanly', () => {
  it('accepts sentence ends, commas and Korean endings', () => {
    assert.ok(endsCleanly('테스트는 금요일로 하죠.'));
    assert.ok(endsCleanly('다른 반에서도 이야기가 있었는데,'));
    assert.ok(endsCleanly('목요일까지 마무리하는데'));
  });

  it('rejects cuts in the middle of a phrase', () => {
    assert.ok(!endsCleanly('이 정도의'));
    assert.ok(!endsCleanly('그냥 이 젠슨'));
  });
});

describe('stats', () => {
  it('counts long, short and reasons', () => {
    const s = stats([
      { text: 'a'.repeat(90), speaker: '1', reason: 'max-length' },
      { text: '네.', speaker: '1', reason: 'sentence' },
    ]);
    assert.equal(s.count, 2);
    assert.equal(s.longRatio, 0.5);
    assert.equal(s.shortRatio, 0.5);
    assert.deepEqual(s.reasons, { 'max-length': 1, sentence: 1 });
  });
});
