import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInterimSender } from './interimSender';

describe('createInterimSender', () => {
  it('sends at most once per interval, always the latest words', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const sent: string[] = [];
    const sender = createInterimSender((text) => sent.push(text), 700);

    sender.push('안녕');
    sender.push('안녕하세');
    sender.push('안녕하세요');
    assert.deepEqual(sent, ['안녕']); // 첫 글자는 바로 간다
    t.mock.timers.tick(700);
    assert.deepEqual(sent, ['안녕', '안녕하세요']); // 사이에 바뀐 것 중 최신만
    t.mock.timers.tick(700);
    assert.deepEqual(sent, ['안녕', '안녕하세요']); // 바뀐 게 없으면 안 보낸다
  });

  it('sends a clear right away and drops pending words', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const sent: string[] = [];
    const sender = createInterimSender((text) => sent.push(text), 700);

    sender.push('회의');
    sender.push('회의 시작');
    sender.push(''); // 줄이 확정됨
    t.mock.timers.tick(1_000);
    assert.deepEqual(sent, ['회의', '']);
    sender.push(''); // 이미 지웠으면 다시 보내지 않는다
    assert.deepEqual(sent, ['회의', '']);
  });

  it('passes the spoken language along', () => {
    const sent: [string, string | undefined][] = [];
    createInterimSender((text, language) => sent.push([text, language])).push('Hello', 'en');
    assert.deepEqual(sent, [['Hello', 'en']]);
  });
});
