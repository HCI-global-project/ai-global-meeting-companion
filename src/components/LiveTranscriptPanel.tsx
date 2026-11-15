import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  FileAudio,
  Hand,
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
  onClearRecording: () => void;
  onAddTranscriptText: (recognizedText: string) => void;
  onSendChat: (text: string) => void;
}

const MEETING_LANGUAGE: LanguageCode = 'ko';

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
  onClearRecording,
  onAddTranscriptText,
  onSendChat,
}) => {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [emptySpeechNotice, setEmptySpeechNotice] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState('');
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

  // 회의 언어는 한국어. 언어를 알 수 없는 발화(직접 녹음·의견)도 한국어로 본다
  const needsTranslation = (entry: TranscriptEntry) =>
    (entry.originalLanguage === 'auto' ? MEETING_LANGUAGE : entry.originalLanguage) !==
    speechTargetLanguage;

  const speechTargetLangLabel =
    t.common.languages[speechTargetLanguage] ?? t.common.languages.en;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatDraft.trim();
    if (!text) return;
    onSendChat(text);
    setChatDraft('');
  };

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
          <div className="flex items-center gap-2 body-05 text-primary-500">
            <Loader2 className="size-icon-xs animate-spin shrink-0" />
            <span>{t.stream.states.connecting}</span>
          </div>
        );
      case 'listening':
        return (
          <div className="flex items-center gap-2 body-05 text-primary-500">
            <Radio className="size-icon-xs shrink-0" />
            <span>{t.stream.states.listening}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 body-04 text-red-500">
            <AlertCircle className="size-icon-xs shrink-0" />
            <span>{t.stream.states.error}</span>
          </div>
        );
      case 'disconnected':
      default:
        return (
          <div className="flex items-center gap-2 body-05 text-gray-500">
            <WifiOff className="size-icon-xs shrink-0" />
            <span>{t.stream.states.disconnected}</span>
          </div>
        );
    }
  };

  return (
    <section className="flex flex-col gap-3 h-full min-h-0">
      {/* Header Pill Bar */}
      <div className="shrink-0 bg-white border border-gray-100 rounded-4 px-5 sm:px-6 py-3 flex items-center justify-between gap-2.5 flex-wrap">
        <h2 className="heading-06 text-gray-700">
          {t.transcript.title}
        </h2>

        <div className="flex items-center gap-2 shrink-0">
          {/* Clearly Labeled Demo Stream Toggle */}
          {isDemoMode && isStreamActive ? (
            <button
              type="button"
              onClick={onStopStream}
              className="inline-flex items-center gap-1.5 body-05 text-gray-700 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-2 px-3 h-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Square className="size-3 fill-current" />
              <span>{t.stream.stopDemoButton}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartDemoStream}
              className="inline-flex items-center gap-1.5 body-05 text-gray-700 hover:text-primary-500 bg-gray-50 hover:bg-primary-50 border border-gray-200 rounded-2 px-3 h-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="size-3 fill-current" />
              <span>{t.stream.demoButton}</span>
            </button>
          )}
        </div>
      </div>

      {/* Transcript Container: Pinned Stream Status Bar + Internally Scrollable Transcript Feed */}
      <div className="bg-white border border-gray-100 rounded-4 flex-1 min-h-[260px] min-[720px]:min-h-0 flex flex-col overflow-hidden">
        {/* Stream Connection & Demo Mode Status Strip */}
        <div className="shrink-0 border-b border-gray-100 bg-gray-20 px-5 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          {renderConnectionStatus()}

          <span className="label-01 text-gray-600 truncate">
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
              className="rounded-3 border border-red-100 bg-red-50 px-4 py-3 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="size-icon-xs text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="body-02 text-red-600">
                    {t.stream.states.error}
                  </p>
                  <p className="body-04 text-red-700 mt-0.5">
                    {streamError.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClearStreamError}
                className="text-red-600 hover:text-red-800 p-1 rounded-2 cursor-pointer"
                aria-label={t.common.close}
              >
                <X className="size-icon-xs" />
              </button>
            </div>
          )}

          {/* Microphone Permission / Device Error State */}
          {localizedMicError && (
            <div
              role="alert"
              className="rounded-3 border border-red-100 bg-red-50 px-4 py-4 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="size-icon-xs text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="body-02 text-red-600">
                    {t.transcript.micUnavailableTitle}
                  </p>
                  <p className="body-04 text-red-700 mt-0.5">
                    {localizedMicError}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onStartRecording}
                className="body-05 text-red-600 hover:text-red-800 bg-white border border-red-100 rounded-2 px-2.5 py-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.common.tryAgain}
              </button>
            </div>
          )}

          {/* Requesting Permission Loading State */}
          {isRequesting && (
            <div className="rounded-3 border border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-2.5 body-04 text-gray-700">
              <Loader2 className="size-icon-xs text-primary-500 animate-spin shrink-0" />
              <span>{t.transcript.waitingPermission}</span>
            </div>
          )}

          {/* Active Local Recording Notice */}
          {isRecording && (
            <div className="rounded-3 border border-primary-200 bg-primary-50 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Mic className="size-icon-xs text-primary-500 shrink-0" />
                <span className="body-02 text-gray-800">
                  {t.transcript.recordingLocallyNotice(speakerName)}
                </span>
              </div>
              <span className="body-02 text-primary-500 tabular-nums">
                {formatDuration(durationSeconds)}
              </span>
            </div>
          )}

          {/* Local Recorded Audio Playback + Optional Post-Recording Fallback Transcription */}
          {recorderStatus === 'stopped' && audioUrl && (
            <div className="rounded-3 border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 body-02 text-gray-800">
                  <Volume2 className="size-icon-xs text-primary-500" />
                  <span>{t.transcript.recordedPlaybackTitle}</span>
                  <span className="text-gray-500 font-normal tabular-nums">
                    · {formatDuration(durationSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleTranscribeRecording()}
                    disabled={isTranscribing || !audioBlob}
                    className="inline-flex items-center gap-1.5 body-05 text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 rounded-2 px-3 h-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="size-icon-xs animate-spin" />
                        <span>{t.transcript.transcribing}</span>
                      </>
                    ) : (
                      <>
                        <FileAudio className="size-icon-xs" />
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
                    className="inline-flex items-center gap-1 label-01 text-gray-600 hover:text-gray-800 px-2 h-8 rounded-2 hover:bg-gray-100 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 className="size-icon-xs" />
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
                  className="rounded-2 border border-red-100 bg-red-50 px-4 py-2.5 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-icon-xs text-red-500 mt-0.5 shrink-0" />
                    <p className="body-04 text-red-700">
                      {transcribeError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleTranscribeRecording()}
                    disabled={isTranscribing}
                    className="body-05 text-red-600 hover:text-red-800 bg-white border border-red-100 rounded-2 px-2.5 py-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t.common.retry}
                  </button>
                </div>
              )}

              {emptySpeechNotice && (
                <div className="rounded-2 border border-gray-200 bg-white px-4 py-2.5 label-01 text-gray-600">
                  {emptySpeechNotice}
                </div>
              )}
            </div>
          )}

          {/* Transcript Feed: Finalized Segments + In-Progress Interim Segment */}
          {entries.length > 0 || interimSegment ? (
            <div className="flex flex-col gap-6">
              {entries.map((entry) => {
                if (entry.source === 'signal') {
                  return (
                    <div key={entry.id} className="self-center flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 body-05 text-primary-600">
                      <Hand className="size-3.5 shrink-0" />
                      <span>{t.quickActions.waitNotice}</span>
                      <span className="label-01 text-primary-400 tabular-nums">{entry.timestamp}</span>
                    </div>
                  );
                }

                const showTranslation = needsTranslation(entry);
                const translatedLine = entry.translations[speechTargetLanguage];

                return (
                  <article key={entry.id} className="flex flex-col items-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-1 body-02 text-gray-800 tabular-nums ${
                          entry.badgeVariant === 'lavender'
                            ? 'bg-primary-300'
                            : 'bg-gray-200'
                        }`}
                      >
                        <span>
                          {entry.isAnonymous
                            ? t.anonymousOpinion.anonymousSpeaker
                            : entry.speakerName}
                        </span>
                        <span>{entry.timestamp}</span>
                      </div>

                      {entry.source === 'demo' && (
                        <span className="label-02 text-gray-500">
                          {t.stream.demoBadge}
                        </span>
                      )}
                      {entry.source === 'chat' && (
                        <span className="label-02 text-gray-500">
                          {t.chat.badge}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 body-01 text-gray-800">
                      {entry.originalText}
                    </p>

                    {showTranslation &&
                      (translatedLine ? (
                        <p className="mt-0.5 body-03 text-gray-400">
                          {translatedLine}
                        </p>
                      ) : (
                        <p className="mt-0.5 body-04 text-gray-400">
                          {t.transcript.speechRecognizedPendingTranslation(
                            speechTargetLangLabel
                          )}
                        </p>
                      ))}
                  </article>
                );
              })}

              {/* Interim (In-Progress) Live Transcript Segment */}
              {interimSegment && (
                <article
                  aria-live="polite"
                  className="rounded-3 border border-dashed border-primary-200 bg-gray-20 px-4 py-4 flex flex-col items-start"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-1 body-02 text-gray-800 tabular-nums ${
                        interimSegment.badgeVariant === 'lavender'
                          ? 'bg-primary-300'
                          : 'bg-gray-200'
                      }`}
                    >
                      <span>{interimSegment.speakerName}</span>
                      <span>{interimSegment.timestamp}</span>
                    </div>

                    <span className="body-05 text-primary-500">
                      {t.stream.interimBadge}
                    </span>

                    {interimSegment.source === 'demo' && (
                      <span className="label-01 text-gray-500">
                        · {t.stream.demoBadge}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 body-01 text-gray-800">
                    {interimSegment.originalText}
                  </p>

                  {needsTranslation(interimSegment) && (
                    <p className="mt-0.5 body-03 text-gray-400">
                      {interimSegment.translations[speechTargetLanguage] ??
                        t.stream.awaitingTranslation}
                    </p>
                  )}
                </article>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
              <p className="body-01 text-gray-700">
                {t.transcript.emptyStateTitle}
              </p>
              <p className="mt-1.5 max-w-md body-04 text-gray-400">
                {t.transcript.emptyStateBody}
              </p>
            </div>
          )}
        </div>

        {/* 말로 끼어들기 어려울 때 채팅으로 — 발화와 같은 흐름에 들어간다 */}
        <form
          onSubmit={handleSendChat}
          className="shrink-0 flex gap-2 border-t border-gray-100 p-3"
        >
          <input
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value)}
            placeholder={t.chat.placeholder}
            maxLength={400}
            className="h-[45px] min-w-0 flex-1 rounded-2 border border-gray-100 bg-white px-4 body-03 text-gray-900 placeholder:text-gray-400 hover:bg-gray-50 focus:bg-white focus:border-primary-300 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!chatDraft.trim()}
            className="h-[45px] shrink-0 rounded-2 bg-gray-100 hover:bg-gray-200 px-4 title-03 text-gray-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.chat.send}
          </button>
        </form>
      </div>
    </section>
  );
};
