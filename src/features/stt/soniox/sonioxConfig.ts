/** Soniox 실시간 전사 설정. 정확도에 영향을 주는 값(언어 힌트·회의 정보)을 한곳에서 만든다. */

export const SONIOX_URL = 'wss://stt-rt.soniox.com/transcribe-websocket';
// lab 에서 쓰던 모델. 더 새 실시간 모델이 나왔는지 Soniox 문서에서 확인하고 VITE_SONIOX_MODEL 로 바꾼다
export const DEFAULT_SONIOX_MODEL = 'stt-rt-preview';

export interface MeetingSttContext {
  topic?: string;
  participants?: string[];
  // 자주 나오는 고유명사·전문용어. 잘못 듣기 쉬운 단어를 알려 준다
  terms?: string[];
}

export interface SonioxConfigInput {
  apiKey: string;
  // 방 참여자 언어. 고정 ['ko', 'en'] 대신 실제 쓰는 언어를 힌트로 준다
  languageHints: string[];
  context?: MeetingSttContext;
  model?: string;
}

// Soniox 가 알아듣지 못하는 언어. 힌트에 넣으면 400 으로 연결을 거절한다
// (2026-11 확인: 실시간 모델 전부 60개 언어 중 미얀마어 없음, GET /v1/models)
// 이 언어 참여자도 화면 번역(Gemini)은 받는다. 그 언어로 말한 것만 전사되지 않는다
const SONIOX_UNSUPPORTED = new Set(['my']);

export function sonioxLanguageHints(languages: string[]): string[] {
  return [...new Set(languages)].filter((code) => !SONIOX_UNSUPPORTED.has(code));
}

export function buildSonioxConfig({ apiKey, languageHints, context, model }: SonioxConfigInput) {
  const sonioxContext = context ? toSonioxContext(context) : undefined;
  return {
    api_key: apiKey,
    model: model ?? DEFAULT_SONIOX_MODEL,
    audio_format: 'auto',
    language_hints: sonioxLanguageHints(languageHints),
    enable_speaker_diarization: true,
    enable_language_identification: true,
    enable_endpoint_detection: true,
    ...(sonioxContext && { context: sonioxContext }),
  };
}

// 빈 항목은 빼고 보낸다. 아무것도 없으면 context 자체를 생략한 것과 같다
export function toSonioxContext({ topic, participants = [], terms = [] }: MeetingSttContext) {
  const general = [
    { key: 'domain', value: '대학 수업·팀 프로젝트 회의 (한국어 위주, 외국인 유학생 참여, 가끔 영어로 말함)' },
    topic?.trim() ? { key: 'topic', value: topic.trim() } : null,
    participants.length > 0 ? { key: 'participants', value: participants.join(', ') } : null,
  ].filter((item): item is { key: string; value: string } => item !== null);
  // 참여자 이름도 잘못 듣기 쉬운 고유명사라 용어에 같이 넣는다
  const allTerms = [...new Set([...participants, ...terms].map((t) => t.trim()).filter(Boolean))];
  return { general, ...(allTerms.length > 0 && { terms: allTerms }) };
}
