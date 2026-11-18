import type { MicErrorCode } from "../features/stt/micErrors";
import type { LanguageCode } from "../types/meeting";

export interface TranslationDictionary {
  common: {
    languages: Record<LanguageCode, string>;
    tryAgain: string;
    retry: string;
    clear: string;
    close: string;
  };
  login: {
    title: string;
    subtitle: string;
    roomCodeLabel: string;
    roomCodePlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    roleLabel: string;
    rolePlaceholder: string;
    languageLabel: string;
    startButton: string;
  };
  header: {
    switchRoom: string;
    active: string;
    endMeeting: string;
    backToMeetingPage: string;
    roleSummary: (role: string, roomCode: string) => string;
    meetingPage: string;
    meetingEndPage: string;
    targetLanguageAria: string;
    exit: string;
    resumeMeeting: string;
    starting: string;
  };
  transcript: {
    title: string;
    startRecording: string;
    stopRecording: string;
    requestingMic: string;
    micUnavailableTitle: string;
    micErrors: Record<MicErrorCode, string>;
    waitingPermission: string;
    recordingLocallyNotice: (speakerName: string) => string;
    recordedPlaybackTitle: string;
    transcribeRecording: string;
    transcribeAgain: string;
    transcribing: string;
    emptySpeechNotice: string;
    unableToTranscribe: string;
    emptyStateTitle: string;
    emptyStateBody: string;
  };
  stream: {
    demoButton: string;
    stopDemoButton: string;
    states: {
      disconnected: string;
      connecting: string;
      listening: string;
      error: string;
    };
    demoBanner: string;
    liveStreamBanner: string;
    disconnectedHint: string;
    interimBadge: string;
    demoBadge: string;
    noBackendConfigured: string;
  };
  participants: {
    title: string;
    mockLabel: string;
    speaking: string;
    selectedHint: string;
  };
  opinion: {
    title: string;
    demoLabel: string;
    generating: string;
    emptyState: string;
    agree: string;
    disagree: string;
    alternative: string;
    copied: string;
    copyHint: string;
  };
  anonymousOpinion: {
    title: string;
    description: string;
    placeholder: string;
    submit: string;
    cancel: string;
    submitted: string;
    anonymousSpeaker: string;
    validationEmpty: string;
    validationTooShort: string;
    validationTooLong: string;
  };
  quickActions: {
    waitPlease: string;
    anonymousOpinion: string;
    waitSent: string;
    waitNotice: string;
  };
  context: {
    title: string;
    demoLabel: string;
    currentTopic: string;
    topicPending: string;
    openQuestions: string;
    emptyState: string;
  };
  summary: {
    title: string;
    subtitle: string;
    demoLabel: string;
    decided: string;
    actionItems: string;
    undecided: string;
    emptyColumn: string;
    emptyState: string;
    collapse: string;
    expand: string;
    noOwner: string;
  };
  chat: {
    placeholder: string;
    send: string;
    badge: string;
  };
  // 마이크 하나로 녹음한 화자 번호를 참여자에 잇는 메뉴
  speakers: {
    unassigned: (n: string) => string;
    assignTitle: string;
    assignLabel: (label: string) => string;
    me: (name: string) => string;
    clear: string;
    noParticipants: string;
    assignHint: string;
  };
  // 회의 서버 연결과 녹음 기기 한 대 규칙
  live: {
    connectingServer: string;
    serverUnavailable: string;
    recorderBusy: (name: string) => string;
    recordingBy: (name: string) => string;
    sendFailed: string;
    // 사용량 한도에 걸렸을 때. 몇 초 뒤 다시 되는지 알려 준다
    slowDown: (seconds: number) => string;
    // 초대 링크 없이 들어왔거나 접속 코드가 바뀌었을 때
    accessDenied: string;
  };
  meetingEnd: {
    backToMeeting: string;
    summaryTitle: string;
    summaryHint: string;
    finalizing: string;
    decidedTitle: string;
    actionItemsTitle: string;
    undecidedTitle: string;
    owner: (name: string) => string;
    noOwner: string;
    emptyGroup: string;
    noOutcomeTitle: string;
    noOutcomeBody: string;
    transcriptTitle: string;
    noHistoryTitle: string;
    noHistoryBody: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    common: {
      languages: {
        ko: 'Korean',
        en: 'English',
        ja: 'Japanese',
        my: 'Burmese',
        ru: 'Russian',
        es: 'Spanish',
      },
      tryAgain: 'Try again',
      retry: 'Retry',
      clear: 'Clear',
      close: 'Close',
    },
    login: {
      title: 'Welcome to Loop!',
      subtitle: 'Connect with your team in any language.',
      roomCodeLabel: 'Room Code',
      roomCodePlaceholder: 'Enter room code',
      nameLabel: 'Name',
      namePlaceholder: 'Enter your name',
      roleLabel: 'Role',
      rolePlaceholder: 'e.g. PM, Designer, Developer',
      languageLabel: 'My Language',
      startButton: 'Start',
    },
    header: {
      switchRoom: 'Switch Room',
      active: 'Active',
      endMeeting: 'End Meeting',
      backToMeetingPage: 'Back to Meeting Page',
      roleSummary: (role, roomCode) => `Role: ${role} · Room ${roomCode}`,
      meetingPage: 'Meeting Page',
      meetingEndPage: 'Meeting End Page',
      targetLanguageAria: 'Select language',
      exit: 'Exit',
      resumeMeeting: 'Resume meeting',
      starting: 'Starting...',
    },
    transcript: {
      title: 'Live Conversation Translation',
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      requestingMic: 'Requesting mic...',
      micUnavailableTitle: 'Microphone unavailable',
      micErrors: {
        'permission-denied':
          'Microphone access was denied. Please allow microphone permission in your browser settings and try again.',
        'not-found':
          'No microphone was detected on this device. Connect a microphone and try again.',
        'not-readable':
          'Your microphone is currently in use by another application or could not be read.',
        'not-supported':
          'Audio recording is not supported in this browser or insecure context.',
        unknown: 'Unable to access the microphone.',
        lost:
          'The microphone stopped sending sound. Check whether another app is using it or your earphones changed, then start recording again.',
      },
      waitingPermission: 'Waiting for browser microphone permission...',
      recordingLocallyNotice: (speakerName) =>
        `Recording audio locally as ${speakerName} (not uploaded until you transcribe)`,
      recordedPlaybackTitle: 'Recorded Audio Playback',
      transcribeRecording: 'Transcribe Recording',
      transcribeAgain: 'Transcribe Again',
      transcribing: 'Transcribing...',
      emptySpeechNotice:
        'No clear speech was detected in this recording. Try speaking closer to the microphone and record again.',
      unableToTranscribe: 'Unable to transcribe the recording. Please try again.',
      emptyStateTitle: 'No live transcript yet',
      emptyStateBody:
        'Click Start Recording, speak in Korean, English, Japanese, or Burmese, click Stop Recording, and then click Transcribe Recording to run speech-to-text.',
    },
    stream: {
      demoButton: 'Demo Stream',
      stopDemoButton: 'Stop Demo',
      states: {
        disconnected: 'Stream disconnected',
        connecting: 'Connecting stream...',
        listening: 'Listening live',
        error: 'Stream error',
      },
      demoBanner:
        'DEMO MODE · Simulated streaming speech for UI testing (not real microphone audio)',
      liveStreamBanner: 'Connected to live speech translation stream',
      disconnectedHint:
        'Ready for backend stream · Use Demo Stream to preview real-time captions or Start Recording for local audio',
      interimBadge: 'Speaking...',
      demoBadge: 'Demo',
      noBackendConfigured:
        'No live WebSocket backend URL is connected yet. Use Demo Stream to preview streaming UI or Start Recording for local transcription.',
    },
    participants: {
      title: 'Participants',
      mockLabel: 'Sample roster',
      speaking: 'Speaking',
      selectedHint: 'Click a card to inspect role & language',
    },
    opinion: {
      title: 'Opinion Suggestions',
      demoLabel: 'Demo',
      generating: 'Generating suggestions',
      emptyState:
        'When it\'s a good moment to speak up, you\'ll get three ready-to-say sentences: agree, disagree, and another view.',
      agree: 'Agree',
      disagree: 'Disagree',
      alternative: 'Another view',
      copied: 'Copied',
      copyHint: 'Tap to copy',
    },
    anonymousOpinion: {
      title: 'Submit Anonymous Opinion',
      description: 'Your opinion is shared in the live conversation without your name.',
      placeholder: 'Write what you want to say',
      submit: 'Submit anonymously',
      cancel: 'Cancel',
      submitted: 'Your anonymous opinion was shared',
      anonymousSpeaker: 'Anonymous',
      validationEmpty: 'Please write an opinion before sending.',
      validationTooShort: 'Please enter at least 2 characters.',
      validationTooLong: 'Keep opinions under 400 characters.',
    },
    quickActions: {
      waitPlease: 'Please wait a moment',
      anonymousOpinion: 'Anonymous opinion',
      waitSent: 'Request sent',
      waitNotice: 'Someone asked everyone to wait a moment',
    },
    context: {
      title: 'Conversation Context',
      demoLabel: 'Demo',
      currentTopic: 'Current topic',
      topicPending: 'Identifying topic',
      openQuestions: 'Open questions',
      emptyState:
        'As the conversation builds up, the topic, keywords, and a summary of what is being discussed will appear here.',
    },
    summary: {
      title: 'Summary',
      subtitle: 'What has been decided so far',
      demoLabel: 'Demo',
      decided: 'Decided',
      actionItems: 'To-dos',
      undecided: 'Not decided yet',
      emptyColumn: 'Nothing yet',
      emptyState: 'As the meeting goes on, decisions, to-dos, and open issues will be collected here.',
      collapse: 'Collapse',
      expand: 'Expand',
      noOwner: 'No owner yet',
    },
    chat: {
      placeholder: 'Type a message (Enter to send)',
      send: 'Send',
      badge: 'Chat',
    },
    speakers: {
      unassigned: (n) => `Speaker ${n}`,
      assignTitle: 'Who is this speaker?',
      assignLabel: (label) => `Set who ${label} is`,
      me: (name) => `Me (${name})`,
      clear: 'Clear',
      noParticipants: 'No one else has joined yet',
      assignHint: 'Tap a speaker name to set who it is',
    },
    live: {
      connectingServer: 'Connecting to the meeting server...',
      serverUnavailable: 'Cannot reach the meeting server. Check that it is running.',
      recorderBusy: (name) => `${name || 'Someone else'} is already recording`,
      recordingBy: (name) => `${name} is recording`,
      sendFailed: 'Could not send. Please try again.',
      slowDown: (seconds) => `Too many requests. Please try again in ${seconds}s.`,
      accessDenied: 'Please join with the invite link.',
    },
    meetingEnd: {
      backToMeeting: 'Back to Meeting Page',
      summaryTitle: 'Meeting summary',
      summaryHint: 'AI put this together from the conversation. It may have mistakes, so check it against the transcript.',
      finalizing: 'Adding the last part of the meeting…',
      decidedTitle: 'Decided',
      actionItemsTitle: 'To-dos',
      undecidedTitle: 'Still open',
      owner: (name) => `Owner: ${name}`,
      noOwner: 'No owner yet',
      emptyGroup: 'Nothing here',
      noOutcomeTitle: 'Nothing to summarize yet',
      noOutcomeBody: 'Decisions and to-dos from the meeting will gather here.',
      transcriptTitle: 'Transcript',
      noHistoryTitle: 'Nothing was recorded',
      noHistoryBody: 'Speech and translations from the meeting appear here.',
    },
  },

  ko: {
    common: {
      languages: {
        ko: '한국어',
        en: '영어',
        ja: '일본어',
        my: '버마어',
        ru: '러시아어',
        es: '스페인어',
      },
      tryAgain: '다시 시도',
      retry: '재시도',
      clear: '지우기',
      close: '닫기',
    },
    login: {
      title: 'Loop에 오신 것을 환영합니다!',
      subtitle: '언어 장벽 없이 팀과 자유롭게 소통하세요.',
      roomCodeLabel: '방 코드',
      roomCodePlaceholder: '방 코드를 입력하세요',
      nameLabel: '이름',
      namePlaceholder: '이름을 입력하세요',
      roleLabel: '역할',
      rolePlaceholder: '예: PM, 디자이너, 개발자',
      languageLabel: '내 언어',
      startButton: '시작하기',
    },
    header: {
      switchRoom: '방 전환',
      active: '현재 방',
      endMeeting: '회의 종료',
      backToMeetingPage: '회의 페이지로 돌아가기',
      roleSummary: (role, roomCode) => `역할: ${role} · 방 ${roomCode}`,
      meetingPage: '회의 페이지',
      meetingEndPage: '회의 종료 페이지',
      targetLanguageAria: '언어 선택',
      exit: '나가기',
      resumeMeeting: '회의 재개',
      starting: '시작 중...',
    },
    transcript: {
      title: '실시간 대화 번역',
      startRecording: '녹음 시작',
      stopRecording: '녹음 중지',
      requestingMic: '마이크 요청 중...',
      micUnavailableTitle: '마이크를 사용할 수 없습니다',
      micErrors: {
        'permission-denied':
          '마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용한 뒤 다시 시도해 주세요.',
        'not-found':
          '연결된 마이크를 찾을 수 없습니다. 마이크를 연결한 후 다시 시도해 주세요.',
        'not-readable':
          '마이크가 다른 앱에서 사용 중이거나 읽을 수 없습니다.',
        'not-supported':
          '현재 브라우저 또는 보안 환경에서는 오디오 녹음이 지원되지 않습니다.',
        unknown: '마이크에 접근할 수 없습니다.',
        lost:
          '마이크 소리가 끊겼어요. 다른 앱이 마이크를 쓰고 있는지, 이어폰 연결이 바뀌었는지 확인한 뒤 다시 녹음해 주세요.',
      },
      waitingPermission: '브라우저의 마이크 권한 승인을 기다리는 중...',
      recordingLocallyNotice: (speakerName) =>
        `${speakerName}님으로 로컬 녹음 중 (변환을 누르기 전까지 업로드되지 않습니다)`,
      recordedPlaybackTitle: '녹음된 오디오 재생',
      transcribeRecording: '녹음 텍스트 변환',
      transcribeAgain: '다시 변환',
      transcribing: '변환 중...',
      emptySpeechNotice:
        '녹음에서 또렷한 음성이 감지되지 않았습니다. 마이크에 더 가까이 말씀하신 후 다시 녹음해 주세요.',
      unableToTranscribe: '녹음을 변환하지 못했습니다. 다시 시도해 주세요.',
      emptyStateTitle: '아직 실시간 전사 내역이 없습니다',
      emptyStateBody:
        '녹음 시작을 눌러 한국어, 영어, 일본어 또는 버마어로 말한 뒤 녹음 중지를 누르고, 녹음 텍스트 변환을 클릭하세요.',
    },
    stream: {
      demoButton: '데모 스트림',
      stopDemoButton: '데모 중지',
      states: {
        disconnected: '스트림 연결 안 됨',
        connecting: '스트림 연결 중...',
        listening: '실시간 수신 중',
        error: '스트림 오류',
      },
      demoBanner:
        '데모 모드 · UI 테스트용 시뮬레이션 텍스트입니다 (실제 마이크 음성이 아닙니다)',
      liveStreamBanner: '실시간 음성 번역 스트림에 연결됨',
      disconnectedHint:
        '백엔드 스트림 대기 중 · 데모 스트림으로 실시간 자막을 테스트하거나 녹음 시작을 사용하세요',
      interimBadge: '말하는 중...',
      demoBadge: '데모',
      noBackendConfigured:
        '실시간 WebSocket 백엔드가 아직 연결되지 않았습니다. 데모 스트림 또는 로컬 녹음을 이용해 주세요.',
    },
    participants: {
      title: '참여자',
      mockLabel: '샘플 참여자',
      speaking: '발화 중',
      selectedHint: '카드를 클릭해 역할과 언어를 확인하세요',
    },
    opinion: {
      title: '의견 추천',
      demoLabel: '데모',
      generating: '추천 만드는 중',
      emptyState:
        '의견을 낼 만한 발화가 나오면 동의·반대·다른 의견 세 문장을 바로 추천해 드려요.',
      agree: '동의',
      disagree: '반대',
      alternative: '다른 의견',
      copied: '복사했어요',
      copyHint: '눌러서 복사',
    },
    anonymousOpinion: {
      title: '익명 의견 제출',
      description: '이름 없이 실시간 대화창에 의견이 공유돼요.',
      placeholder: '하고 싶은 말을 적어 주세요',
      submit: '익명으로 제출',
      cancel: '취소',
      submitted: '익명 의견을 공유했어요',
      anonymousSpeaker: '익명',
      validationEmpty: '전송하기 전에 의견을 입력해 주세요.',
      validationTooShort: '최소 2자 이상 입력해 주세요.',
      validationTooLong: '의견은 400자 이내로 작성해 주세요.',
    },
    quickActions: {
      waitPlease: '잠깐 기다려주세요',
      anonymousOpinion: '익명 의견 제출',
      waitSent: '요청을 보냈어요',
      waitNotice: '누군가 잠깐 기다려 달라고 요청했어요',
    },
    context: {
      title: '대화 맥락',
      demoLabel: '데모',
      currentTopic: '현재 주제',
      topicPending: '주제 파악 중',
      openQuestions: '미해결 질문',
      emptyState:
        '발화가 쌓이면 지금 무슨 이야기를 하는지 주제·키워드·요약으로 정리해 드려요.',
    },
    summary: {
      title: '요약',
      subtitle: '지금까지 정해진 것',
      demoLabel: '데모',
      decided: '정해진 것',
      actionItems: '할 일',
      undecided: '아직 정해지지 않은 것',
      emptyColumn: '아직 없어요',
      emptyState: '회의가 진행되면 정해진 것과 할 일, 남은 쟁점을 모아 보여 드려요.',
      collapse: '접기',
      expand: '펼치기',
      noOwner: '담당 미정',
    },
    chat: {
      placeholder: '채팅으로 말하기 (Enter로 보내기)',
      send: '보내기',
      badge: '채팅',
    },
    speakers: {
      unassigned: (n) => `화자 ${n}`,
      assignTitle: '이 화자는 누구인가요?',
      assignLabel: (label) => `${label} 지정하기`,
      me: (name) => `나 (${name})`,
      clear: '지정 해제',
      noParticipants: '아직 들어온 참여자가 없어요',
      assignHint: '화자 이름을 누르면 누구인지 지정할 수 있어요',
    },
    live: {
      connectingServer: '회의 서버에 연결하는 중...',
      serverUnavailable: '회의 서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요.',
      recorderBusy: (name) => `${name || '다른 참여자'}님이 이미 녹음하고 있어요`,
      recordingBy: (name) => `${name} 녹음 중`,
      sendFailed: '보내지 못했어요. 다시 시도해 주세요.',
      slowDown: (seconds) => `요청이 너무 많아요. ${seconds}초 뒤에 다시 시도해 주세요.`,
      accessDenied: '초대 링크로 들어와 주세요.',
    },
    meetingEnd: {
      backToMeeting: '회의 페이지로 돌아가기',
      summaryTitle: '회의 정리',
      summaryHint: 'AI가 대화를 듣고 정리했어요. 틀린 곳이 있을 수 있으니 회의 기록과 함께 확인해 주세요.',
      finalizing: '마지막 이야기까지 정리하고 있어요…',
      decidedTitle: '정해진 것',
      actionItemsTitle: '할 일',
      undecidedTitle: '아직 정하지 못한 것',
      owner: (name) => `담당 ${name}`,
      noOwner: '담당 미정',
      emptyGroup: '없어요',
      noOutcomeTitle: '아직 정리할 내용이 없어요',
      noOutcomeBody: '회의에서 무언가를 정하거나 할 일을 나누면 여기에 모여요.',
      transcriptTitle: '회의 기록',
      noHistoryTitle: '기록된 이야기가 없어요',
      noHistoryBody: '회의 중 말한 내용과 번역이 여기에 보여요.',
    },
  },

  ja: {
    common: {
      languages: {
        ko: '韓国語',
        en: '英語',
        ja: '日本語',
        my: 'ビルマ語',
        ru: 'ロシア語',
        es: 'スペイン語',
      },
      tryAgain: '再試行',
      retry: 'もう一度試す',
      clear: 'クリア',
      close: '閉じる',
    },
    login: {
      title: 'Loopへようこそ！',
      subtitle: 'どの言語でもチームとつながりましょう。',
      roomCodeLabel: 'ルームコード',
      roomCodePlaceholder: 'ルームコードを入力',
      nameLabel: '名前',
      namePlaceholder: 'お名前を入力',
      roleLabel: '役割',
      rolePlaceholder: '例: PM、デザイナー、開発者',
      languageLabel: '使用言語',
      startButton: '開始',
    },
    header: {
      switchRoom: 'ルームを切り替え',
      active: '使用中',
      endMeeting: '会議を終了',
      backToMeetingPage: '会議ページに戻る',
      roleSummary: (role, roomCode) => `役割: ${role} · ルーム ${roomCode}`,
      meetingPage: '会議ページ',
      meetingEndPage: '会議終了ページ',
      targetLanguageAria: '言語を選択',
      exit: '退出',
      resumeMeeting: '会議を再開',
      starting: '開始中...',
    },
    transcript: {
      title: 'ライブ会話翻訳',
      startRecording: '録音開始',
      stopRecording: '録音停止',
      requestingMic: 'マイク許可を確認中...',
      micUnavailableTitle: 'マイクを利用できません',
      micErrors: {
        'permission-denied':
          'マイクへのアクセスが拒否されました。ブラウザの設定でマイクを許可してから再試行してください。',
        'not-found':
          'マイクが見つかりませんでした。マイクを接続してもう一度お試しください。',
        'not-readable':
          'マイクが他のアプリケーションで使用中か、読み取れません。',
        'not-supported':
          'このブラウザまたは環境では音声録音がサポートされていません。',
        unknown: 'マイクにアクセスできませんでした。',
        lost:
          'マイクの音が途切れました。他のアプリがマイクを使っていないか、イヤホンの接続が変わっていないか確認してから、もう一度録音してください。',
      },
      waitingPermission: 'ブラウザのマイク許可を待っています...',
      recordingLocallyNotice: (speakerName) =>
        `${speakerName} としてローカル録音中（文字起こしを押すまでアップロードされません）`,
      recordedPlaybackTitle: '録音音声の再生',
      transcribeRecording: '録音を文字起こし',
      transcribeAgain: 'もう一度文字起こし',
      transcribing: '文字起こし中...',
      emptySpeechNotice:
        '明瞭な音声が検出されませんでした。マイクに近づいてもう一度録音してください。',
      unableToTranscribe: '文字起こしに失敗しました。もう一度お試しください。',
      emptyStateTitle: '文字起こしはまだありません',
      emptyStateBody:
        '「録音開始」を押して韓国語・英語・日本語・ビルマ語で話し、「録音停止」の後に「録音を文字起こし」をクリックしてください。',
    },
    stream: {
      demoButton: 'デモ配信',
      stopDemoButton: 'デモ停止',
      states: {
        disconnected: 'ストリーム未接続',
        connecting: '接続中...',
        listening: 'リアルタイム受信中',
        error: 'ストリームエラー',
      },
      demoBanner:
        'デモモード · UIテスト用のシミュレーション配信です（実際のマイク音声ではありません）',
      liveStreamBanner: 'ライブ音声翻訳ストリームに接続中',
      disconnectedHint:
        'バックエンド接続待機中 · デモ配信でリアルタイム字幕を確認するか録音を開始してください',
      interimBadge: '発話中...',
      demoBadge: 'デモ',
      noBackendConfigured:
        'ライブWebSocketバックエンドが未接続です。デモ配信またはローカル録音をご利用ください。',
    },
    participants: {
      title: '参加者',
      mockLabel: 'サンプル参加者',
      speaking: '発話中',
      selectedHint: 'カードをクリックして役割と言語を表示',
    },
    opinion: {
      title: '意見の提案',
      demoLabel: 'デモ',
      generating: '提案を作成中',
      emptyState:
        '発言のチャンスが来たら、賛成・反対・別の意見の3つの文をすぐに提案します。',
      agree: '賛成',
      disagree: '反対',
      alternative: '別の意見',
      copied: 'コピーしました',
      copyHint: 'タップでコピー',
    },
    anonymousOpinion: {
      title: '匿名で意見を送る',
      description: '名前を出さずにリアルタイム会話に意見が共有されます。',
      placeholder: '伝えたいことを書いてください',
      submit: '匿名で送信',
      cancel: 'キャンセル',
      submitted: '匿名の意見を共有しました',
      anonymousSpeaker: '匿名',
      validationEmpty: '送信する前に意見を入力してください。',
      validationTooShort: '2文字以上入力してください。',
      validationTooLong: '意見は400文字以内で入力してください。',
    },
    quickActions: {
      waitPlease: '少し待ってください',
      anonymousOpinion: '匿名で意見を送る',
      waitSent: 'リクエストを送りました',
      waitNotice: '誰かが少し待ってほしいとリクエストしました',
    },
    context: {
      title: '会話の文脈',
      demoLabel: 'デモ',
      currentTopic: '現在のトピック',
      topicPending: 'トピックを把握中',
      openQuestions: '未解決の質問',
      emptyState:
        '発言が集まると、今何を話しているかをトピック・キーワード・要約でまとめます。',
    },
    summary: {
      title: '要約',
      subtitle: 'ここまでに決まったこと',
      demoLabel: 'デモ',
      decided: '決まったこと',
      actionItems: 'やること',
      undecided: 'まだ決まっていないこと',
      emptyColumn: 'まだありません',
      emptyState: '会議が進むと、決まったこと・やること・残った論点をここにまとめます。',
      collapse: '折りたたむ',
      expand: '開く',
      noOwner: '担当未定',
    },
    chat: {
      placeholder: 'チャットで発言（Enterで送信）',
      send: '送信',
      badge: 'チャット',
    },
    speakers: {
      unassigned: (n) => `話者${n}`,
      assignTitle: 'この話者は誰ですか？',
      assignLabel: (label) => `${label}を指定`,
      me: (name) => `自分 (${name})`,
      clear: '指定を解除',
      noParticipants: 'まだ参加者がいません',
      assignHint: '話者名を押すと誰かを指定できます',
    },
    live: {
      connectingServer: '会議サーバーに接続中...',
      serverUnavailable: '会議サーバーに接続できません。サーバーが起動しているか確認してください。',
      recorderBusy: (name) => `${name || '他の参加者'}さんがすでに録音しています`,
      recordingBy: (name) => `${name}が録音中`,
      sendFailed: '送信できませんでした。もう一度お試しください。',
      slowDown: (seconds) => `リクエストが多すぎます。${seconds}秒後にもう一度お試しください。`,
      accessDenied: '招待リンクから参加してください。',
    },
    meetingEnd: {
      backToMeeting: '会議ページに戻る',
      summaryTitle: '会議のまとめ',
      summaryHint: 'AIが会話からまとめました。間違いがあるかもしれないので、記録と合わせて確認してください。',
      finalizing: '最後の話までまとめています…',
      decidedTitle: '決まったこと',
      actionItemsTitle: 'やること',
      undecidedTitle: 'まだ決まっていないこと',
      owner: (name) => `担当 ${name}`,
      noOwner: '担当未定',
      emptyGroup: 'ありません',
      noOutcomeTitle: 'まだまとめる内容がありません',
      noOutcomeBody: '会議で決まったことや分担したことがここに集まります。',
      transcriptTitle: '会議の記録',
      noHistoryTitle: '記録された発言がありません',
      noHistoryBody: '会議中の発言と翻訳がここに表示されます。',
    },
  },

  my: {
    common: {
      languages: {
        ko: 'ကိုရီးယား',
        en: 'အင်္ဂလိပ်',
        ja: 'ဂျပန်',
        my: 'မြန်မာဘာသာ',
        ru: 'ရုရှား',
        es: 'စပိန်',
      },
      tryAgain: 'ထပ်စမ်းကြည့်ရန်',
      retry: 'ပြန်ကြိုးစားရန်',
      clear: 'ရှင်းလင်းရန်',
      close: 'ပိတ်ရန်',
    },
    login: {
      title: 'Loop မှ ကြိုဆိုပါတယ်!',
      subtitle: 'မည်သည့်ဘာသာစကားဖြင့်မဆို အဖွဲ့နှင့် ချိတ်ဆက်ပါ။',
      roomCodeLabel: 'အခန်းကုဒ်',
      roomCodePlaceholder: 'အခန်းကုဒ် ထည့်ပါ',
      nameLabel: 'အမည်',
      namePlaceholder: 'သင့်အမည် ထည့်ပါ',
      roleLabel: 'ရာထူး / အခန်းကဏ္ဍ',
      rolePlaceholder: 'ဥပမာ- PM, Designer, Developer',
      languageLabel: 'ကျွန်ုပ်၏ ဘာသာစကား',
      startButton: 'စတင်ရန်',
    },
    header: {
      switchRoom: 'အခန်းပြောင်းရန်',
      active: 'လက်ရှိ',
      endMeeting: 'အစည်းအဝေး ပြီးဆုံးရန်',
      backToMeetingPage: 'အစည်းအဝေး စာမျက်နှာသို့',
      roleSummary: (role, roomCode) => `ကဏ္ဍ: ${role} · အခန်း ${roomCode}`,
      meetingPage: 'အစည်းအဝေး စာမျက်နှာ',
      meetingEndPage: 'အစည်းအဝေး အဆုံးသတ် စာမျက်နှာ',
      targetLanguageAria: 'ဘာသာစကား ရွေးချယ်ရန်',
      exit: 'ထွက်ရန်',
      resumeMeeting: 'ပြန်စရန်',
      starting: 'စတင်နေသည်...',
    },
    transcript: {
      title: 'တိုက်ရိုက် စကားဝိုင်း ဘာသာပြန်မှု',
      startRecording: 'အသံဖမ်းရန်',
      stopRecording: 'အသံဖမ်း ရပ်ရန်',
      requestingMic: 'မိုက်ခရိုဖုန်း ခွင့်ပြုချက်...',
      micUnavailableTitle: 'မိုက်ခရိုဖုန်း အသုံးမပြုနိုင်ပါ',
      micErrors: {
        'permission-denied':
          'မိုက်ခရိုဖုန်း ခွင့်ပြုချက် ငြင်းပယ်ခံရပါသည်။ ဘရောက်ဇာ ဆက်တင်တွင် ခွင့်ပြုပြီး ထပ်စမ်းကြည့်ပါ။',
        'not-found':
          'မိုက်ခရိုဖုန်း မတွေ့ရှိပါ။ မိုက်ခရိုဖုန်း ချိတ်ဆက်ပြီး ထပ်စမ်းကြည့်ပါ။',
        'not-readable':
          'မိုက်ခရိုဖုန်းကို အခြားအက်ပ်က အသုံးပြုနေပါသည် သို့မဟုတ် ဖတ်မရပါ။',
        'not-supported':
          'ဤဘရောက်ဇာတွင် အသံဖမ်းယူမှုကို မပံ့ပိုးပါ။',
        unknown: 'မိုက်ခရိုဖုန်းသို့ ဝင်ရောက်၍ မရပါ။',
        lost:
          'မိုက်ခရိုဖုန်းမှ အသံ ပြတ်သွားပါသည်။ အခြားအက်ပ်က မိုက်ကို သုံးနေသလား၊ နားကြပ်ချိတ်ဆက်မှု ပြောင်းသွားသလား စစ်ဆေးပြီး ပြန်လည်အသံဖမ်းပါ။',
      },
      waitingPermission: 'ဘရောက်ဇာ မိုက်ခရိုဖုန်း ခွင့်ပြုချက်ကို စောင့်ဆိုင်းနေသည်...',
      recordingLocallyNotice: (speakerName) =>
        `${speakerName} အဖြစ် စက်ထဲတွင် အသံဖမ်းနေသည် (စာသားပြောင်းရန် မနှိပ်မချင်း အပ်လုဒ်မလုပ်ပါ)`,
      recordedPlaybackTitle: 'ဖမ်းယူထားသော အသံပြန်ဖွင့်ရန်',
      transcribeRecording: 'စာသားသို့ ပြောင်းရန်',
      transcribeAgain: 'ထပ်မံ ပြောင်းရန်',
      transcribing: 'စာသားပြောင်းနေသည်...',
      emptySpeechNotice:
        'ဤအသံဖိုင်တွင် ရှင်းလင်းသော စကားသံ မတွေ့ရှိပါ။ မိုက်ခရိုဖုန်းနှင့် နီးနီးပြောပြီး ထပ်မံအသံဖမ်းပါ။',
      unableToTranscribe: 'စာသားသို့ ပြောင်းလဲ၍ မရပါ။ ထပ်မံကြိုးစားပါ။',
      emptyStateTitle: 'တိုက်ရိုက် စာသားမှတ်တမ်း မရှိသေးပါ',
      emptyStateBody:
        'အသံဖမ်းရန် ကိုနှိပ်ပြီး ကိုရီးယား၊ အင်္ဂလိပ်၊ ဂျပန် သို့မဟုတ် မြန်မာဘာသာဖြင့် ပြောဆိုပါ။ ထို့နောက် အသံဖမ်း ရပ်ရန် နှင့် စာသားသို့ ပြောင်းရန် ကိုနှိပ်ပါ။',
    },
    stream: {
      demoButton: 'Demo စမ်းသပ်မှု',
      stopDemoButton: 'Demo ရပ်ရန်',
      states: {
        disconnected: 'ချိတ်ဆက်မှု မရှိသေးပါ',
        connecting: 'ချိတ်ဆက်နေသည်...',
        listening: 'တိုက်ရိုက် နားထောင်နေသည်',
        error: 'ချိတ်ဆက်မှု အမှား',
      },
      demoBanner:
        'DEMO စနစ် · UI စမ်းသပ်ရန် သရုပ်ပြစာသားသာ ဖြစ်သည် (မိုက်ခရိုဖုန်းအသံ အစစ်မဟုတ်ပါ)',
      liveStreamBanner: 'တိုက်ရိုက် စကားပြန်လွှင့်စနစ်နှင့် ချိတ်ဆက်ပြီး',
      disconnectedHint:
        'Backend စောင့်ဆိုင်းနေသည် · တိုက်ရိုက်စာတန်းစမ်းရန် Demo ကိုနှိပ်ပါ သို့မဟုတ် အသံဖမ်းပါ',
      interimBadge: 'ပြောနေသည်...',
      demoBadge: 'Demo',
      noBackendConfigured:
        'တိုက်ရိုက် WebSocket Backend မချိတ်ဆက်ရသေးပါ။ Demo စမ်းသပ်မှု သို့မဟုတ် အသံဖမ်းစနစ်ကို အသုံးပြုပါ။',
    },
    participants: {
      title: 'ပါဝင်သူများ',
      mockLabel: 'နမူနာ စာရင်း',
      speaking: 'ပြောနေသည်',
      selectedHint: 'အသေးစိတ်ကြည့်ရန် ကတ်ကို နှိပ်ပါ',
    },
    opinion: {
      title: 'အကြံပြု အမြင်များ',
      demoLabel: 'ဒမို',
      generating: 'အကြံပြုချက်များ ပြင်ဆင်နေသည်',
      emptyState:
        'ပြောဆိုရန် အခွင့်အရေးရောက်လာသောအခါ သဘောတူ၊ သဘောမတူ၊ အခြားအမြင် ဝါကျသုံးကြောင်းကို ချက်ချင်း အကြံပြုပေးပါမည်။',
      agree: 'သဘောတူ',
      disagree: 'သဘောမတူ',
      alternative: 'အခြားအမြင်',
      copied: 'ကူးယူပြီးပါပြီ',
      copyHint: 'နှိပ်၍ ကူးယူပါ',
    },
    anonymousOpinion: {
      title: 'အမည်မဖော်ဘဲ အမြင်တင်ပြရန်',
      description: 'သင့်အမည်မပါဘဲ တိုက်ရိုက်စကားဝိုင်းတွင် အမြင်ကို မျှဝေပါမည်။',
      placeholder: 'ပြောချင်သည်ကို ရေးပါ',
      submit: 'အမည်မဖော်ဘဲ တင်ပြမည်',
      cancel: 'မလုပ်တော့ပါ',
      submitted: 'အမည်မဖော်ဘဲ အမြင်ကို မျှဝေပြီးပါပြီ',
      anonymousSpeaker: 'အမည်မသိ',
      validationEmpty: 'မပို့မီ ထင်မြင်ချက်ကို ရေးသားပါ။',
      validationTooShort: 'အနည်းဆုံး စာလုံး ၂ လုံး ရေးပါ။',
      validationTooLong: 'စာလုံး ၄၀၀ ထက် မပိုစေရ။',
    },
    quickActions: {
      waitPlease: 'ခဏစောင့်ပေးပါ',
      anonymousOpinion: 'အမည်မဖော်ဘဲ အမြင်',
      waitSent: 'တောင်းဆိုချက် ပို့ပြီးပါပြီ',
      waitNotice: 'တစ်စုံတစ်ယောက်က ခဏစောင့်ပေးရန် တောင်းဆိုထားပါသည်',
    },
    context: {
      title: 'စကားဝိုင်း နောက်ခံအကြောင်းအရာ',
      demoLabel: 'ဒမို',
      currentTopic: 'လက်ရှိ ခေါင်းစဉ်',
      topicPending: 'ခေါင်းစဉ်ကို ရှာဖွေနေသည်',
      openQuestions: 'မဖြေရသေးသော မေးခွန်းများ',
      emptyState:
        'ပြောဆိုမှုများ စုလာသည်နှင့် ယခု ဘာအကြောင်း ပြောနေသည်ကို ခေါင်းစဉ်၊ သော့ချက်စကားလုံးနှင့် အနှစ်ချုပ်ဖြင့် စုစည်းပေးပါမည်။',
    },
    summary: {
      title: 'အနှစ်ချုပ်',
      subtitle: 'ယခုထိ ဆုံးဖြတ်ပြီးသည်များ',
      demoLabel: 'ဒမို',
      decided: 'ဆုံးဖြတ်ပြီးသည်',
      actionItems: 'လုပ်ရန်',
      undecided: 'မဆုံးဖြတ်ရသေးသည်',
      emptyColumn: 'မရှိသေးပါ',
      emptyState: 'အစည်းအဝေး ဆက်လက်သွားသည်နှင့် ဆုံးဖြတ်ချက်များ၊ လုပ်ရန်များနှင့် ကျန်ရှိသော ပြဿနာများကို ဤနေရာတွင် စုစည်းပြပါမည်။',
      collapse: 'ခေါက်ရန်',
      expand: 'ဖြန့်ရန်',
      noOwner: 'တာဝန်ခံ မသတ်မှတ်ရသေး',
    },
    chat: {
      placeholder: 'စာရိုက်၍ ပြောရန် (Enter ဖြင့် ပို့ပါ)',
      send: 'ပို့ရန်',
      badge: 'ချတ်',
    },
    speakers: {
      unassigned: (n) => `ပြောသူ ${n}`,
      assignTitle: 'ဤပြောသူသည် မည်သူနည်း?',
      assignLabel: (label) => `${label} ကို သတ်မှတ်ရန်`,
      me: (name) => `ကျွန်ုပ် (${name})`,
      clear: 'ဖယ်ရှားရန်',
      noParticipants: 'ပါဝင်သူ မရှိသေးပါ',
      assignHint: 'ပြောသူအမည်ကို နှိပ်၍ မည်သူဖြစ်ကြောင်း သတ်မှတ်နိုင်သည်',
    },
    live: {
      connectingServer: 'အစည်းအဝေး ဆာဗာသို့ ချိတ်ဆက်နေသည်...',
      serverUnavailable: 'အစည်းအဝေး ဆာဗာသို့ ချိတ်ဆက်၍ မရပါ။ ဆာဗာ ဖွင့်ထားခြင်း ရှိမရှိ စစ်ဆေးပါ။',
      recorderBusy: (name) => `${name || 'အခြားပါဝင်သူ'} က အသံဖမ်းနေပြီ ဖြစ်သည်`,
      recordingBy: (name) => `${name} အသံဖမ်းနေသည်`,
      sendFailed: 'ပို့၍ မရပါ။ ထပ်စမ်းကြည့်ပါ။',
      slowDown: (seconds) => `တောင်းဆိုမှု များလွန်းနေပါသည်။ ${seconds} စက္ကန့်အကြာတွင် ထပ်စမ်းကြည့်ပါ။`,
      accessDenied: 'ဖိတ်ကြားလင့်ခ်ဖြင့် ဝင်ရောက်ပါ။',
    },
    meetingEnd: {
      backToMeeting: 'အစည်းအဝေး စာမျက်နှာသို့ ပြန်သွားရန်',
      summaryTitle: 'အစည်းအဝေး အနှစ်ချုပ်',
      summaryHint: 'AI က စကားပြောဆိုမှုကို နားထောင်ပြီး စုစည်းထားပါသည်။ မှားနိုင်သဖြင့် မှတ်တမ်းနှင့် တိုက်စစ်ပါ။',
      finalizing: 'နောက်ဆုံးပြောခဲ့သည်များကို စုစည်းနေပါသည်…',
      decidedTitle: 'ဆုံးဖြတ်ပြီးသည်များ',
      actionItemsTitle: 'လုပ်ရန်များ',
      undecidedTitle: 'မဆုံးဖြတ်ရသေးသည်များ',
      owner: (name) => `တာဝန်ခံ ${name}`,
      noOwner: 'တာဝန်ခံ မသတ်မှတ်ရသေး',
      emptyGroup: 'မရှိပါ',
      noOutcomeTitle: 'စုစည်းစရာ မရှိသေးပါ',
      noOutcomeBody: 'အစည်းအဝေးတွင် ဆုံးဖြတ်ချက်များနှင့် လုပ်ရန်များ ဤနေရာတွင် စုစည်းပါမည်။',
      transcriptTitle: 'အစည်းအဝေး မှတ်တမ်း',
      noHistoryTitle: 'မှတ်တမ်းတင်ထားသည် မရှိပါ',
      noHistoryBody: 'အစည်းအဝေးအတွင်း ပြောဆိုချက်များနှင့် ဘာသာပြန်များ ဤနေရာတွင် ပေါ်ပါမည်။',
    },
  },

  ru: {
    common: {
      languages: {
        ko: 'Корейский',
        en: 'Английский',
        ja: 'Японский',
        my: 'Бирманский',
        ru: 'Русский',
        es: 'Испанский',
      },
      tryAgain: 'Повторить',
      retry: 'Повторить',
      clear: 'Очистить',
      close: 'Закрыть',
    },
    login: {
      title: 'Добро пожаловать в Loop!',
      subtitle: 'Общайтесь с командой на любом языке.',
      roomCodeLabel: 'Код комнаты',
      roomCodePlaceholder: 'Введите код комнаты',
      nameLabel: 'Имя',
      namePlaceholder: 'Введите ваше имя',
      roleLabel: 'Роль',
      rolePlaceholder: 'Напр.: PM, дизайнер, разработчик',
      languageLabel: 'Мой язык',
      startButton: 'Начать',
    },
    header: {
      switchRoom: 'Сменить комнату',
      active: 'Активна',
      endMeeting: 'Завершить встречу',
      backToMeetingPage: 'На страницу встречи',
      roleSummary: (role, roomCode) => `Роль: ${role} · Комната ${roomCode}`,
      meetingPage: 'Страница встречи',
      meetingEndPage: 'Итоги встречи',
      targetLanguageAria: 'Выбрать язык',
      exit: 'Выйти',
      resumeMeeting: 'Вернуться ко встрече',
      starting: 'Запуск...',
    },
    transcript: {
      title: 'Живой перевод беседы',
      startRecording: 'Начать запись',
      stopRecording: 'Остановить запись',
      requestingMic: 'Запрос микрофона...',
      micUnavailableTitle: 'Микрофон недоступен',
      micErrors: {
        'permission-denied':
          'Доступ к микрофону запрещён. Разрешите доступ в настройках браузера и попробуйте снова.',
        'not-found':
          'Микрофон не обнаружен. Подключите микрофон и повторите попытку.',
        'not-readable':
          'Микрофон занят другим приложением или недоступен для чтения.',
        'not-supported':
          'Запись аудио не поддерживается в этом браузере или контексте.',
        unknown: 'Не удалось получить доступ к микрофону.',
        lost:
          'Микрофон перестал передавать звук. Проверьте, не занят ли он другим приложением и не сменились ли наушники, затем начните запись снова.',
      },
      waitingPermission: 'Ожидание разрешения на использование микрофона...',
      recordingLocallyNotice: (speakerName) =>
        `Локальная запись от имени ${speakerName} (аудио не отправляется до расшифровки)`,
      recordedPlaybackTitle: 'Воспроизведение записи',
      transcribeRecording: 'Расшифровать запись',
      transcribeAgain: 'Расшифровать снова',
      transcribing: 'Расшифровка...',
      emptySpeechNotice:
        'Чёткая речь не обнаружена. Говорите ближе к микрофону и запишите ещё раз.',
      unableToTranscribe: 'Не удалось расшифровать запись. Попробуйте снова.',
      emptyStateTitle: 'Расшифровки пока нет',
      emptyStateBody:
        'Нажмите «Начать запись», произнесите фразу на корейском, английском, японском или бирманском, нажмите «Остановить запись», а затем «Расшифровать запись».',
    },
    stream: {
      demoButton: 'Демо-поток',
      stopDemoButton: 'Остановить демо',
      states: {
        disconnected: 'Поток отключён',
        connecting: 'Подключение...',
        listening: 'Прослушивание',
        error: 'Ошибка потока',
      },
      demoBanner:
        'ДЕМО-РЕЖИМ · Симуляция потока для проверки интерфейса (не реальный микрофон)',
      liveStreamBanner: 'Подключено к потоку живого перевода',
      disconnectedHint:
        'Ожидание бэкенда · Запустите Демо-поток для теста или используйте запись микрофона',
      interimBadge: 'Говорит...',
      demoBadge: 'Демо',
      noBackendConfigured:
        'Сервер WebSocket пока не подключён. Используйте Демо-поток или локальную запись.',
    },
    participants: {
      title: 'Участники',
      mockLabel: 'Пример списка',
      speaking: 'Говорит',
      selectedHint: 'Нажмите на карточку, чтобы посмотреть роль и язык',
    },
    opinion: {
      title: 'Варианты ответа',
      demoLabel: 'Демо',
      generating: 'Готовим варианты',
      emptyState:
        'Когда наступит момент высказаться, появятся три готовые фразы: согласие, несогласие и другое мнение.',
      agree: 'Согласие',
      disagree: 'Несогласие',
      alternative: 'Другое мнение',
      copied: 'Скопировано',
      copyHint: 'Нажмите, чтобы скопировать',
    },
    anonymousOpinion: {
      title: 'Анонимное мнение',
      description: 'Ваше мнение появится в разговоре без вашего имени.',
      placeholder: 'Напишите, что хотите сказать',
      submit: 'Отправить анонимно',
      cancel: 'Отмена',
      submitted: 'Анонимное мнение отправлено',
      anonymousSpeaker: 'Анонимно',
      validationEmpty: 'Введите текст мнения перед отправкой.',
      validationTooShort: 'Введите минимум 2 символа.',
      validationTooLong: 'Сократите мнение до 400 символов.',
    },
    quickActions: {
      waitPlease: 'Подождите, пожалуйста',
      anonymousOpinion: 'Анонимное мнение',
      waitSent: 'Запрос отправлен',
      waitNotice: 'Кто-то попросил немного подождать',
    },
    context: {
      title: 'Контекст разговора',
      demoLabel: 'Демо',
      currentTopic: 'Текущая тема',
      topicPending: 'Определяем тему',
      openQuestions: 'Открытые вопросы',
      emptyState:
        'Когда накопятся реплики, здесь появятся тема, ключевые слова и краткое содержание обсуждения.',
    },
    summary: {
      title: 'Итоги',
      subtitle: 'Что уже решено',
      demoLabel: 'Демо',
      decided: 'Решено',
      actionItems: 'Задачи',
      undecided: 'Ещё не решено',
      emptyColumn: 'Пока ничего',
      emptyState: 'По ходу встречи здесь будут собираться решения, задачи и открытые вопросы.',
      collapse: 'Свернуть',
      expand: 'Развернуть',
      noOwner: 'Без ответственного',
    },
    chat: {
      placeholder: 'Напишите сообщение (Enter — отправить)',
      send: 'Отправить',
      badge: 'Чат',
    },
    speakers: {
      unassigned: (n) => `Спикер ${n}`,
      assignTitle: 'Кто этот спикер?',
      assignLabel: (label) => `Указать: ${label}`,
      me: (name) => `Я (${name})`,
      clear: 'Сбросить',
      noParticipants: 'Пока никто не присоединился',
      assignHint: 'Нажмите на имя спикера, чтобы указать, кто это',
    },
    live: {
      connectingServer: 'Подключение к серверу встречи...',
      serverUnavailable: 'Не удаётся подключиться к серверу встречи. Проверьте, что он запущен.',
      recorderBusy: (name) => `${name || 'Другой участник'} уже ведёт запись`,
      recordingBy: (name) => `Запись: ${name}`,
      sendFailed: 'Не удалось отправить. Попробуйте ещё раз.',
      slowDown: (seconds) => `Слишком много запросов. Повторите через ${seconds} с.`,
      accessDenied: 'Войдите по ссылке-приглашению.',
    },
    meetingEnd: {
      backToMeeting: 'Назад ко встрече',
      summaryTitle: 'Итоги встречи',
      summaryHint: 'ИИ собрал это по ходу разговора. Возможны ошибки — сверьтесь с записью.',
      finalizing: 'Добавляем последнюю часть встречи…',
      decidedTitle: 'Решено',
      actionItemsTitle: 'Задачи',
      undecidedTitle: 'Пока не решено',
      owner: (name) => `Ответственный: ${name}`,
      noOwner: 'Ответственный не назначен',
      emptyGroup: 'Пусто',
      noOutcomeTitle: 'Пока нечего подводить',
      noOutcomeBody: 'Здесь соберутся решения и задачи со встречи.',
      transcriptTitle: 'Запись встречи',
      noHistoryTitle: 'Ничего не записано',
      noHistoryBody: 'Здесь появятся реплики и переводы со встречи.',
    },
  },

  es: {
    common: {
      languages: {
        ko: 'Coreano',
        en: 'Inglés',
        ja: 'Japonés',
        my: 'Birmano',
        ru: 'Ruso',
        es: 'Español',
      },
      tryAgain: 'Intentar de nuevo',
      retry: 'Reintentar',
      clear: 'Borrar',
      close: 'Cerrar',
    },
    login: {
      title: '¡Bienvenido a Loop!',
      subtitle: 'Conecta con tu equipo en cualquier idioma.',
      roomCodeLabel: 'Código de sala',
      roomCodePlaceholder: 'Ingresa el código de sala',
      nameLabel: 'Nombre',
      namePlaceholder: 'Ingresa tu nombre',
      roleLabel: 'Rol',
      rolePlaceholder: 'Ej.: PM, Diseñador, Desarrollador',
      languageLabel: 'Mi idioma',
      startButton: 'Comenzar',
    },
    header: {
      switchRoom: 'Cambiar sala',
      active: 'Activa',
      endMeeting: 'Finalizar reunión',
      backToMeetingPage: 'Volver a la reunión',
      roleSummary: (role, roomCode) => `Rol: ${role} · Sala ${roomCode}`,
      meetingPage: 'Página de reunión',
      meetingEndPage: 'Resumen final',
      targetLanguageAria: 'Seleccionar idioma',
      exit: 'Salir',
      resumeMeeting: 'Reanudar reunión',
      starting: 'Iniciando...',
    },
    transcript: {
      title: 'Traducción de conversación en vivo',
      startRecording: 'Iniciar grabación',
      stopRecording: 'Detener grabación',
      requestingMic: 'Solicitando mic...',
      micUnavailableTitle: 'Micrófono no disponible',
      micErrors: {
        'permission-denied':
          'Se denegó el acceso al micrófono. Permite el acceso en tu navegador e inténtalo de nuevo.',
        'not-found':
          'No se detectó ningún micrófono. Conecta un micrófono e inténtalo de nuevo.',
        'not-readable':
          'Otra aplicación está usando el micrófono o no se puede leer.',
        'not-supported':
          'La grabación de audio no es compatible con este navegador o contexto.',
        unknown: 'No se pudo acceder al micrófono.',
        lost:
          'El micrófono dejó de enviar sonido. Comprueba si otra app lo está usando o si cambiaron los auriculares, y vuelve a grabar.',
      },
      waitingPermission: 'Esperando el permiso del micrófono en el navegador...',
      recordingLocallyNotice: (speakerName) =>
        `Grabando localmente como ${speakerName} (no se sube hasta que transcribas)`,
      recordedPlaybackTitle: 'Reproducción del audio grabado',
      transcribeRecording: 'Transcribir grabación',
      transcribeAgain: 'Transcribir de nuevo',
      transcribing: 'Transcribiendo...',
      emptySpeechNotice:
        'No se detectó voz clara en esta grabación. Habla más cerca del micrófono y vuelve a grabar.',
      unableToTranscribe:
        'No se pudo transcribir la grabación. Inténtalo de nuevo.',
      emptyStateTitle: 'Aún no hay transcripción en vivo',
      emptyStateBody:
        'Haz clic en Iniciar grabación, habla en coreano, inglés, japonés o birmano, haz clic en Detener grabación y luego en Transcribir grabación.',
    },
    stream: {
      demoButton: 'Modo Demo',
      stopDemoButton: 'Detener Demo',
      states: {
        disconnected: 'Transmisión desconectada',
        connecting: 'Conectando...',
        listening: 'Escuchando en vivo',
        error: 'Error de transmisión',
      },
      demoBanner:
        'MODO DEMO · Texto simulado para probar la interfaz (no es audio real del micrófono)',
      liveStreamBanner: 'Conectado a la transmisión de traducción en vivo',
      disconnectedHint:
        'Listo para el backend · Usa Modo Demo para probar subtítulos en vivo o Inicia grabación',
      interimBadge: 'Hablando...',
      demoBadge: 'Demo',
      noBackendConfigured:
        'Aún no hay un servidor WebSocket conectado. Usa Modo Demo o la grabación local.',
    },
    participants: {
      title: 'Participantes',
      mockLabel: 'Lista de ejemplo',
      speaking: 'Hablando',
      selectedHint: 'Haz clic en una tarjeta para ver rol e idioma',
    },
    opinion: {
      title: 'Sugerencias de opinión',
      demoLabel: 'Demo',
      generating: 'Generando sugerencias',
      emptyState:
        'Cuando llegue un buen momento para opinar, verás tres frases listas: a favor, en contra y otra idea.',
      agree: 'A favor',
      disagree: 'En contra',
      alternative: 'Otra idea',
      copied: 'Copiado',
      copyHint: 'Toca para copiar',
    },
    anonymousOpinion: {
      title: 'Enviar opinión anónima',
      description: 'Tu opinión se comparte en la conversación en vivo sin tu nombre.',
      placeholder: 'Escribe lo que quieres decir',
      submit: 'Enviar de forma anónima',
      cancel: 'Cancelar',
      submitted: 'Se compartió tu opinión anónima',
      anonymousSpeaker: 'Anónimo',
      validationEmpty: 'Escribe una opinión antes de enviar.',
      validationTooShort: 'Escribe al menos 2 caracteres.',
      validationTooLong: 'Mantén la opinión por debajo de 400 caracteres.',
    },
    quickActions: {
      waitPlease: 'Espera un momento, por favor',
      anonymousOpinion: 'Opinión anónima',
      waitSent: 'Solicitud enviada',
      waitNotice: 'Alguien pidió esperar un momento',
    },
    context: {
      title: 'Contexto de la conversación',
      demoLabel: 'Demo',
      currentTopic: 'Tema actual',
      topicPending: 'Identificando el tema',
      openQuestions: 'Preguntas abiertas',
      emptyState:
        'A medida que avance la conversación, aquí verás el tema, las palabras clave y un resumen de lo que se está hablando.',
    },
    summary: {
      title: 'Resumen',
      subtitle: 'Lo decidido hasta ahora',
      demoLabel: 'Demo',
      decided: 'Decidido',
      actionItems: 'Tareas',
      undecided: 'Aún sin decidir',
      emptyColumn: 'Nada todavía',
      emptyState: 'A medida que avance la reunión, aquí se reunirán las decisiones, las tareas y los temas pendientes.',
      collapse: 'Contraer',
      expand: 'Expandir',
      noOwner: 'Sin responsable',
    },
    chat: {
      placeholder: 'Escribe un mensaje (Enter para enviar)',
      send: 'Enviar',
      badge: 'Chat',
    },
    speakers: {
      unassigned: (n) => `Hablante ${n}`,
      assignTitle: '¿Quién es este hablante?',
      assignLabel: (label) => `Indicar quién es ${label}`,
      me: (name) => `Yo (${name})`,
      clear: 'Quitar',
      noParticipants: 'Aún no se ha unido nadie',
      assignHint: 'Toca el nombre del hablante para indicar quién es',
    },
    live: {
      connectingServer: 'Conectando con el servidor de la reunión...',
      serverUnavailable: 'No se puede conectar con el servidor de la reunión. Comprueba que esté en marcha.',
      recorderBusy: (name) => `${name || 'Otra persona'} ya está grabando`,
      recordingBy: (name) => `Graba ${name}`,
      sendFailed: 'No se pudo enviar. Inténtalo de nuevo.',
      slowDown: (seconds) => `Demasiadas solicitudes. Inténtalo de nuevo en ${seconds} s.`,
      accessDenied: 'Únete con el enlace de invitación.',
    },
    meetingEnd: {
      backToMeeting: 'Volver a la reunión',
      summaryTitle: 'Resumen de la reunión',
      summaryHint: 'La IA lo preparó a partir de la conversación. Puede tener errores; compáralo con la transcripción.',
      finalizing: 'Añadiendo la última parte de la reunión…',
      decidedTitle: 'Decidido',
      actionItemsTitle: 'Tareas',
      undecidedTitle: 'Sin decidir',
      owner: (name) => `Responsable: ${name}`,
      noOwner: 'Sin responsable',
      emptyGroup: 'Nada aquí',
      noOutcomeTitle: 'Aún no hay nada que resumir',
      noOutcomeBody: 'Aquí se reunirán las decisiones y tareas de la reunión.',
      transcriptTitle: 'Transcripción',
      noHistoryTitle: 'No se grabó nada',
      noHistoryBody: 'Aquí aparecen lo dicho en la reunión y sus traducciones.',
    },
  },
};
