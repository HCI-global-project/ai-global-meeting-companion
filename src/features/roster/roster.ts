import type { PipelineParticipant } from '../pipeline/PipelineClient';
import type { TranscriptEntry } from '../../types/meeting';
import type { RosterEvent } from '../../types/streaming';

/** 회의 명단: 누가 들어와 있고, 화자 번호가 누구이며, 어느 기기가 녹음 중인지 */
export interface Roster {
  participants: PipelineParticipant[];
  /** speakerKey → participantId */
  speakers: Record<string, string>;
  recorderId: string | null;
}

export const EMPTY_ROSTER: Roster = { participants: [], speakers: {}, recorderId: null };

export function applyRosterEvent(roster: Roster, event: RosterEvent): Roster {
  switch (event.type) {
    case 'session.snapshot':
      return {
        participants: event.participants,
        speakers: { ...event.speakers },
        recorderId: event.recorderId,
      };
    case 'participant.joined': {
      const others = roster.participants.filter((p) => p.id !== event.participant.id);
      return { ...roster, participants: [...others, event.participant] };
    }
    case 'speaker.assigned':
      return { ...roster, speakers: assign(roster.speakers, event.speakerKey, event.participantId) };
    case 'recording.changed':
      return { ...roster, recorderId: event.recorderId };
    case 'recording.denied':
      return { ...roster, recorderId: event.recorderId };
  }
}

export function assign(
  speakers: Record<string, string>,
  speakerKey: string,
  participantId: string | null
): Record<string, string> {
  const next = { ...speakers };
  if (participantId) next[speakerKey] = participantId;
  else delete next[speakerKey];
  return next;
}

/** 지금 명단 기준으로 이 줄을 말한 참여자. 화자 지정이 바뀌면 지난 줄도 따라 바뀐다 */
export function speakerOf(entry: TranscriptEntry, roster: Roster): PipelineParticipant | undefined {
  const id = entry.speakerKey ? roster.speakers[entry.speakerKey] : entry.participantId;
  return id ? roster.participants.find((p) => p.id === id) : undefined;
}

export function isRosterEvent(event: { type: string }): event is RosterEvent {
  return (
    event.type === 'session.snapshot' ||
    event.type === 'participant.joined' ||
    event.type === 'speaker.assigned' ||
    event.type === 'recording.changed' ||
    event.type === 'recording.denied'
  );
}
