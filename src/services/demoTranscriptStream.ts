import type { LanguageCode } from '../types/meeting';
import type {
  IncomingTranscriptEvent,
  TranscriptStreamTransport,
} from '../types/streaming';

interface DemoUtteranceScript {
  speakerId: string;
  speakerName: string;
  sourceLanguage: LanguageCode;
  badgeVariant: 'neutral' | 'lavender';
  steps: string[];
  translations: Record<LanguageCode, string>;
}

const DEMO_SCRIPT: DemoUtteranceScript[] = [
  {
    speakerId: 'p-joe',
    speakerName: 'Joe',
    sourceLanguage: 'en',
    badgeVariant: 'neutral',
    steps: [
      'Today, we will',
      'Today, we will discuss the',
      'Today, we will discuss the project schedule',
      'Today, we will discuss the project schedule during the meeting.',
    ],
    translations: {
      ko: '오늘 회의에서는 프로젝트 일정에 대해 논의하겠습니다.',
      en: 'Today, we will discuss the project schedule during the meeting.',
      ja: '本日の会議では、プロジェクトのスケジュールについて話し合います。',
      my: 'ယနေ့ အစည်းအဝေးတွင် ပရောဂျက်အချိန်ဇယားအကြောင်း ဆွေးနွေးပါမည်။',
      ru: 'Сегодня на встрече мы обсудим график проекта.',
      es: 'Hoy discutiremos el calendario del proyecto durante la reunión.',
    },
  },
  {
    speakerId: 'p-anna',
    speakerName: 'Anna',
    sourceLanguage: 'ru',
    badgeVariant: 'lavender',
    steps: [
      'Как насчет',
      'Как насчет пятницы?',
    ],
    translations: {
      ko: '금요일은 어때요?',
      en: 'How about Friday?',
      ja: '金曜日はどうですか？',
      my: 'သောကြာနေ့ဆိုရင် ဘယ်လိုလဲ။',
      ru: 'Как насчет пятницы?',
      es: '¿Qué tal el viernes?',
    },
  },
  {
    speakerId: 'p-minji',
    speakerName: 'Minji',
    sourceLanguage: 'ko',
    badgeVariant: 'neutral',
    steps: [
      '금요일 오후',
      '금요일 오후 2시까지',
      '금요일 오후 2시까지 프로토타입을 공유할게요.',
    ],
    translations: {
      ko: '금요일 오후 2시까지 프로토타입을 공유할게요.',
      en: 'I will share the prototype by 2 PM on Friday.',
      ja: '金曜日の午後2時までにプロトタイプを共有します。',
      my: 'သောကြာနေ့ နေ့လယ် ၂ နာရီမတိုင်မီ ပရိုတိုတိုက်ကို မျှဝေပေးပါမည်။',
      ru: 'Я поделюсь прототипом к 14:00 в пятницу.',
      es: 'Compartiré el prototipo el viernes a las 14:00.',
    },
  },
  {
    speakerId: 'p-kenji',
    speakerName: 'Kenji',
    sourceLanguage: 'ja',
    badgeVariant: 'lavender',
    steps: [
      'ユーザーテストの',
      'ユーザーテストの結果も',
      'ユーザーテストの結果も一緒に確認しましょう。',
    ],
    translations: {
      ko: '사용자 테스트 결과도 함께 확인합시다.',
      en: 'Let us also review the user test results together.',
      ja: 'ユーザーテストの結果も一緒に確認しましょう。',
      my: 'အသုံးပြုသူ စမ်းသပ်မှုရလဒ်များကိုလည်း အတူတကွ စစ်ဆေးကြပါစို့။',
      ru: 'Давайте также вместе проверим результаты пользовательского тестирования.',
      es: 'Revisemos también juntos los resultados de las pruebas de usuario.',
    },
  },
  {
    speakerId: 'p-su',
    speakerName: 'Su',
    sourceLanguage: 'my',
    badgeVariant: 'neutral',
    steps: [
      'မြန်မာဘာသာဖြင့်',
      'မြန်မာဘာသာဖြင့် ပြောဆိုမှုကိုလည်း',
      'မြန်မာဘာသာဖြင့် ပြောဆိုမှုကိုလည်း တိုက်ရိုက်ဘာသာပြန်ပေးပါသည်။',
    ],
    translations: {
      ko: '버마어 발언도 실시간으로 함께 번역됩니다.',
      en: 'Burmese speech is also translated in real time.',
      ja: 'ビルマ語の発話もリアルタイムで翻訳されます。',
      my: 'မြန်မာဘာသာဖြင့် ပြောဆိုမှုကိုလည်း တိုက်ရိုက်ဘာသာပြန်ပေးပါသည်။',
      ru: 'Речь на бирманском языке также переводится в реальном времени.',
      es: 'El habla en birmano también se traduce en tiempo real.',
    },
  },
];

function formatCurrentTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Simulated streaming adapter for frontend UI testing without a backend.
 * Emits connecting -> listening -> transcript.interim -> transcript.final events
 * strictly tagged with `source: 'demo'`.
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

    onEvent({ type: 'status', state: 'connecting' });

    const connectTimer = window.setTimeout(() => {
      if (!this.active) return;
      onEvent({ type: 'status', state: 'listening' });
      this.scheduleNextUtterance(onEvent, 350);
    }, 650);

    this.timers.push(connectTimer);
  }

  private scheduleNextUtterance(
    onEvent: (event: IncomingTranscriptEvent) => void,
    initialDelayMs: number
  ): void {
    if (!this.active) return;

    const script = DEMO_SCRIPT[this.utteranceIndex % DEMO_SCRIPT.length];
    this.utteranceIndex += 1;
    const segmentId = `demo-seg-${Date.now()}-${this.utteranceIndex}`;
    const timestamp = formatCurrentTime();

    script.steps.forEach((partialText, stepIdx) => {
      const stepDelay = initialDelayMs + stepIdx * 750;
      const stepTimer = window.setTimeout(() => {
        if (!this.active) return;
        const targetLang = this.getTargetLanguage();
        const fullTranslated = script.translations[targetLang];
        const ratio = (stepIdx + 1) / script.steps.length;
        const partialTranslated = fullTranslated.slice(
          0,
          Math.max(4, Math.ceil(fullTranslated.length * ratio))
        );

        onEvent({
          type: 'transcript.interim',
          segmentId,
          speakerId: script.speakerId,
          speakerName: script.speakerName,
          timestamp,
          sourceLanguage: script.sourceLanguage,
          text: partialText,
          targetLanguage: targetLang,
          translatedText:
            stepIdx === script.steps.length - 1
              ? fullTranslated
              : `${partialTranslated}...`,
          badgeVariant: script.badgeVariant,
          source: 'demo',
        });
      }, stepDelay);

      this.timers.push(stepTimer);
    });

    const finalizeDelay = initialDelayMs + script.steps.length * 750 + 450;
    const finalizeTimer = window.setTimeout(() => {
      if (!this.active) return;
      const targetLang = this.getTargetLanguage();
      const fullText = script.steps[script.steps.length - 1];

      onEvent({
        type: 'transcript.final',
        segmentId,
        speakerId: script.speakerId,
        speakerName: script.speakerName,
        timestamp,
        sourceLanguage: script.sourceLanguage,
        text: fullText,
        targetLanguage: targetLang,
        translatedText: script.translations[targetLang],
        translations: script.translations,
        badgeVariant: script.badgeVariant,
        source: 'demo',
      });

      this.scheduleNextUtterance(onEvent, 1400);
    }, finalizeDelay);

    this.timers.push(finalizeTimer);
  }

  disconnect(): void {
    this.active = false;
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
  }
}
