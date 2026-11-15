import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  FileAudio,
  Loader2,
  Mic,
  Play,
  Radio,
  Square,
  Trash2,
  Volume2,
  WifiOff,
  X,
} from 'lucide-react';
import type { RecorderError, RecorderStatus } from '../hooks/useMicrophoneRecorder';
import type { StreamErrorInfo } from '../hooks/useTranscriptStream';
import { useI18n } from '../i18n/I18nContext';
import {
  transcribeRecordedAudio,
  TranscriptionRequestError,
} from '../services/transcriptionApi';
import type { LanguageCode, TranscriptEntry } from '../types/meeting';
import type { StreamConnectionState } from '../types/streaming';

interface LiveTranscriptPanelProps {
  entries: TranscriptEntry[];
  interimSegment: TranscriptEntry | null;
  connectionState: StreamConnectionState;
  streamError: StreamErrorInfo | null;
  isDemoMode: boolean;
  speechTargetLanguage: LanguageCode;
  speakerName: string;
  recorderStatus: RecorderStatus;
  recorderError: RecorderError | null;
  audioUrl: string | null;
  audioBlob: Blob | null;
  mimeType: string | null;
  durationSeconds: number;
  onStartDemoStream: () => void;
  onStopStream: () => void;
  onClearStreamError: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearRecording: () => void;
  onAddTranscriptText: (recognizedText: string) => void;
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const LiveTranscriptPanel: React.FC<LiveTranscriptPanelProps> = ({
  entries,
  interimSegment,
  connectionState,
  streamError,
  isDemoMode,
  speechTargetLanguage,
  speakerName,
  recorderStatus,
  recorderError,
  audioUrl,
  audioBlob,
  mimeType,
  durationSeconds,
  onStartDemoStream,
  onStopStream,
  onClearStreamError,
  onStartRecording,
  onStopRecording,
  onClearRecording,
  onAddTranscriptText,
}) => {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [emptySpeechNotice, setEmptySpeechNotice] = useState<string | null>(null);
  const [transcribedAudioUrl, setTranscribedAudioUrl] = useState<string | null>(
    null
  );

  // Auto-scroll ONLY inside the transcript panel whenever finalized or interim segments update
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [
    entries.length,
    interimSegment?.originalText,
    interimSegment?.translations[speechTargetLanguage],
  ]);

  useEffect(() => {
    if (recorderStatus === 'recording' || recorderStatus === 'idle') {
      setTranscribeError(null);
      setEmptySpeechNotice(null);
    }
  }, [recorderStatus]);

  const isRecording = recorderStatus === 'recording';
  const isRequesting = recorderStatus === 'requesting';
  const isStreamActive =
    connectionState === 'connecting' || connectionState === 'listening';

  const speechTargetLangLabel =
    t.common.languages[speechTargetLanguage] ?? t.common.languages.en;

  const handleTranscribeRecording = async () => {
    if (!audioBlob || isTranscribing) return;

    setIsTranscribing(true);
    setTranscribeError(null);
    setEmptySpeechNotice(null);

    try {
      const result = await transcribeRecordedAudio({
        audioBlob,
        mimeType,
        languageHint: speechTargetLangLabel,
      });

      if (result.emptySpeech || !result.text.trim()) {
        setEmptySpeechNotice(t.transcript.emptySpeechNotice);
        return;
      }

      onAddTranscriptText(result.text.trim());
      setTranscribedAudioUrl(audioUrl);
    } catch (err) {
      if (err instanceof TranscriptionRequestError) {
        setTranscribeError(err.message);
      } else {
        setTranscribeError(
          err instanceof Error ? err.message : t.transcript.unableToTranscribe
        );
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const hasTranscribedCurrentClip =
    Boolean(audioUrl) && transcribedAudioUrl === audioUrl;

  const localizedMicError = recorderError
    ? t.transcript.micErrors[recorderError.code] ?? recorderError.message
    : null;

  const renderConnectionStatus = () => {
    switch (connectionState) {
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#5B49EA]">
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>{t.stream.states.connecting}</span>
          </div>
        );
      case 'listening':
        return (
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#5B49EA]">
            <Radio className="w-3.5 h-3.5 shrink-0" />
            <span>{t.stream.states.listening}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#B43C54]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{t.stream.states.error}</span>
          </div>
        );
      case 'disconnected':
      default:
        return (
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#8E8BA3]">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>{t.stream.states.disconnected}</span>
          </div>
        );
    }
  };

  return (
    <section className="flex flex-col gap-3.5 h-full min-h-0">
      {/* Header Pill Bar */}
      <div className="shrink-0 bg-white border border-[#DFDDE9] rounded-[18px] px-5 sm:px-6 py-3 flex items-center justify-between gap-2.5 flex-wrap">
        <h2 className="text-[17px] lg:text-[19px] font-medium text-[#5A5770] tracking-[-0.01em]">
          {t.transcript.title}
        </h2>

        <div className="flex items-center gap-2 shrink-0">
          {isRecording && (
            <span className="text-[13px] font-medium text-[#5B49EA] tabular-nums">
              {formatDuration(durationSeconds)}
            </span>
          )}

          {/* Clearly Labeled Demo Stream Toggle */}
          {isDemoMode && isStreamActive ? (
            <button
              type="button"
              onClick={onStopStream}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#5A5770] hover:text-[#3E3B52] bg-[#ECEAF4] hover:bg-[#E0DDEC] rounded-xl px-3 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>{t.stream.stopDemoButton}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartDemoStream}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#5A5770] hover:text-[#5B49EA] bg-[#F7F6FC] hover:bg-[#F2F0FD] border border-[#DFDDE9] rounded-xl px-3 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{t.stream.demoButton}</span>
            </button>
          )}

          {/* Existing MediaRecorder Microphone Controls */}
          {isRecording ? (
            <button
              type="button"
              onClick={onStopRecording}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white bg-[#5B49EA] hover:bg-[#4B3AD8] rounded-xl px-3.5 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{t.transcript.stopRecording}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartRecording}
              disabled={isRequesting || isTranscribing}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5B49EA] hover:text-[#4735D4] bg-[#F2F0FD] hover:bg-[#E7E3FC] disabled:opacity-60 rounded-xl px-3.5 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.transcript.requestingMic}</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>{t.transcript.startRecording}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Transcript Container: Pinned Stream Status Bar + Internally Scrollable Transcript Feed */}
      <div className="bg-white border border-[#DFDDE9] rounded-[18px] flex-1 min-h-[260px] min-[720px]:min-h-0 flex flex-col overflow-hidden">
        {/* Stream Connection & Demo Mode Status Strip */}
        <div className="shrink-0 border-b border-[#EAE8F3] bg-[#FAFAFE] px-5 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          {renderConnectionStatus()}

          <span className="text-[12px] text-[#7D7994] truncate">
            {isDemoMode && isStreamActive
              ? t.stream.demoBanner
              : connectionState === 'listening'
                ? t.stream.liveStreamBanner
                : t.stream.disconnectedHint}
          </span>
        </div>

        {/* Scrollable Transcript Feed */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto loop-scroll px-5 sm:px-6 py-5 flex flex-col gap-5"
        >
          {/* Stream Connection Error State */}
          {streamError && (
            <div
              role="alert"
              className="rounded-2xl border border-[#E7C6CC] bg-[#FDF6F7] px-4 py-3 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#B43C54] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-[#8E2B40]">
                    {t.stream.states.error}
                  </p>
                  <p className="text-[12.5px] text-[#7A3544] mt-0.5 leading-relaxed">
                    {streamError.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClearStreamError}
                className="text-[#8E2B40] hover:text-[#6B1E2F] p-1 rounded-lg cursor-pointer"
                aria-label={t.common.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Microphone Permission / Device Error State */}
          {localizedMicError && (
            <div
              role="alert"
              className="rounded-2xl border border-[#E7C6CC] bg-[#FDF6F7] px-4 py-3.5 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#B43C54] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-[#8E2B40]">
                    {t.transcript.micUnavailableTitle}
                  </p>
                  <p className="text-[13px] text-[#7A3544] mt-0.5 leading-relaxed">
                    {localizedMicError}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onStartRecording}
                className="text-[12px] font-medium text-[#8E2B40] hover:text-[#6B1E2F] bg-white border border-[#E7C6CC] rounded-lg px-2.5 py-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.common.tryAgain}
              </button>
            </div>
          )}

          {/* Requesting Permission Loading State */}
          {isRequesting && (
            <div className="rounded-2xl border border-[#DFDDE9] bg-[#F7F6FC] px-4 py-3 flex items-center gap-2.5 text-[13px] text-[#5A5770]">
              <Loader2 className="w-4 h-4 text-[#5B49EA] animate-spin shrink-0" />
              <span>{t.transcript.waitingPermission}</span>
            </div>
          )}

          {/* Active Local Recording Notice */}
          {isRecording && (
            <div className="rounded-2xl border border-[#CFC9F5] bg-[#F5F3FE] px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-[#5B49EA] shrink-0" />
                <span className="text-[13px] font-medium text-[#4C4962]">
                  {t.transcript.recordingLocallyNotice(speakerName)}
                </span>
              </div>
              <span className="text-[13px] font-medium text-[#5B49EA] tabular-nums">
                {formatDuration(durationSeconds)}
              </span>
            </div>
          )}

          {/* Local Recorded Audio Playback + Optional Post-Recording Fallback Transcription */}
          {recorderStatus === 'stopped' && audioUrl && (
            <div className="rounded-2xl border border-[#DFDDE9] bg-[#F7F6FC] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#4C4962]">
                  <Volume2 className="w-4 h-4 text-[#5B49EA]" />
                  <span>{t.transcript.recordedPlaybackTitle}</span>
                  <span className="text-[#8E8BA3] font-normal tabular-nums">
                    · {formatDuration(durationSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleTranscribeRecording()}
                    disabled={isTranscribing || !audioBlob}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-white bg-[#5B49EA] hover:bg-[#4B3AD8] disabled:opacity-65 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.transcript.transcribing}</span>
                      </>
                    ) : (
                      <>
                        <FileAudio className="w-3.5 h-3.5" />
                        <span>
                          {hasTranscribedCurrentClip
                            ? t.transcript.transcribeAgain
                            : t.transcript.transcribeRecording}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTranscribeError(null);
                      setEmptySpeechNotice(null);
                      setTranscribedAudioUrl(null);
                      onClearRecording();
                    }}
                    disabled={isTranscribing}
                    className="inline-flex items-center gap-1 text-[12px] text-[#7D7994] hover:text-[#4C4962] px-2 py-1.5 rounded-lg hover:bg-[#ECEAF4] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.common.clear}</span>
                  </button>
                </div>
              </div>

              <audio
                controls
                src={audioUrl}
                className="w-full h-10"
                aria-label={t.transcript.recordedPlaybackTitle}
              />

              {transcribeError && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#E7C6CC] bg-[#FDF6F7] px-3.5 py-2.5 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#B43C54] mt-0.5 shrink-0" />
                    <p className="text-[12.5px] leading-relaxed text-[#7A3544]">
                      {transcribeError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleTranscribeRecording()}
                    disabled={isTranscribing}
                    className="text-[12px] font-medium text-[#8E2B40] hover:text-[#6B1E2F] bg-white border border-[#E7C6CC] rounded-lg px-2.5 py-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t.common.retry}
                  </button>
                </div>
              )}

              {emptySpeechNotice && (
                <div className="rounded-xl border border-[#DFDDE9] bg-white px-3.5 py-2.5 text-[12.5px] text-[#6B6780]">
                  {emptySpeechNotice}
                </div>
              )}
            </div>
          )}

          {/* Transcript Feed: Finalized Segments + In-Progress Interim Segment */}
          {entries.length > 0 || interimSegment ? (
            <div className="flex flex-col gap-6">
              {entries.map((entry) => {
                const translatedLine = entry.translations[speechTargetLanguage];

                return (
                  <article key={entry.id} className="flex flex-col items-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[13px] font-medium text-[#4C4962] tabular-nums ${
                          entry.badgeVariant === 'lavender'
                            ? 'bg-[#BFB8F7]'
                            : 'bg-[#E3E1EC]'
                        }`}
                      >
                        <span>
                          {entry.isAnonymous
                            ? t.shareOpinion.anonymousSpeaker
                            : entry.speakerName}
                        </span>
                        <span>{entry.timestamp}</span>
                      </div>

                      {entry.source === 'demo' && (
                        <span className="text-[11.5px] font-medium text-[#8E8BA3]">
                          {t.stream.demoBadge}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-[16px] leading-[1.55] text-[#3E3B52] font-normal">
                      {entry.originalText}
                    </p>

                    {translatedLine ? (
                      <p className="mt-0.5 text-[15px] leading-[1.55] text-[#9A97AD] font-normal">
                        {translatedLine}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[13.5px] leading-[1.55] text-[#9A97AD] font-normal">
                        {t.transcript.speechRecognizedPendingTranslation(
                          speechTargetLangLabel
                        )}
                      </p>
                    )}
                  </article>
                );
              })}

              {/* Interim (In-Progress) Live Transcript Segment */}
              {interimSegment && (
                <article
                  aria-live="polite"
                  className="rounded-2xl border border-dashed border-[#C7C0F7] bg-[#FAF9FE] px-4 py-3.5 flex flex-col items-start"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[13px] font-medium text-[#4C4962] tabular-nums ${
                        interimSegment.badgeVariant === 'lavender'
                          ? 'bg-[#BFB8F7]'
                          : 'bg-[#E3E1EC]'
                      }`}
                    >
                      <span>{interimSegment.speakerName}</span>
                      <span>{interimSegment.timestamp}</span>
                    </div>

                    <span className="text-[12px] font-medium text-[#5B49EA]">
                      {t.stream.interimBadge}
                    </span>

                    {interimSegment.source === 'demo' && (
                      <span className="text-[11.5px] text-[#8E8BA3]">
                        · {t.stream.demoBadge}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-[16px] leading-[1.55] text-[#3E3B52] font-normal">
                    {interimSegment.originalText}
                  </p>

                  <p className="mt-0.5 text-[15px] leading-[1.55] text-[#9A97AD] font-normal">
                    {interimSegment.translations[speechTargetLanguage] ??
                      t.stream.awaitingTranslation}
                  </p>
                </article>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
              <p className="text-[15px] font-medium text-[#5A5770]">
                {t.transcript.emptyStateTitle}
              </p>
              <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-[#9A97AD]">
                {t.transcript.emptyStateBody}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
