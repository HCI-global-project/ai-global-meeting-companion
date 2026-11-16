import type {
  DecisionItem,
  LanguageOption,
  MeetingNote,
  Participant,
  TranscriptEntry,
} from '../types/meeting';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'my', label: 'Burmese', nativeLabel: 'မြန်မာဘာသာ' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
];

export const AVAILABLE_ROOMS = ['Lab-5', 'Design-Sync', 'Capstone-HCI'];

export const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: 'p-joe',
    name: 'Joe',
    role: 'designer',
    nativeLanguage: 'en',
    languageLabel: 'English',
    badgeVariant: 'neutral',
    isOnline: true,
  },
  {
    id: 'p-anna',
    name: 'Anna',
    role: 'PM',
    nativeLanguage: 'ru',
    languageLabel: 'Русский',
    badgeVariant: 'lavender',
    isOnline: true,
  },
  {
    id: 'p-minji',
    name: 'Minji',
    role: 'developer',
    nativeLanguage: 'ko',
    languageLabel: '한국어',
    badgeVariant: 'neutral',
    isOnline: true,
  },
  {
    id: 'p-kenji',
    name: 'Kenji',
    role: 'researcher',
    nativeLanguage: 'ja',
    languageLabel: '日本語',
    badgeVariant: 'lavender',
    isOnline: true,
  },
];

export const INITIAL_TRANSCRIPT: TranscriptEntry[] = [];

export const MOCK_SUMMARY_POINTS: Record<string, string[]> = {
  ko: [
    '회의 목표: 이번 주 프로젝트 일정 및 마일스톤 조율',
    '금요일 체크인 일정 및 다국어 프로토타입 검토 예정',
    '다음 단계: 프로토타입 공유 및 사용성 피드백 정리',
  ],
  en: [
    'Meeting goal: Align on the upcoming project schedule and milestone handoff',
    'Review Friday sync schedule and multilingual prototype flow',
    'Next step: Share prototype screens and organize usability feedback',
  ],
  ja: [
    '会議の目的：プロジェクトスケジュールとマイルストーンの調整',
    '金曜日の定例ミーティングと多言語プロトタイプの確認',
    '次のステップ：プロトタイプ共有とテスト結果整理',
  ],
  my: [
    'အစည်းအဝေးရည်ရွယ်ချက်- ပရောဂျက်အချိန်ဇယားနှင့် အဆင့်များကို ညှိနှိုင်းရန်',
    'သောကြာနေ့ ပြန်လည်သုံးသပ်မှုနှင့် ဘာသာစကားစုံ ပရိုတိုတိုက်ကို စစ်ဆေးရန်',
    'နောက်တစ်ဆင့်- ပရိုတိုတိုက်မျက်နှာပြင်များ မျှဝေပြီး အကြံပြုချက်များ စုစည်းရန်',
  ],
  ru: [
    'Цель встречи: согласование графика проекта и ближайших этапов',
    'Обсуждение встречи в пятницу и многоязычного прототипа',
    'Следующий шаг: демонстрация прототипа и сбор отзывов',
  ],
  es: [
    'Objetivo: Alinear el calendario del proyecto y las entregas clave',
    'Revisar la sesión del viernes y el prototipo multilingüe',
    'Siguiente paso: Compartir el prototipo y organizar comentarios de usabilidad',
  ],
};

export const INITIAL_NOTES: MeetingNote[] = [
  {
    id: 'note-1',
    author: 'Joe',
    timestamp: '20:16',
    content: 'Check if Friday afternoon works across all time zones for usability testing.',
    translatedContent: {
      ko: '사용성 테스트를 위해 금요일 오후가 모든 팀원의 시간대에 맞는지 확인하기.',
      en: 'Check if Friday afternoon works across all time zones for usability testing.',
      ja: 'ユーザビリティテストに向けて金曜午後の時間帯が全員に合うか確認する。',
      my: 'အသုံးပြုရလွယ်ကူမှု စမ်းသပ်ရန် သောကြာနေ့ နေ့လယ်ပိုင်းသည် အားလုံး၏ အချိန်ဇုန်နှင့် ကိုက်ညီမှုရှိမရှိ စစ်ဆေးရန်။',
      ru: 'Проверить, подходит ли пятница после обеда для всех часовых поясов.',
      es: 'Verificar si el viernes por la tarde funciona en todas las zonas horarias.',
    },
  },
];

export const MOCK_DECISIONS: DecisionItem[] = [
  {
    id: 'dec-1',
    title: 'Target Friday for milestone schedule review',
    owner: 'Anna',
    dueDate: 'This Friday, 14:00',
    status: 'Pending Review',
  },
  {
    id: 'dec-2',
    title: 'Keep dual-line original + translated captions in Live Transcript',
    owner: 'Joe',
    dueDate: 'Confirmed in Lab-5',
    status: 'Confirmed',
  },
];
