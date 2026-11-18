import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { localizeItem } from './localizeOutcome';

const item = { id: 'd1', text: '발표는 금요일', translations: { en: 'Presentation on Friday' } };

describe('localizeItem', () => {
  it('shows the translation with the original underneath', () => {
    assert.deepEqual(localizeItem(item, 'ko', 'en'), { text: 'Presentation on Friday', original: '발표는 금요일' });
  });

  it('shows the original when it is already my language', () => {
    assert.deepEqual(localizeItem(item, undefined, 'ko'), { text: '발표는 금요일' });
  });

  it('falls back to the original while the translation is missing', () => {
    assert.deepEqual(localizeItem(item, 'ko', 'ja'), { text: '발표는 금요일' });
  });
});
