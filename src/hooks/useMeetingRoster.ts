import { useCallback, useState } from 'react';
import { applyRosterEvent, assign, EMPTY_ROSTER, type Roster } from '../features/roster/roster';
import type { RosterEvent } from '../types/streaming';

/** 서버가 보내는 명단 이벤트를 모은다. 화자 지정은 서버 확인 전에 내 화면에 먼저 반영한다 */
export function useMeetingRoster() {
  const [roster, setRoster] = useState<Roster>(EMPTY_ROSTER);

  const handleRosterEvent = useCallback((event: RosterEvent) => {
    setRoster((prev) => applyRosterEvent(prev, event));
  }, []);

  const assignLocally = useCallback((speakerKey: string, participantId: string | null) => {
    setRoster((prev) => ({ ...prev, speakers: assign(prev.speakers, speakerKey, participantId) }));
  }, []);

  const reset = useCallback(() => setRoster(EMPTY_ROSTER), []);

  return { roster, handleRosterEvent, assignLocally, reset };
}
