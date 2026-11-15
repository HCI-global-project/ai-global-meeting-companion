import type {
  LanguageCode,
  LiveContext,
  MeetingOutcome,
  OpinionStance,
  OutcomeItem,
} from '../types/meeting';

/**
 * 데모 스트림용 한국어 회의 대본.
 * 실제 서비스처럼 회의 언어는 한국어이고, 각 참여자는 자기 언어로 번역을 본다.
 * 백엔드(Soniox 전사 + 번역 + live-context + suggest-opinions)가 붙기 전까지 UI 확인용으로만 쓴다.
 */

type Translations = Record<Exclude<LanguageCode, 'ko'>, string>;

export interface DemoUtterance {
  speakerId: string;
  speakerName: string;
  badgeVariant: 'neutral' | 'lavender';
  text: string;
  translations: Translations;
  // 이 발화가 끝난 뒤 갱신되는 회의 맥락
  context?: Omit<LiveContext, 'updatedAt'>;
  // 이 발화가 끝난 뒤 누적된 회의 결과
  outcome?: Omit<MeetingOutcome, 'updatedAt'>;
  // 이 발화가 의견을 낼 만한 지점이면 추천할 세 문장
  suggestion?: {
    agree: string;
    disagree: string;
    alternative: string;
    gloss: Record<Exclude<LanguageCode, 'ko'>, Record<OpinionStance, string>>;
  };
}

// 회의 결과 항목 — 여러 스냅샷에서 다시 쓴다
const PROTOTYPE_THURSDAY: OutcomeItem = {
  text: '프로토타입은 목요일까지 완성',
  translations: {
    en: 'Prototype finished by Thursday',
    ja: 'プロトタイプは木曜日までに完成',
    my: 'ပရိုတိုတိုက်ကို ကြာသပတေးနေ့အထိ ပြီးစီးမည်',
    ru: 'Прототип будет готов к четвергу',
    es: 'Prototipo terminado para el jueves',
  },
};

const FIVE_PARTICIPANTS: OutcomeItem = {
  text: '테스트 참가자는 5명',
  translations: {
    en: 'Five test participants',
    ja: 'テスト参加者は5人',
    my: 'စမ်းသပ်မှု ပါဝင်သူ ငါးဦး',
    ru: 'Пять участников теста',
    es: 'Cinco participantes en la prueba',
  },
};

const TODO_PROTOTYPE: OutcomeItem = {
  text: '프로토타입 마무리',
  owner: 'Joe',
  translations: {
    en: 'Finish the prototype',
    ja: 'プロトタイプの仕上げ',
    my: 'ပရိုတိုတိုက် အပြီးသတ်ရန်',
    ru: 'Доделать прототип',
    es: 'Terminar el prototipo',
  },
};

const TODO_RECRUIT: OutcomeItem = {
  text: '참가자 모집',
  owner: 'Kenji',
  translations: {
    en: 'Recruit participants',
    ja: '参加者の募集',
    my: 'ပါဝင်သူ စုဆောင်းရန်',
    ru: 'Набрать участников',
    es: 'Reclutar participantes',
  },
};

const TODO_CONFIRM_DATE: OutcomeItem = {
  text: '이번 주 안에 테스트 날짜 확정',
  owner: 'Minji',
  translations: {
    en: 'Confirm the test date this week',
    ja: '今週中にテスト日を確定',
    my: 'ဒီအပတ်အတွင်း စမ်းသပ်ရက် အတည်ပြုရန်',
    ru: 'Утвердить дату теста на этой неделе',
    es: 'Confirmar la fecha de la prueba esta semana',
  },
};

const OPEN_TEST_DATE: OutcomeItem = {
  text: '테스트 날짜',
  translations: {
    en: 'Test date',
    ja: 'テスト日',
    my: 'စမ်းသပ်ရက်',
    ru: 'Дата теста',
    es: 'Fecha de la prueba',
  },
};

const OPEN_FRIDAY_OR_MONDAY: OutcomeItem = {
  text: '테스트 날짜: 금요일 오후 vs 다음 주 월요일',
  translations: {
    en: 'Test date: Friday afternoon vs. next Monday',
    ja: 'テスト日：金曜日の午後か来週の月曜日か',
    my: 'စမ်းသပ်ရက်- သောကြာနေ့ နေ့လယ် သို့မဟုတ် နောက်အပတ် တနင်္လာနေ့',
    ru: 'Дата теста: пятница после обеда или следующий понедельник',
    es: 'Fecha de la prueba: viernes por la tarde o el próximo lunes',
  },
};

export const DEMO_MEETING_SCRIPT: DemoUtterance[] = [
  {
    speakerId: 'p-minji',
    speakerName: 'Minji',
    badgeVariant: 'neutral',
    text: '오늘은 다음 주 사용자 테스트 일정부터 정해 볼게요.',
    translations: {
      en: "Let's start by setting the schedule for next week's user test.",
      ja: '今日は来週のユーザーテストの日程から決めましょう。',
      my: 'ဒီနေ့ နောက်အပတ် အသုံးပြုသူ စမ်းသပ်မှု အချိန်ဇယားကို အရင်ဆုံး သတ်မှတ်ကြရအောင်။',
      ru: 'Давайте начнём с графика пользовательского тестирования на следующей неделе.',
      es: 'Empecemos por definir el calendario de la prueba de usuarios de la próxima semana.',
    },
  },
  {
    speakerId: 'p-joe',
    speakerName: 'Joe',
    badgeVariant: 'lavender',
    text: '프로토타입은 목요일까지 마무리할 수 있을 것 같아요.',
    outcome: { decided: [PROTOTYPE_THURSDAY], actionItems: [TODO_PROTOTYPE], undecided: [OPEN_TEST_DATE] },
    translations: {
      en: 'I think I can finish the prototype by Thursday.',
      ja: 'プロトタイプは木曜日までに仕上げられそうです。',
      my: 'ပရိုတိုတိုက်ကို ကြာသပတေးနေ့အထိ ပြီးအောင်လုပ်နိုင်မယ်ထင်တယ်။',
      ru: 'Думаю, я смогу закончить прототип к четвергу.',
      es: 'Creo que puedo terminar el prototipo para el jueves.',
    },
    context: {
      currentTopic: '사용자 테스트 일정',
      rollingSummary:
        '다음 주 사용자 테스트 일정을 정하는 중이에요. 프로토타입은 목요일까지 마무리될 예정이에요.',
      keywords: ['사용자 테스트', '프로토타입', '목요일'],
      openQuestions: ['테스트는 언제 진행할까?'],
      translations: {
        en: {
          topic: 'User test schedule',
          summary:
            "The team is setting next week's user test schedule. The prototype should be finished by Thursday.",
        },
        ja: {
          topic: 'ユーザーテストの日程',
          summary: '来週のユーザーテストの日程を決めています。プロトタイプは木曜日までに仕上がる予定です。',
        },
        my: {
          topic: 'အသုံးပြုသူ စမ်းသပ်မှု အချိန်ဇယား',
          summary:
            'နောက်အပတ် အသုံးပြုသူ စမ်းသပ်မှု အချိန်ဇယားကို သတ်မှတ်နေပါတယ်။ ပရိုတိုတိုက်ကို ကြာသပတေးနေ့အထိ ပြီးစီးမယ်လို့ မျှော်လင့်ပါတယ်။',
        },
        ru: {
          topic: 'График пользовательского тестирования',
          summary:
            'Команда определяет график тестирования на следующей неделе. Прототип будет готов к четвергу.',
        },
        es: {
          topic: 'Calendario de la prueba de usuarios',
          summary:
            'El equipo está definiendo la prueba de usuarios de la próxima semana. El prototipo estará listo para el jueves.',
        },
      },
    },
  },
  {
    speakerId: 'p-anna',
    speakerName: 'Anna',
    badgeVariant: 'neutral',
    text: '그럼 테스트는 금요일 오후에 진행하는 게 어떨까요?',
    translations: {
      en: 'Then how about running the test on Friday afternoon?',
      ja: 'では、テストは金曜日の午後に行うのはどうでしょうか？',
      my: 'ဒါဆို စမ်းသပ်မှုကို သောကြာနေ့ နေ့လယ်ပိုင်းမှာ လုပ်ရင် ဘယ်လိုလဲ။',
      ru: 'Тогда как насчёт того, чтобы провести тест в пятницу после обеда?',
      es: 'Entonces, ¿qué tal si hacemos la prueba el viernes por la tarde?',
    },
    suggestion: {
      agree: '좋아요, 금요일 오후면 프로토타입을 한 번 더 점검할 시간도 있어요.',
      disagree: '금요일 오후는 참가자들이 오기 어려울 수도 있을 것 같아요.',
      alternative: '금요일 오전에 리허설을 하고 오후에 테스트하면 어떨까요?',
      gloss: {
        en: {
          agree: 'Sounds good. Friday afternoon also gives us time to check the prototype once more.',
          disagree: 'Friday afternoon might be hard for participants to attend.',
          alternative: 'How about a rehearsal on Friday morning and the test in the afternoon?',
        },
        ja: {
          agree: 'いいですね。金曜日の午後ならプロトタイプをもう一度確認する時間もあります。',
          disagree: '金曜日の午後は参加者が来にくいかもしれません。',
          alternative: '金曜日の午前にリハーサルをして、午後にテストするのはどうですか？',
        },
        my: {
          agree: 'ကောင်းပါတယ်၊ သောကြာနေ့ နေ့လယ်ဆိုရင် ပရိုတိုတိုက်ကို နောက်တစ်ခါ စစ်ဆေးဖို့ အချိန်လည်း ရပါတယ်။',
          disagree: 'သောကြာနေ့ နေ့လယ်ပိုင်းမှာ ပါဝင်သူတွေ လာဖို့ ခက်နိုင်တယ်လို့ ထင်ပါတယ်။',
          alternative: 'သောကြာနေ့ မနက်ပိုင်း အစမ်းလေ့ကျင့်ပြီး နေ့လယ်ပိုင်း စမ်းသပ်ရင် ဘယ်လိုလဲ။',
        },
        ru: {
          agree: 'Хорошо, в пятницу после обеда у нас будет время ещё раз проверить прототип.',
          disagree: 'Боюсь, участникам будет сложно прийти в пятницу после обеда.',
          alternative: 'Может, сделать репетицию в пятницу утром, а тест — после обеда?',
        },
        es: {
          agree: 'Me parece bien; el viernes por la tarde también tendremos tiempo para revisar el prototipo.',
          disagree: 'Puede que a los participantes les cueste venir el viernes por la tarde.',
          alternative: '¿Y si hacemos un ensayo el viernes por la mañana y la prueba por la tarde?',
        },
      },
    },
  },
  {
    speakerId: 'p-minji',
    speakerName: 'Minji',
    badgeVariant: 'neutral',
    text: '금요일은 참가자 모집이 빠듯해서 다음 주 월요일로 미루는 것도 생각하고 있어요.',
    outcome: { decided: [PROTOTYPE_THURSDAY], actionItems: [TODO_PROTOTYPE], undecided: [OPEN_FRIDAY_OR_MONDAY] },
    translations: {
      en: "Recruiting participants by Friday is tight, so I'm also thinking about moving it to next Monday.",
      ja: '金曜日だと参加者の募集が厳しいので、来週の月曜日に延期することも考えています。',
      my: 'သောကြာနေ့ဆိုရင် ပါဝင်သူ စုဆောင်းဖို့ အချိန်ကျပ်လို့ နောက်အပတ် တနင်္လာနေ့ကို ရွှေ့ဖို့လည်း စဉ်းစားနေပါတယ်။',
      ru: 'К пятнице сложно набрать участников, поэтому я думаю перенести тест на следующий понедельник.',
      es: 'Reclutar participantes para el viernes es justo, así que también pienso en pasarlo al próximo lunes.',
    },
    context: {
      currentTopic: '테스트 날짜: 금요일 vs 다음 주 월요일',
      rollingSummary:
        '프로토타입은 목요일에 완성돼요. 테스트를 금요일 오후에 할지, 참가자 모집 때문에 다음 주 월요일로 미룰지 의견이 갈리고 있어요.',
      keywords: ['금요일 오후', '다음 주 월요일', '참가자 모집'],
      openQuestions: ['금요일과 월요일 중 언제 테스트할까?', '참가자 모집은 누가 맡을까?'],
      translations: {
        en: {
          topic: 'Test date: Friday vs. next Monday',
          summary:
            'The prototype will be ready on Thursday. The team is split between testing on Friday afternoon and moving to next Monday because of recruiting.',
        },
        ja: {
          topic: 'テスト日：金曜日か来週の月曜日か',
          summary:
            'プロトタイプは木曜日に完成します。テストを金曜日の午後に行うか、参加者募集のため来週の月曜日に延期するかで意見が分かれています。',
        },
        my: {
          topic: 'စမ်းသပ်မည့်ရက်- သောကြာနေ့ နှင့် နောက်အပတ် တနင်္လာနေ့',
          summary:
            'ပရိုတိုတိုက်က ကြာသပတေးနေ့မှာ ပြီးပါမယ်။ စမ်းသပ်မှုကို သောကြာနေ့ နေ့လယ်မှာ လုပ်မလား၊ ပါဝင်သူ စုဆောင်းရေးကြောင့် နောက်အပတ် တနင်္လာနေ့ကို ရွှေ့မလား ဆိုတာ အမြင်ကွဲနေပါတယ်။',
        },
        ru: {
          topic: 'Дата теста: пятница или следующий понедельник',
          summary:
            'Прототип будет готов в четверг. Мнения разделились: тестировать в пятницу после обеда или перенести на понедельник из-за набора участников.',
        },
        es: {
          topic: 'Fecha de la prueba: viernes o el próximo lunes',
          summary:
            'El prototipo estará listo el jueves. Hay opiniones divididas entre probar el viernes por la tarde o pasarlo al lunes por el reclutamiento.',
        },
      },
    },
    suggestion: {
      agree: '저도 월요일이 좋아요. 참가자를 모집할 시간이 더 생기니까요.',
      disagree: '저는 금요일이 나을 것 같아요. 일정이 밀리면 결과를 분석할 시간이 부족해져요.',
      alternative: '금요일에 두세 명만 먼저 테스트하고, 나머지는 월요일에 하는 건 어떨까요?',
      gloss: {
        en: {
          agree: 'Monday works for me too, since it gives us more time to recruit participants.',
          disagree: 'I think Friday is better. If we push it back, we will have less time to analyze the results.',
          alternative: 'How about testing two or three people on Friday first and the rest on Monday?',
        },
        ja: {
          agree: '私も月曜日がいいです。参加者を募集する時間が増えるので。',
          disagree: '金曜日のほうがいいと思います。日程が延びると結果を分析する時間が足りなくなります。',
          alternative: '金曜日に2〜3人だけ先にテストして、残りは月曜日にするのはどうですか？',
        },
        my: {
          agree: 'ကျွန်ုပ်လည်း တနင်္လာနေ့ကို ကြိုက်ပါတယ်။ ပါဝင်သူ စုဆောင်းဖို့ အချိန်ပိုရလို့ပါ။',
          disagree: 'သောကြာနေ့က ပိုကောင်းမယ်ထင်တယ်။ ရက်ရွှေ့ရင် ရလဒ်ကို ခွဲခြမ်းစိတ်ဖြာဖို့ အချိန်မလောက်တော့ဘူး။',
          alternative: 'သောကြာနေ့မှာ နှစ်ယောက်သုံးယောက်ကို အရင်စမ်းပြီး ကျန်တာကို တနင်္လာနေ့မှာ လုပ်ရင် ဘယ်လိုလဲ။',
        },
        ru: {
          agree: 'Мне тоже подходит понедельник — будет больше времени на набор участников.',
          disagree: 'Мне кажется, пятница лучше: если перенести, останется меньше времени на анализ результатов.',
          alternative: 'Может, протестировать двух-трёх человек в пятницу, а остальных — в понедельник?',
        },
        es: {
          agree: 'A mí también me va bien el lunes, así tenemos más tiempo para reclutar participantes.',
          disagree: 'Creo que el viernes es mejor; si lo retrasamos, tendremos menos tiempo para analizar los resultados.',
          alternative: '¿Qué tal si probamos con dos o tres personas el viernes y con el resto el lunes?',
        },
      },
    },
  },
  {
    speakerId: 'p-kenji',
    speakerName: 'Kenji',
    badgeVariant: 'lavender',
    text: '참가자는 다섯 명 정도면 충분할 것 같은데, 모집은 제가 맡을게요.',
    outcome: {
      decided: [PROTOTYPE_THURSDAY, FIVE_PARTICIPANTS],
      actionItems: [TODO_PROTOTYPE, TODO_RECRUIT],
      undecided: [OPEN_FRIDAY_OR_MONDAY],
    },
    translations: {
      en: "I think about five participants should be enough, and I'll take care of recruiting.",
      ja: '参加者は5人くらいで十分だと思います。募集は私が担当します。',
      my: 'ပါဝင်သူ ငါးယောက်လောက်ဆို လုံလောက်မယ်ထင်တယ်၊ စုဆောင်းတာကို ကျွန်တော် တာဝန်ယူပါမယ်။',
      ru: 'Думаю, пяти участников будет достаточно, а набором займусь я.',
      es: 'Creo que unos cinco participantes serán suficientes; yo me encargo del reclutamiento.',
    },
  },
  {
    speakerId: 'p-minji',
    speakerName: 'Minji',
    badgeVariant: 'neutral',
    text: '좋아요, 그럼 날짜는 이번 주 안에 확정하는 걸로 하죠.',
    outcome: {
      decided: [PROTOTYPE_THURSDAY, FIVE_PARTICIPANTS],
      actionItems: [TODO_PROTOTYPE, TODO_RECRUIT, TODO_CONFIRM_DATE],
      undecided: [OPEN_FRIDAY_OR_MONDAY],
    },
    translations: {
      en: "Great, then let's confirm the date within this week.",
      ja: 'いいですね。では日程は今週中に確定することにしましょう。',
      my: 'ကောင်းပါတယ်၊ ဒါဆို ရက်စွဲကို ဒီအပတ်အတွင်း အတည်ပြုကြရအောင်။',
      ru: 'Отлично, тогда подтвердим дату до конца этой недели.',
      es: 'Perfecto, entonces confirmemos la fecha antes de que termine esta semana.',
    },
    context: {
      currentTopic: '테스트 일정 정리',
      rollingSummary:
        '테스트 참가자는 다섯 명으로 하고 모집은 Kenji가 맡기로 했어요. 금요일과 월요일 중 날짜는 이번 주 안에 확정하기로 했어요.',
      keywords: ['참가자 5명', '모집 담당 Kenji', '이번 주 확정'],
      openQuestions: ['최종 테스트 날짜는 금요일과 월요일 중 언제일까?'],
      translations: {
        en: {
          topic: 'Wrapping up the test schedule',
          summary:
            'The test will have five participants and Kenji will handle recruiting. The team will confirm Friday or Monday within this week.',
        },
        ja: {
          topic: 'テスト日程のまとめ',
          summary:
            'テストの参加者は5人とし、募集はKenjiさんが担当します。金曜日か月曜日かは今週中に確定することになりました。',
        },
        my: {
          topic: 'စမ်းသပ်မှု အချိန်ဇယား အနှစ်ချုပ်',
          summary:
            'စမ်းသပ်မှုမှာ ပါဝင်သူ ငါးယောက်ထားပြီး Kenji က စုဆောင်းရေးကို တာဝန်ယူပါမယ်။ သောကြာနေ့ သို့မဟုတ် တနင်္လာနေ့ကို ဒီအပတ်အတွင်း အတည်ပြုပါမယ်။',
        },
        ru: {
          topic: 'Итоги по графику тестирования',
          summary:
            'В тесте будет пять участников, набором займётся Кэндзи. Пятницу или понедельник подтвердят до конца недели.',
        },
        es: {
          topic: 'Cierre del calendario de pruebas',
          summary:
            'La prueba tendrá cinco participantes y Kenji se encargará del reclutamiento. Se confirmará viernes o lunes esta semana.',
        },
      },
    },
  },
];
