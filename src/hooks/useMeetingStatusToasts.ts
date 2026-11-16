import { useEffect } from 'react';
import type { TranscriberFailure } from '../features/stt/soniox/SonioxTranscriber';
import { useI18n } from '../i18n/I18nContext';
import type { LiveState } from './useLiveTranscription';
import type { PipelineStatus } from './useMeetingConnection';
import type { StreamErrorInfo } from './useTranscriptStream';
import type { Toast } from './useToasts';

export const SERVER_TOAST = 'server';
export const MIC_TOAST = 'mic';
export const STREAM_TOAST = 'stream';
const LISTENING_TOAST_MS = 2000;

interface StatusSources {
  pipelineStatus: PipelineStatus;
  liveState: LiveState;
  liveFailure: TranscriberFailure | null;
  streamError: StreamErrorInfo | null;
  show: (toast: Toast) => void;
  dismiss: (id: string) => void;
}

/**
 * 서버 연결·녹음·스트림 상태를 토스트로 옮긴다. 출처마다 id 하나를 써서
 * 연결 중 → 듣는 중 → 오류가 한 자리에서 바뀌게 한다.
 */
export function useMeetingStatusToasts({
  pipelineStatus,
  liveState,
  liveFailure,
  streamError,
  show,
  dismiss,
}: StatusSources) {
  const { t } = useI18n();

  useEffect(() => {
    if (pipelineStatus === 'connecting') {
      show({ id: SERVER_TOAST, tone: 'progress', message: t.live.connectingServer });
    } else if (pipelineStatus === 'unavailable') {
      show({ id: SERVER_TOAST, tone: 'error', message: t.live.serverUnavailable });
    } else if (pipelineStatus === 'denied') {
      show({ id: SERVER_TOAST, tone: 'error', message: t.live.accessDenied });
    } else {
      dismiss(SERVER_TOAST);
    }
  }, [pipelineStatus, show, dismiss, t]);

  useEffect(() => {
    switch (liveState) {
      case 'requesting':
      case 'connecting':
        show({ id: MIC_TOAST, tone: 'progress', message: t.transcript.waitingPermission });
        break;
      case 'listening':
        show({
          id: MIC_TOAST,
          tone: 'info',
          message: t.stream.states.listening,
          durationMs: LISTENING_TOAST_MS,
        });
        break;
      case 'error':
        show({
          id: MIC_TOAST,
          tone: 'error',
          message: liveFailure?.micCode
            ? t.transcript.micErrors[liveFailure.micCode]
            : liveFailure?.message || t.transcript.micErrors.unknown,
        });
        break;
      case 'idle':
        dismiss(MIC_TOAST);
        break;
    }
  }, [liveState, liveFailure, show, dismiss, t]);

  useEffect(() => {
    if (streamError) show({ id: STREAM_TOAST, tone: 'error', message: streamError.message });
    else dismiss(STREAM_TOAST);
  }, [streamError, show, dismiss]);
}
