import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { currentAccessCode, readInvite } from './inviteLink';

describe('readInvite', () => {
  it('reads the code and room from an invite link and remembers the code', () => {
    assert.deepEqual(readInvite('?code=loop-2611&room=team-a'), { code: 'loop-2611', room: 'team-a' });
    // 링크 없이 다시 들어와도 기억한 코드를 쓴다
    assert.deepEqual(readInvite(''), { code: null, room: null });
    assert.equal(currentAccessCode(), 'loop-2611');
  });

  it('ignores empty values', () => {
    assert.deepEqual(readInvite('?code=%20&room='), { code: null, room: null });
  });
});
