import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildSonioxConfig } from './sonioxConfig';

describe('buildSonioxConfig', () => {
  it('leaves out languages Soniox rejects (Burmese)', () => {
    const config = buildSonioxConfig({ apiKey: 'k', languageHints: ['ko', 'en', 'my', 'ko', 'ja'] });
    assert.deepEqual(config.language_hints, ['ko', 'en', 'ja']);
  });
});
