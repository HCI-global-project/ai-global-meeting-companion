import type { RecorderErrorCode } from "../hooks/useMicrophoneRecorder";
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
    startMeeting: string;
  };
  transcript: {
    title: string;
    startRecording: string;
    stopRecording: string;
    requestingMic: string;
    micUnavailableTitle: string;
    micErrors: Record<RecorderErrorCode, string>;
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
    speechRecognizedPendingTranslation: (targetLangLabel: string) => string;
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
    awaitingTranslation: string;
    noBackendConfigured: string;
  };
  participants: {
    title: string;
    mockLabel: string;
    speaking: string;
    selectedHint: string;
  };
  shareOpinion: {
    title: string;
    closeAria: string;
    openAria: string;
    placeholder: (name: string) => string;
    aiDraft: string;
    askScope: string;
    send: string;
    submitAnonymously: string;
    anonymousSpeaker: string;
    validationEmpty: string;
    validationTooShort: string;
    validationTooLong: string;
    submittedBanner: string;
    submittedAnonymouslyBanner: string;
    shareAnother: string;
    submittedHistoryLabel: (count: number) => string;
    aiSuggestedNote: string;
    aiRefinedNote: string;
    previewLabel: (langCode: string, text: string) => string;
  };
  context: {
    title: string;
    mockLabel: string;
    collapseAria: string;
    openAria: string;
  };
  summary: {
    title: string;
    hideSummary: string;
    generateSummary: string;
    endMeeting: string;
    demoSummaryLabel: string;
    sessionSummaryLabel: string;
    emptyState: string;
    speakersSummary: (speakers: string, count: number) => string;
    latestTopic: (speaker: string, snippet: string) => string;
    opinionSummary: (count: number) => string;
  };
  meetingEnd: {
    backToMeeting: string;
    notesTitle: string;
    collapseNotesAria: string;
    openNotesAria: string;
    noNotesTitle: string;
    noNotesBody: string;
    addNotePlaceholder: (name: string) => string;
    addNoteButton: string;
    noteValidationEmpty: string;
    translationHistoryTitle: string;
    collapseHistoryAria: string;
    openHistoryAria: string;
    noHistoryTitle: string;
    noHistoryBody: string;
    reviewDecisionsTitle: string;
    collapseDecisionsAria: string;
    openDecisionsAria: string;
    noDecisionsTitle: string;
    noDecisionsBody: string;
    addDecisionPlaceholder: string;
    addDecisionButton: string;
    decisionValidationEmpty: string;
    loadSampleDemo: string;
    ownerPrefix: string;
    statusConfirmed: string;
    statusPending: string;
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
      startMeeting: 'Start meeting',
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
      speechRecognizedPendingTranslation: (targetLangLabel) =>
        `Original text recorded · Translation to ${targetLangLabel} awaits live backend`,
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
      awaitingTranslation: 'Translating...',
      noBackendConfigured:
        'No live WebSocket backend URL is connected yet. Use Demo Stream to preview streaming UI or Start Recording for local transcription.',
    },
    participants: {
      title: 'Participants',
      mockLabel: 'Sample roster',
      speaking: 'Speaking',
      selectedHint: 'Click a card to inspect role & language',
    },
    shareOpinion: {
      title: 'Share opinion',
      closeAria: 'Close opinion composer',
      openAria: 'Open Share opinion composer',
      placeholder: (name) => `Share your thought as ${name}...`,
      aiDraft: 'AI Draft',
      askScope: 'Ask scope',
      send: 'Send',
      submitAnonymously: 'Submit anonymously',
      anonymousSpeaker: 'Anonymous',
      validationEmpty: 'Please write an opinion before sending.',
      validationTooShort: 'Please enter at least 2 characters.',
      validationTooLong: 'Keep opinions under 400 characters.',
      submittedBanner: 'Opinion shared to live transcript',
      submittedAnonymouslyBanner: 'Opinion shared anonymously to live transcript',
      shareAnother: 'Share another opinion',
      submittedHistoryLabel: (count) => `Submitted in this session (${count})`,
      aiSuggestedNote:
        'AI suggested a concise phrasing ready for multilingual broadcast.',
      aiRefinedNote: 'AI refined tone for clear cross-language translation.',
      previewLabel: (langCode, text) => `Preview (${langCode}): ${text}`,
    },
    context: {
      title: 'Conversation Context',
      mockLabel: 'Sample docs',
      collapseAria: 'Collapse conversation context',
      openAria: 'Open Conversation Context documents',
    },
    summary: {
      title: 'Summary',
      hideSummary: 'Hide summary',
      generateSummary: 'Generate summary',
      endMeeting: 'End Meeting',
      demoSummaryLabel: 'Demo stream summary',
      sessionSummaryLabel: 'Current session summary',
      emptyState:
        'No meeting transcript yet. Record speech, share an opinion, or run Demo Stream to summarize this session.',
      speakersSummary: (speakers, count) =>
        `Active speakers (${count} entries): ${speakers}`,
      latestTopic: (speaker, snippet) => `Latest from ${speaker}: "${snippet}"`,
      opinionSummary: (count) => `Shared opinions in session: ${count}`,
    },
    meetingEnd: {
      backToMeeting: 'Back to Meeting Page',
      notesTitle: 'Meeting Notes',
      collapseNotesAria: 'Collapse notes',
      openNotesAria: 'Open Notes editor',
      noNotesTitle: 'No meeting notes added yet',
      noNotesBody: 'Capture key takeaways or follow-ups for this meeting below.',
      addNotePlaceholder: (name) => `Add a shared note as ${name}...`,
      addNoteButton: 'Add Note',
      noteValidationEmpty: 'Please enter a note before adding.',
      translationHistoryTitle: 'Translation History',
      collapseHistoryAria: 'Collapse translation history',
      openHistoryAria: 'Open Translation History',
      noHistoryTitle: 'No translated entries recorded yet',
      noHistoryBody:
        'Transcribed speech and translation history will appear here.',
      reviewDecisionsTitle: 'Review Decisions',
      collapseDecisionsAria: 'Collapse review decisions',
      openDecisionsAria: 'Open Review Decisions',
      noDecisionsTitle: 'No decisions recorded yet',
      noDecisionsBody:
        'Add action items or decisions from this meeting and click any item to toggle its confirmation status.',
      addDecisionPlaceholder: 'Add a meeting decision or action item...',
      addDecisionButton: 'Add Decision',
      decisionValidationEmpty: 'Please enter a decision title first.',
      loadSampleDemo: 'Load sample demo',
      ownerPrefix: 'Owner:',
      statusConfirmed: 'Confirmed',
      statusPending: 'Pending Review',
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
      startMeeting: '회의 시작',
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
      speechRecognizedPendingTranslation: (targetLangLabel) =>
        `원문 기록됨 · ${targetLangLabel} 번역은 실시간 백엔드 연결 후 표시됩니다`,
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
      awaitingTranslation: '번역 중...',
      noBackendConfigured:
        '실시간 WebSocket 백엔드가 아직 연결되지 않았습니다. 데모 스트림 또는 로컬 녹음을 이용해 주세요.',
    },
    participants: {
      title: '참여자',
      mockLabel: '샘플 참여자',
      speaking: '발화 중',
      selectedHint: '카드를 클릭해 역할과 언어를 확인하세요',
    },
    shareOpinion: {
      title: '의견 공유',
      closeAria: '의견 작성기 닫기',
      openAria: '의견 공유 작성기 열기',
      placeholder: (name) => `${name}님으로 의견을 입력해 주세요...`,
      aiDraft: 'AI 초안',
      askScope: '범위 질문',
      send: '보내기',
      submitAnonymously: '익명으로 제출',
      anonymousSpeaker: '익명',
      validationEmpty: '전송하기 전에 의견을 입력해 주세요.',
      validationTooShort: '최소 2자 이상 입력해 주세요.',
      validationTooLong: '의견은 400자 이내로 작성해 주세요.',
      submittedBanner: '실시간 대화창에 의견이 공유되었습니다',
      submittedAnonymouslyBanner: '익명으로 실시간 대화창에 의견이 공유되었습니다',
      shareAnother: '다른 의견 작성',
      submittedHistoryLabel: (count) => `이번 세션에 제출한 의견 (${count})`,
      aiSuggestedNote: '다국어 공유에 알맞은 간결한 문장을 AI가 제안했습니다.',
      aiRefinedNote: '명확한 번역을 위해 AI가 문장을 다듬었습니다.',
      previewLabel: (langCode, text) => `미리보기 (${langCode}): ${text}`,
    },
    context: {
      title: '대화 맥락',
      mockLabel: '샘플 문서',
      collapseAria: '대화 맥락 접기',
      openAria: '대화 맥락 문서 열기',
    },
    summary: {
      title: '요약',
      hideSummary: '요약 숨기기',
      generateSummary: '요약 생성',
      endMeeting: '회의 종료',
      demoSummaryLabel: '데모 스트림 요약',
      sessionSummaryLabel: '현재 회의 세션 요약',
      emptyState:
        '아직 기록된 대화가 없습니다. 음성을 녹음하거나 의견을 공유하거나 데모 스트림을 실행해 요약을 확인하세요.',
      speakersSummary: (speakers, count) =>
        `참여 발화자 (${count}건): ${speakers}`,
      latestTopic: (speaker, snippet) => `최근 발화 (${speaker}): "${snippet}"`,
      opinionSummary: (count) => `세션 내 공유된 의견: ${count}건`,
    },
    meetingEnd: {
      backToMeeting: '회의 페이지로 돌아가기',
      notesTitle: '회의 노트',
      collapseNotesAria: '노트 접기',
      openNotesAria: '노트 편집기 열기',
      noNotesTitle: '아직 작성된 회의 노트가 없습니다',
      noNotesBody: '아래 입력란에 이번 회의의 핵심 내용과 후속 작업을 남겨 보세요.',
      addNotePlaceholder: (name) => `${name}님으로 공유 노트를 추가하세요...`,
      addNoteButton: '노트 추가',
      noteValidationEmpty: '추가할 노트 내용을 입력해 주세요.',
      translationHistoryTitle: '번역 기록',
      collapseHistoryAria: '번역 기록 접기',
      openHistoryAria: '번역 기록 열기',
      noHistoryTitle: '아직 기록된 번역 내역이 없습니다',
      noHistoryBody: '음성 인식 및 번역 기록이 여기에 표시됩니다.',
      reviewDecisionsTitle: '결정 사항 검토',
      collapseDecisionsAria: '결정 사항 접기',
      openDecisionsAria: '결정 사항 열기',
      noDecisionsTitle: '아직 등록된 결정 사항이 없습니다',
      noDecisionsBody:
        '이번 회의에서 정해진 결정 사항을 추가하고 클릭해 확정 상태를 전환할 수 있습니다.',
      addDecisionPlaceholder: '회의 결정 사항 또는 실행 항목 입력...',
      addDecisionButton: '결정 추가',
      decisionValidationEmpty: '결정 사항 제목을 입력해 주세요.',
      loadSampleDemo: '샘플 데모 불러오기',
      ownerPrefix: '담당:',
      statusConfirmed: '확정됨',
      statusPending: '검토 대기',
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
      startMeeting: '会議を開始',
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
      speechRecognizedPendingTranslation: (targetLangLabel) =>
        `原文を記録しました · ${targetLangLabel}への翻訳はバックエンド接続後に表示されます`,
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
      awaitingTranslation: '翻訳中...',
      noBackendConfigured:
        'ライブWebSocketバックエンドが未接続です。デモ配信またはローカル録音をご利用ください。',
    },
    participants: {
      title: '参加者',
      mockLabel: 'サンプル参加者',
      speaking: '発話中',
      selectedHint: 'カードをクリックして役割と言語を表示',
    },
    shareOpinion: {
      title: '意見を共有',
      closeAria: '意見入力を閉じる',
      openAria: '意見共有を開く',
      placeholder: (name) => `${name} として意見を入力...`,
      aiDraft: 'AI下書き',
      askScope: '範囲を確認',
      send: '送信',
      submitAnonymously: '匿名で送信',
      anonymousSpeaker: '匿名',
      validationEmpty: '送信する前に意見を入力してください。',
      validationTooShort: '2文字以上入力してください。',
      validationTooLong: '意見は400文字以内で入力してください。',
      submittedBanner: 'ライブ会話に意見を共有しました',
      submittedAnonymouslyBanner: '匿名でライブ会話に意見を共有しました',
      shareAnother: '別の意見を入力',
      submittedHistoryLabel: (count) => `このセッションで送信済み (${count})`,
      aiSuggestedNote: '多言語配信に適した簡潔な表現をAIが提案しました。',
      aiRefinedNote: '翻訳しやすいようにAIが表現を整えました。',
      previewLabel: (langCode, text) => `プレビュー (${langCode}): ${text}`,
    },
    context: {
      title: '会話のコンテキスト',
      mockLabel: 'サンプル資料',
      collapseAria: '会話コンテキストを閉じる',
      openAria: '会話コンテキストを開く',
    },
    summary: {
      title: '要約',
      hideSummary: '要約を隠す',
      generateSummary: '要約を生成',
      endMeeting: '会議を終了',
      demoSummaryLabel: 'デモ配信の要約',
      sessionSummaryLabel: '現在の会議要約',
      emptyState:
        'まだ文字起こしがありません。録音、意見の共有、またはデモ配信を実行するとここに要約が表示されます。',
      speakersSummary: (speakers, count) =>
        `発話者 (${count}件): ${speakers}`,
      latestTopic: (speaker, snippet) => `最新の発言 (${speaker}): 「${snippet}」`,
      opinionSummary: (count) => `共有された意見: ${count}件`,
    },
    meetingEnd: {
      backToMeeting: '会議ページに戻る',
      notesTitle: '会議ノート',
      collapseNotesAria: 'ノートを閉じる',
      openNotesAria: 'ノートエディタを開く',
      noNotesTitle: 'まだ会議ノートはありません',
      noNotesBody: 'この会議のメモや次のアクションを下から追加できます。',
      addNotePlaceholder: (name) => `${name} として共有ノートを追加...`,
      addNoteButton: 'ノートを追加',
      noteValidationEmpty: '追加するノートの内容を入力してください。',
      translationHistoryTitle: '翻訳履歴',
      collapseHistoryAria: '翻訳履歴を閉じる',
      openHistoryAria: '翻訳履歴を開く',
      noHistoryTitle: '翻訳履歴はまだありません',
      noHistoryBody: '文字起こしされた発言と翻訳履歴がここに表示されます。',
      reviewDecisionsTitle: '決定事項の確認',
      collapseDecisionsAria: '決定事項を閉じる',
      openDecisionsAria: '決定事項を開く',
      noDecisionsTitle: 'まだ決定事項はありません',
      noDecisionsBody:
        'この会議の決定事項を追加し、クリックして確定ステータスを切り替えられます。',
      addDecisionPlaceholder: '決定事項またはアクション項目を入力...',
      addDecisionButton: '決定を追加',
      decisionValidationEmpty: '決定事項のタイトルを入力してください。',
      loadSampleDemo: 'サンプルデモを読み込む',
      ownerPrefix: '担当:',
      statusConfirmed: '確定済み',
      statusPending: '確認待ち',
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
      startMeeting: 'အစည်းအဝေး စတင်ရန်',
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
      speechRecognizedPendingTranslation: (targetLangLabel) =>
        `မူရင်းစာသား မှတ်တမ်းတင်ပြီး · ${targetLangLabel} ဘာသာပြန်မှုကို Backend ချိတ်ဆက်ပြီးနောက် ပြသပါမည်`,
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
      awaitingTranslation: 'ဘာသာပြန်နေသည်...',
      noBackendConfigured:
        'တိုက်ရိုက် WebSocket Backend မချိတ်ဆက်ရသေးပါ။ Demo စမ်းသပ်မှု သို့မဟုတ် အသံဖမ်းစနစ်ကို အသုံးပြုပါ။',
    },
    participants: {
      title: 'ပါဝင်သူများ',
      mockLabel: 'နမူနာ စာရင်း',
      speaking: 'ပြောနေသည်',
      selectedHint: 'အသေးစိတ်ကြည့်ရန် ကတ်ကို နှိပ်ပါ',
    },
    shareOpinion: {
      title: 'ထင်မြင်ချက် မျှဝေရန်',
      closeAria: 'ထင်မြင်ချက် ရေးသားခြင်း ပိတ်ရန်',
      openAria: 'ထင်မြင်ချက် မျှဝေရန် ဖွင့်ရန်',
      placeholder: (name) => `${name} အဖြစ် သင့်အမြင်ကို ရေးပါ...`,
      aiDraft: 'AI မူကြမ်း',
      askScope: 'နယ်ပယ် မေးရန်',
      send: 'ပို့ရန်',
      submitAnonymously: 'အမည်မဖော်ဘဲ ပေးပို့ရန်',
      anonymousSpeaker: 'အမည်မသိ',
      validationEmpty: 'မပို့မီ ထင်မြင်ချက်ကို ရေးသားပါ။',
      validationTooShort: 'အနည်းဆုံး စာလုံး ၂ လုံး ရေးပါ။',
      validationTooLong: 'စာလုံး ၄၀၀ ထက် မပိုစေရ။',
      submittedBanner: 'တိုက်ရိုက်စကားဝိုင်းသို့ ထင်မြင်ချက် မျှဝေပြီးပါပြီ',
      submittedAnonymouslyBanner: 'အမည်မဖော်ဘဲ ထင်မြင်ချက် မျှဝေပြီးပါပြီ',
      shareAnother: 'နောက်ထပ် ထင်မြင်ချက် ရေးရန်',
      submittedHistoryLabel: (count) => `ဤအစည်းအဝေးတွင် ပို့ပြီးသား (${count})`,
      aiSuggestedNote:
        'ဘာသာစကားစုံ မျှဝေရန် သင့်တော်သော ဝါကျကို AI က အကြံပြုထားပါသည်။',
      aiRefinedNote: 'ရှင်းလင်းစွာ ဘာသာပြန်နိုင်ရန် AI က စာသားကို ပြင်ဆင်ပြီးပါပြီ။',
      previewLabel: (langCode, text) => `အစမ်းကြည့် (${langCode}): ${text}`,
    },
    context: {
      title: 'စကားဝိုင်း နောက်ခံအချက်အလက်',
      mockLabel: 'နမူနာ ဖိုင်များ',
      collapseAria: 'စကားဝိုင်း နောက်ခံအချက်အလက် ပိတ်ရန်',
      openAria: 'စကားဝိုင်း နောက်ခံအချက်အလက် ဖွင့်ရန်',
    },
    summary: {
      title: 'အကျဉ်းချုပ်',
      hideSummary: 'အကျဉ်းချုပ် ဝှက်ရန်',
      generateSummary: 'အကျဉ်းချုပ် ထုတ်ရန်',
      endMeeting: 'အစည်းအဝေး ပြီးဆုံးရန်',
      demoSummaryLabel: 'Demo စမ်းသပ်မှု အကျဉ်းချုပ်',
      sessionSummaryLabel: 'လက်ရှိအစည်းအဝေး အကျဉ်းချုပ်',
      emptyState:
        'စကားဝိုင်း မှတ်တမ်း မရှိသေးပါ။ အသံဖမ်းခြင်း၊ ထင်မြင်ချက် မျှဝေခြင်း သို့မဟုတ် Demo စမ်းသပ်မှု ပြုလုပ်ပါ။',
      speakersSummary: (speakers, count) =>
        `ပါဝင်ပြောဆိုသူများ (${count} ခု): ${speakers}`,
      latestTopic: (speaker, snippet) => `နောက်ဆုံးပြောချက် (${speaker}): "${snippet}"`,
      opinionSummary: (count) => `မျှဝေထားသော ထင်မြင်ချက်များ: ${count}`,
    },
    meetingEnd: {
      backToMeeting: 'အစည်းအဝေး စာမျက်နှာသို့ ပြန်သွားရန်',
      notesTitle: 'အစည်းအဝေး မှတ်စုများ',
      collapseNotesAria: 'မှတ်စု ပိတ်ရန်',
      openNotesAria: 'မှတ်စု တည်းဖြတ်ရန် ဖွင့်ရန်',
      noNotesTitle: 'အစည်းအဝေး မှတ်စု မရှိသေးပါ',
      noNotesBody: 'အောက်တွင် ဤအစည်းအဝေးအတွက် မှတ်စုများ ထည့်သွင်းနိုင်ပါသည်။',
      addNotePlaceholder: (name) => `${name} အဖြစ် မျှဝေမှတ်စု ထည့်ပါ...`,
      addNoteButton: 'မှတ်စု ထည့်ရန်',
      noteValidationEmpty: 'မှတ်စုစာသားကို ရေးထည့်ပါ။',
      translationHistoryTitle: 'ဘာသာပြန် မှတ်တမ်း',
      collapseHistoryAria: 'ဘာသာပြန် မှတ်တမ်း ပိတ်ရန်',
      openHistoryAria: 'ဘာသာပြန် မှတ်တမ်း ဖွင့်ရန်',
      noHistoryTitle: 'ဘာသာပြန် မှတ်တမ်း မရှိသေးပါ',
      noHistoryBody: 'စာသားပြောင်းထားသော စကားများနှင့် ဘာသာပြန်မှတ်တမ်း ဤနေရာတွင် ပေါ်လာပါမည်။',
      reviewDecisionsTitle: 'ဆုံးဖြတ်ချက်များ စစ်ဆေးရန်',
      collapseDecisionsAria: 'ဆုံးဖြတ်ချက်များ ပိတ်ရန်',
      openDecisionsAria: 'ဆုံးဖြတ်ချက်များ ဖွင့်ရန်',
      noDecisionsTitle: 'ဆုံးဖြတ်ချက်များ မရှိသေးပါ',
      noDecisionsBody:
        'ဆုံးဖြတ်ချက်အသစ် ထည့်သွင်းပြီး အတည်ပြုမှု အခြေအနေကို ပြောင်းလဲရန် နှိပ်ပါ။',
      addDecisionPlaceholder: 'ဆုံးဖြတ်ချက် သို့မဟုတ် လုပ်ဆောင်ရန် အချက်ထည့်ပါ...',
      addDecisionButton: 'ဆုံးဖြတ်ချက် ထည့်ရန်',
      decisionValidationEmpty: 'ဆုံးဖြတ်ချက် ခေါင်းစဉ်ကို ရေးထည့်ပါ။',
      loadSampleDemo: 'နမူနာ Demo ထည့်ရန်',
      ownerPrefix: 'တာဝန်ခံ:',
      statusConfirmed: 'အတည်ပြုပြီး',
      statusPending: 'စစ်ဆေးရန် ကျန်',
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
      startMeeting: 'Начать встречу',
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
      speechRecognizedPendingTranslation: (targetLangLabel) =>
        `Текст записан · Перевод на ${targetLangLabel} появится после подключения бэкенда`,
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
      awaitingTranslation: 'Перевод...',
      noBackendConfigured:
        'Сервер WebSocket пока не подключён. Используйте Демо-поток или локальную запись.',
    },
    participants: {
      title: 'Участники',
      mockLabel: 'Пример списка',
      speaking: 'Говорит',
      selectedHint: 'Нажмите на карточку, чтобы посмотреть роль и язык',
    },
    shareOpinion: {
      title: 'Поделиться мнением',
      closeAria: 'Закрыть редактор мнения',
      openAria: 'Открыть редактор мнения',
      placeholder: (name) => `Поделитесь мыслью от имени ${name}...`,
      aiDraft: 'Черновик ИИ',
      askScope: 'Уточнить объём',
      send: 'Отправить',
      submitAnonymously: 'Отправить анонимно',
      anonymousSpeaker: 'Анонимно',
      validationEmpty: 'Введите текст мнения перед отправкой.',
      validationTooShort: 'Введите минимум 2 символа.',
      validationTooLong: 'Сократите мнение до 400 символов.',
      submittedBanner: 'Мнение добавлено в ленту встречи',
      submittedAnonymouslyBanner: 'Мнение добавлено анонимно в ленту встречи',
      shareAnother: 'Добавить ещё мнение',
      submittedHistoryLabel: (count) => `Отправлено в этой сессии (${count})`,
      aiSuggestedNote: 'ИИ предложил лаконичную формулировку для перевода.',
      aiRefinedNote: 'ИИ уточнил тон для точного перевода на другие языки.',
      previewLabel: (langCode, text) => `Предпросмотр (${langCode}): ${text}`,
    },
    context: {
      title: 'Контекст беседы',
      mockLabel: 'Примеры',
      collapseAria: 'Свернуть контекст беседы',
      openAria: 'Открыть контекст беседы',
    },
    summary: {
      title: 'Итоги',
      hideSummary: 'Скрыть итоги',
      generateSummary: 'Создать итоги',
      endMeeting: 'Завершить встречу',
      demoSummaryLabel: 'Итоги демо-потока',
      sessionSummaryLabel: 'Итоги текущей встречи',
      emptyState:
        'Записей пока нет. Запишите речь, отправьте мнение или запустите Демо-поток для сводки.',
      speakersSummary: (speakers, count) =>
        `Участники (${count} зап.): ${speakers}`,
      latestTopic: (speaker, snippet) => `Последняя реплика (${speaker}): «${snippet}»`,
      opinionSummary: (count) => `Отправлено мнений в сессии: ${count}`,
    },
    meetingEnd: {
      backToMeeting: 'Назад ко встрече',
      notesTitle: 'Заметки встречи',
      collapseNotesAria: 'Свернуть заметки',
      openNotesAria: 'Открыть редактор заметок',
      noNotesTitle: 'Заметок пока нет',
      noNotesBody: 'Добавьте общие заметки или следующие шаги для этой встречи ниже.',
      addNotePlaceholder: (name) => `Добавить заметку от имени ${name}...`,
      addNoteButton: 'Добавить заметку',
      noteValidationEmpty: 'Введите текст заметки.',
      translationHistoryTitle: 'История переводов',
      collapseHistoryAria: 'Свернуть историю переводов',
      openHistoryAria: 'Открыть историю переводов',
      noHistoryTitle: 'Записей пока нет',
      noHistoryBody: 'Здесь появится распознанная речь и история переводов.',
      reviewDecisionsTitle: 'Решения встречи',
      collapseDecisionsAria: 'Свернуть решения',
      openDecisionsAria: 'Открыть решения',
      noDecisionsTitle: 'Решений пока нет',
      noDecisionsBody:
        'Добавьте решение по итогам встречи и нажмите на него, чтобы изменить статус.',
      addDecisionPlaceholder: 'Добавить решение или задачу...',
      addDecisionButton: 'Добавить решение',
      decisionValidationEmpty: 'Введите название решения.',
      loadSampleDemo: 'Загрузить пример',
      ownerPrefix: 'Ответственный:',
      statusConfirmed: 'Подтверждено',
      statusPending: 'На проверке',
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
      startMeeting: 'Iniciar reunión',
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
      speechRecognizedPendingTranslation: (targetLangLabel) =>
        `Texto original registrado · La traducción al ${targetLangLabel} espera conexión al backend`,
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
      awaitingTranslation: 'Traduciendo...',
      noBackendConfigured:
        'Aún no hay un servidor WebSocket conectado. Usa Modo Demo o la grabación local.',
    },
    participants: {
      title: 'Participantes',
      mockLabel: 'Lista de ejemplo',
      speaking: 'Hablando',
      selectedHint: 'Haz clic en una tarjeta para ver rol e idioma',
    },
    shareOpinion: {
      title: 'Compartir opinión',
      closeAria: 'Cerrar redactor de opinión',
      openAria: 'Abrir redactor de opinión',
      placeholder: (name) => `Comparte tu idea como ${name}...`,
      aiDraft: 'Borrador IA',
      askScope: 'Consultar alcance',
      send: 'Enviar',
      submitAnonymously: 'Enviar de forma anónima',
      anonymousSpeaker: 'Anónimo',
      validationEmpty: 'Escribe una opinión antes de enviar.',
      validationTooShort: 'Escribe al menos 2 caracteres.',
      validationTooLong: 'Mantén la opinión por debajo de 400 caracteres.',
      submittedBanner: 'Opinión compartida en la transcripción en vivo',
      submittedAnonymouslyBanner:
        'Opinión compartida de forma anónima en la transcripción',
      shareAnother: 'Compartir otra opinión',
      submittedHistoryLabel: (count) => `Enviadas en esta sesión (${count})`,
      aiSuggestedNote:
        'La IA sugirió una redacción concisa lista para difusión multilingüe.',
      aiRefinedNote:
        'La IA refinó el tono para una traducción clara entre idiomas.',
      previewLabel: (langCode, text) => `Vista previa (${langCode}): ${text}`,
    },
    context: {
      title: 'Contexto de la conversación',
      mockLabel: 'Documentos de ejemplo',
      collapseAria: 'Contraer contexto de conversación',
      openAria: 'Abrir documentos de contexto',
    },
    summary: {
      title: 'Resumen',
      hideSummary: 'Ocultar resumen',
      generateSummary: 'Generar resumen',
      endMeeting: 'Finalizar reunión',
      demoSummaryLabel: 'Resumen del modo demo',
      sessionSummaryLabel: 'Resumen de la sesión actual',
      emptyState:
        'Aún no hay transcripción. Graba audio, comparte una opinión o ejecuta Modo Demo para resumir la sesión.',
      speakersSummary: (speakers, count) =>
        `Participantes activos (${count} entradas): ${speakers}`,
      latestTopic: (speaker, snippet) => `Último comentario (${speaker}): "${snippet}"`,
      opinionSummary: (count) => `Opiniones compartidas en la sesión: ${count}`,
    },
    meetingEnd: {
      backToMeeting: 'Volver a la reunión',
      notesTitle: 'Notas de la reunión',
      collapseNotesAria: 'Contraer notas',
      openNotesAria: 'Abrir editor de notas',
      noNotesTitle: 'Aún no hay notas de la reunión',
      noNotesBody: 'Agrega acuerdos o notas compartidas de esta reunión abajo.',
      addNotePlaceholder: (name) => `Agrega una nota compartida como ${name}...`,
      addNoteButton: 'Agregar nota',
      noteValidationEmpty: 'Escribe una nota antes de agregarla.',
      translationHistoryTitle: 'Historial de traducción',
      collapseHistoryAria: 'Contraer historial de traducción',
      openHistoryAria: 'Abrir historial de traducción',
      noHistoryTitle: 'Aún no hay entradas registradas',
      noHistoryBody:
        'El texto reconocido y su historial de traducción aparecerán aquí.',
      reviewDecisionsTitle: 'Revisar decisiones',
      collapseDecisionsAria: 'Contraer decisiones',
      openDecisionsAria: 'Abrir decisiones',
      noDecisionsTitle: 'Aún no hay decisiones registradas',
      noDecisionsBody:
        'Agrega decisiones de esta reunión y haz clic en cualquiera para cambiar su estado.',
      addDecisionPlaceholder: 'Agregar una decisión o acción...',
      addDecisionButton: 'Agregar decisión',
      decisionValidationEmpty: 'Ingresa el título de la decisión.',
      loadSampleDemo: 'Cargar ejemplo demo',
      ownerPrefix: 'Responsable:',
      statusConfirmed: 'Confirmado',
      statusPending: 'Pendiente de revisión',
    },
  },
};
