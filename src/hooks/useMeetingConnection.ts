import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPipelineClient } from '../features/pipeline/createPipelineClient';
import type { PipelineConnection } from '../features/pipeline/PipelineClient';
import type { RoomSession } from '../types/meeting';
import type { IncomingTranscriptEvent } from '../types/streaming';

export type PipelineStatus = 'connecting' | 'open' | 'unavailable';

const RETRY_BASE_MS = 1_500;
const RETRY_MAX_MS = 10_000;

interface Options {
  session: RoomSession;
  onEvent: (event: IncomingTranscriptEvent) => void;
}

/**
 * 회의 화면이 떠 있는 동안 회의 서버(FastAPI)에 붙어 있는다.
 * 서버가 늦게 켜지거나 잠깐 끊겨도 다시 붙는다. 다시 붙으면 서버가 스냅샷을 보내 명단을 맞춘다.
 */
export function useMeetingConnection({ session, onEvent }: Options) {
  const client = useMemo(() => createPipelineClient(), []);
  const [status, setStatus] = useState<PipelineStatus>('connecting');
  const connectionRef = useRef<PipelineConnection | null>(null);
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  const { roomCode, participantId, userName, userRole, speechTargetLanguage } = session;

  useEffect(() => {
    let disposed = false;
    let failures = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const open = () => {
      const connection = client.connect(
        roomCode,
        { id: participantId, name: userName, role: userRole, language: speechTargetLanguage },
        {
          onOpen: () => {
            failures = 0;
            setStatus('open');
          },
          onEvent: (event) => {
            // 소켓 오류는 바로 뒤따르는 onClose 에서 상태로 다룬다
            if (event.type === 'error' && event.code === 'WEBSOCKET_ERROR') return;
            onEventRef.current(event);
          },
          onClose: () => {
            if (disposed) return;
            connectionRef.current = null;
            failures += 1;
            setStatus('unavailable');
            retryTimer = setTimeout(open, Math.min(RETRY_MAX_MS, RETRY_BASE_MS * failures));
          },
        }
      );
      connectionRef.current = connection;
    };

    open();
    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      connectionRef.current?.close();
      connectionRef.current = null;
      // 방·참여자 정보가 바뀌어 다시 붙을 때 이전 연결 상태가 남지 않게 한다
      setStatus('connecting');
    };
  }, [client, roomCode, participantId, userName, userRole, speechTargetLanguage]);

  const getConnection = useCallback(() => connectionRef.current, []);

  return { client, status, getConnection };
}
