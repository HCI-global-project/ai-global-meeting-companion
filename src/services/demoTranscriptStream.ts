import { DEMO_MEETING_SCRIPT } from '../data/demoMeetingScript';
import type { DemoUtterance } from '../data/demoMeetingScript';
import type { LanguageCode } from '../types/meeting';
import type {
  IncomingTranscriptEvent,
  TranscriptStreamTransport,
} from '../types/streaming';

// 회의 언어. 실제 서비스도 한국어 회의를 전사하고 참여자 언어로 번역한다.
const MEETING_LANGUAGE: LanguageCode = 'ko';

const STEP_MS = 650;
const CONTEXT_DELAY_MS = 900;
const SUGGESTION_DELAY_MS = 1600;
const NEXT_UTTERANCE_MS = 1800;

function formatCurrentTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// 말하는 중인 것처럼 어절 단위로 잘라 3~4단계로 늘려 보낸다
function buildSteps(text: string): string[] {
  const words = text.split(' ');
  const stepCount = Math.min(4, words.length);
  return Array.from({ length: stepCount }, (_, idx) =>
    words.slice(0, Math.ceil((words.length * (idx + 1)) / stepCount)).join(' ')
  );
}

function translationFor(script: DemoUtterance, target: LanguageCode): string | undefined {
  // 한국어 사용자는 원문을 그대로 읽으므로 번역이 없다
  return target === 'ko' ? undefined : script.translations[target];
}

/**
 * 백엔드 없이 UI를 확인하기 위한 데모 스트림.
 * 실제 백엔드가 보낼 이벤트(전사 interim/final, 맥락 갱신, 의견 추천)를 같은 형식으로 흉내 낸다.
 * 모든 이벤트는 source: 'demo'로 표시된다.
 */
export class DemoTranscriptStreamTransport implements TranscriptStreamTransport {
  private timers: number[] = [];
  private active = false;
  private utteranceIndex = 0;
  private getTargetLanguage: () => LanguageCode;

  constructor(getTargetLanguage: () => LanguageCode) {
    this.getTargetLanguage = getTargetLanguage;
  }

  connect(onEvent: (event: IncomingTranscriptEvent) => void): void {
    this.disconnect();
    this.active = true;
    this.utteranceIndex = 0;

    onEvent({ type: 'status', state: 'connecting' });
    this.schedule(() => {
      onEvent({ type: 'status', state: 'listening' });
      this.playNextUtterance(onEvent, 350);
    }, 650);
  }

  disconnect(): void {
    this.active = false;
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
  }

  private schedule(fn: () => void, delayMs: number): void {
    const id = window.setTimeout(() => {
      if (this.active) fn();
    }, delayMs);
    this.timers.push(id);
  }

  private playNextUtterance(
    onEvent: (event: IncomingTranscriptEvent) => void,
    initialDelayMs: number
  ): void {
    const script = DEMO_MEETING_SCRIPT[this.utteranceIndex];
    if (!script) {
      // 대본이 끝나면 스트림을 닫는다
      this.schedule(() => onEvent({ type: 'status', state: 'disconnected' }), initialDelayMs);
      return;
    }

    this.utteranceIndex += 1;
    const segmentId = `demo-seg-${Date.now()}-${this.utteranceIndex}`;
    const timestamp = formatCurrentTime();
    const steps = buildSteps(script.text);
    const base = {
      segmentId,
      speakerId: script.speakerId,
      speakerName: script.speakerName,
      timestamp,
      sourceLanguage: MEETING_LANGUAGE,
      badgeVariant: script.badgeVariant,
      source: 'demo' as const,
    };

    steps.forEach((partialText, stepIdx) => {
      this.schedule(() => {
        const target = this.getTargetLanguage();
        const isLast = stepIdx === steps.length - 1;
        const full = translationFor(script, target);
        onEvent({
          type: 'transcript.interim',
          ...base,
          text: partialText,
          targetLanguage: full ? target : undefined,
          // 번역은 원문보다 조금 늦게 따라오는 것처럼 보여 준다
          translatedText: full && stepIdx > 0 ? (isLast ? full : `${full.slice(0, Math.ceil((full.length * stepIdx) / steps.length))}...`) : undefined,
        });
      }, initialDelayMs + stepIdx * STEP_MS);
    });

    const finalDelay = initialDelayMs + steps.length * STEP_MS + 300;
    this.schedule(() => {
      const target = this.getTargetLanguage();
      onEvent({
        type: 'transcript.final',
        ...base,
        text: script.text,
        // 언어를 바꿔도 다시 받지 않도록 모든 참여자 언어 번역을 함께 보낸다
        translations: script.translations,
        targetLanguage: target === MEETING_LANGUAGE ? undefined : target,
      });

      if (script.context) {
        const context = script.context;
        this.schedule(
          () =>
            onEvent({
              type: 'context.updated',
              context: { ...context, updatedAt: new Date().toISOString() },
            }),
          CONTEXT_DELAY_MS
        );
      }

      if (script.outcome) {
        const outcome = script.outcome;
        this.schedule(
          () =>
            onEvent({
              type: 'outcome.updated',
              outcome: { ...outcome, updatedAt: new Date().toISOString() },
            }),
          CONTEXT_DELAY_MS + 300
        );
      }

      if (script.suggestion) {
        const { gloss, ...sentences } = script.suggestion;
        this.schedule(
          () =>
            onEvent({
              type: 'opinion.suggested',
              suggestion: {
                id: `demo-sug-${segmentId}`,
                segmentId,
                targetText: script.text,
                source: 'auto',
                ...sentences,
                gloss,
                createdAt: new Date().toISOString(),
              },
            }),
          SUGGESTION_DELAY_MS
        );
      }

      this.playNextUtterance(onEvent, NEXT_UTTERANCE_MS + (script.suggestion ? 1200 : 0));
    }, finalDelay);
  }
}
