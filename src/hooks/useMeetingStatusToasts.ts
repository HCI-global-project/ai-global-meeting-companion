import { useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { StreamConnectionState } from '../types/streaming';
import type { RecorderError, RecorderStatus } from './useMicrophoneRecorder';
import type { StreamErrorInfo } from './useTranscriptStream';
import type { Toast } from './useToasts';

export const CONNECTION_TOAST = 'connection';
export const MIC_TOAST = 'mic';
const LISTENING_TOAST_MS = 2000;

interface StatusSources {
  connectionState: StreamConnectionState;
  streamError: StreamErrorInfo | null;
  recorderStatus: RecorderStatus;
  recorderError: RecorderError | null;
  show: (toast: Toast) => void;
  dismiss: (id: string) => void;
}

/**
 * 연결·마이크 상태를 토스트로 옮긴다. 상태마다 같은 id 를 써서
 * 연결 중 → 듣는 중 → 오류가 한 자리에서 바뀌게 한다.
 */
export function useMeetingStatusToasts({
  connectionState,
  streamError,
  recorderStatus,
  recorderError,
  show,
  dismiss,
}: StatusSources) {
  const { t } = useI18n();

  useEffect(() => {
    if (streamError) {
      show({ id: CONNECTION_TOAST, tone: 'error', message: streamError.message });
      return;
    }
    switch (connectionState) {
      case 'connecting':
        show({ id: CONNECTION_TOAST, tone: 'progress', message: t.stream.states.connecting });
        break;
      case 'listening':
        show({
          id: CONNECTION_TOAST,
          tone: 'info',
          message: t.stream.states.listening,
          durationMs: LISTENING_TOAST_MS,
        });
        break;
      case 'disconnected':
        dismiss(CONNECTION_TOAST);
        break;
    }
  }, [connectionState, streamError, show, dismiss, t]);

  useEffect(() => {
    if (recorderError) {
      show({
        id: MIC_TOAST,
        tone: 'error',
        message: t.transcript.micErrors[recorderError.code] ?? recorderError.message,
      });
    } else if (recorderStatus === 'requesting') {
      show({ id: MIC_TOAST, tone: 'progress', message: t.transcript.waitingPermission });
    } else {
      dismiss(MIC_TOAST);
    }
  }, [recorderStatus, recorderError, show, dismiss, t]);
}
