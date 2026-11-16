import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isKoreanTerminal } from './rules';

describe('isKoreanTerminal', () => {
  it('accepts sentence endings', () => {
    for (const word of ['했습니다', '있다', '한다', '같다', '됐다', '거다', '학생이다', '예쁘다',
      '좋아요', '했어요', '하죠', '어떨까', '할까', '볼까', '했으니까']) {
      assert.ok(isKoreanTerminal(word), word);
    }
  });

  // 실제 녹음에서 잘못 끊었던 자리: "아마 아까 / 말씀드렸던", "12월 아나바다 / 마켓", "그러다 / 보니까"
  it('rejects adverbs and nouns that only look like endings', () => {
    for (const word of ['아까', '아나바다', '그러다', '바다', '필요', '중요']) {
      assert.ok(!isKoreanTerminal(word), word);
    }
  });
});
