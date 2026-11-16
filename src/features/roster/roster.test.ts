import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyRosterEvent, EMPTY_ROSTER, speakerOf } from './roster';
import type { TranscriptEntry } from '../../types/meeting';

const minji = { id: 'p-ko', name: '민지', role: 'PM', language: 'ko' as const };
const joe = { id: 'p-en', name: 'Joe', role: 'Dev', language: 'en' as const };

function line(overrides: Partial<TranscriptEntry>): TranscriptEntry {
  return {
    id: '1',
    speakerId: 'speaker-r1:2',
    speakerName: '화자 2',
    timestamp: '10:00',
    originalLanguage: 'ko',
    originalText: '배포는 금요일에 해요',
    translations: {},
    badgeVariant: 'neutral',
    ...overrides,
  };
}

describe('roster', () => {
  it('names every line of a speaker once assigned, and forgets on clear', () => {
    let roster = applyRosterEvent(EMPTY_ROSTER, {
      type: 'session.snapshot',
      participants: [minji],
      speakers: {},
      recorderId: 'p-ko',
    });
    roster = applyRosterEvent(roster, { type: 'participant.joined', participant: joe });
    const spoken = line({ speakerKey: 'r1:2', speakerNumber: '2' });
    assert.equal(speakerOf(spoken, roster), undefined);

    roster = applyRosterEvent(roster, { type: 'speaker.assigned', speakerKey: 'r1:2', participantId: 'p-en' });
    assert.equal(speakerOf(spoken, roster)?.name, 'Joe');

    roster = applyRosterEvent(roster, { type: 'speaker.assigned', speakerKey: 'r1:2', participantId: null });
    assert.equal(speakerOf(spoken, roster), undefined);
  });

  it('uses the sender for chat lines and replaces a rejoining participant', () => {
    let roster = applyRosterEvent(EMPTY_ROSTER, { type: 'participant.joined', participant: minji });
    roster = applyRosterEvent(roster, { type: 'participant.joined', participant: { ...minji, name: '민지(PM)' } });
    assert.equal(roster.participants.length, 1);
    const chat = line({ source: 'chat', participantId: 'p-ko', speakerKey: null });
    assert.equal(speakerOf(chat, roster)?.name, '민지(PM)');
  });
});
