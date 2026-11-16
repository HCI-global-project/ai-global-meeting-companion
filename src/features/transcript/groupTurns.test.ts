import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TranscriptEntry } from '../../types/meeting';
import { groupTurns } from './groupTurns';

const T0 = Date.parse('2026-11-17T10:00:00Z');
const at = (seconds: number) => new Date(T0 + seconds * 1000).toISOString();

function line(id: string, text: string, overrides: Partial<TranscriptEntry> = {}): TranscriptEntry {
  return {
    id,
    speakerId: 'r:1',
    speakerName: '화자 1',
    timestamp: '10:00',
    originalLanguage: 'en',
    originalText: text,
    translations: {},
    badgeVariant: 'neutral',
    source: 'stream',
    speakerKey: 'r:1',
    createdAt: at(0),
    ...overrides,
  };
}

const ids = (turns: ReturnType<typeof groupTurns>) => turns.map((t) => t.entries.map((e) => e.id));

describe('groupTurns', () => {
  it('keeps one speaker talking on in one card', () => {
    const turns = groupTurns(
      [
        line('1', 'So I think we should cut the onboarding,', { createdAt: at(0) }),
        line('2', 'and focus on the core flow first.', { createdAt: at(9) }),
      ],
      null
    );
    assert.deepEqual(ids(turns), [['1', '2']]);
  });

  it('starts a new card when the speaker changes', () => {
    const turns = groupTurns([line('1', 'Hello'), line('2', 'Hi', { speakerKey: 'r:2' }), line('3', 'Again')], null);
    assert.deepEqual(ids(turns), [['1'], ['2'], ['3']]);
  });

  it('starts a new card after a long pause or when the card is full', () => {
    const paused = groupTurns([line('1', 'Before', { createdAt: at(0) }), line('2', 'After', { createdAt: at(30) })], null);
    assert.deepEqual(ids(paused), [['1'], ['2']]);

    const long = 'x'.repeat(200);
    const full = groupTurns([line('1', long), line('2', long)], null);
    assert.deepEqual(ids(full), [['1'], ['2']]);
  });

  it('never merges chat or anonymous opinions', () => {
    const turns = groupTurns(
      [line('1', 'a', { source: 'chat' }), line('2', 'b', { source: 'chat' }), line('3', 'c')],
      null
    );
    assert.deepEqual(ids(turns), [['1'], ['2'], ['3']]);
  });

  it('puts in-progress words at the end of the card being spoken', () => {
    const interim = line('live', 'if we have time', { status: 'interim', speakerKey: null, createdAt: undefined });
    const turns = groupTurns([line('1', 'Cut the onboarding,', { createdAt: at(0) })], interim, undefined, T0 + 3_000);
    assert.equal(turns.length, 1);
    assert.equal(turns[0].interim?.originalText, 'if we have time');
  });

  it('gives in-progress words their own card when nothing can continue', () => {
    const interim = line('live', 'new topic', { status: 'interim', speakerKey: null, createdAt: undefined });
    // 마지막 줄이 오래전이다
    const stale = groupTurns([line('1', 'Earlier', { createdAt: at(0) })], interim, undefined, T0 + 60_000);
    assert.deepEqual(ids(stale), [['1'], []]);
    assert.equal(stale[1].interim?.originalText, 'new topic');
    // 확정된 줄이 하나도 없다
    assert.deepEqual(ids(groupTurns([], interim)), [[]]);
  });
});
