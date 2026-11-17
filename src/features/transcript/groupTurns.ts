import type { TranscriptEntry } from '../../types/meeting';

/**
 * 화면에 보여 줄 카드 하나. 같은 사람이 이어 말한 줄을 묶는다.
 *
 * 서버는 번역·맥락을 위해 말을 50~90자 줄로 끊는다. 그 줄마다 카드를 만들면, 줄이 확정될 때마다
 * 화자 이름표가 달린 새 카드가 생기면서 읽던 글자가 위로 튀었다. 그래서 화면 단위만 따로 묶는다.
 * 서버가 끊는 단위(번역 단위)는 그대로다.
 */
export interface Turn {
  id: string;
  entries: TranscriptEntry[];
  // 녹음 기기에서 아직 확정 전인 글자. 같은 사람이 이어 말하는 중이면 마지막 카드 끝에 옅게 붙인다
  interim: TranscriptEntry | null;
}

export interface GroupOptions {
  // 한 카드의 원문 글자 수 상한. 넘으면 새 카드를 연다
  maxChars: number;
  // 앞 줄이 저장된 뒤 이보다 늦게 온 줄은 새 카드. 이어 말하면 줄이 10초 간격으로 오기도 해서 넉넉히 잡는다
  maxGapMs: number;
}

export const DEFAULT_GROUP_OPTIONS: GroupOptions = { maxChars: 300, maxGapMs: 20_000 };

// 음성 줄만 묶는다. 채팅·의견은 보낸 사람이 한 번에 쓴 글이라 따로 둔다
const GROUPABLE = new Set<TranscriptEntry['source']>(['stream', 'demo', 'microphone']);

const speakerOfEntry = (entry: TranscriptEntry) => entry.speakerKey ?? entry.participantId ?? entry.speakerId;

const textLength = (entries: TranscriptEntry[]) => entries.reduce((n, e) => n + e.originalText.length, 0);

function gapMs(previous: TranscriptEntry, next: TranscriptEntry): number {
  const a = previous.createdAt ? Date.parse(previous.createdAt) : NaN;
  const b = next.createdAt ? Date.parse(next.createdAt) : NaN;
  // 시각을 모르면(데모, 예전 서버) 간격으로는 나누지 않는다
  return Number.isFinite(a) && Number.isFinite(b) ? b - a : 0;
}

function canJoin(turn: Turn, next: TranscriptEntry, options: GroupOptions): boolean {
  const last = turn.entries[turn.entries.length - 1];
  return (
    GROUPABLE.has(last.source) &&
    next.source === last.source &&
    !next.isAnonymous &&
    speakerOfEntry(next) === speakerOfEntry(last) &&
    textLength(turn.entries) + next.originalText.length <= options.maxChars &&
    gapMs(last, next) <= options.maxGapMs
  );
}

export function groupTurns(
  entries: TranscriptEntry[],
  interim: TranscriptEntry | null,
  options: GroupOptions = DEFAULT_GROUP_OPTIONS,
  now: number = Date.now()
): Turn[] {
  const turns: Turn[] = [];
  for (const entry of entries) {
    const current = turns[turns.length - 1];
    if (current && canJoin(current, entry, options)) current.entries.push(entry);
    else turns.push({ id: entry.id, entries: [entry], interim: null });
  }

  if (interim) {
    const last = turns[turns.length - 1];
    const lastEntry = last?.entries[last.entries.length - 1];
    // 확정 전 글자는 화자를 모른다. 바로 앞 카드가 같은 종류의 음성 카드이고, 아직 자리가 있고,
    // 방금 전 줄이면 이어서 말하는 것으로 본다. 확정돼도 같은 카드에 들어갈 수 있어야 글자가 튀지 않는다.
    // 다른 사람이 말을 시작했으면 확정되는 순간 새 카드로 옮겨 간다(드문 경우라 받아들인다)
    const recent = lastEntry?.createdAt ? now - Date.parse(lastEntry.createdAt) <= options.maxGapMs : true;
    if (
      lastEntry &&
      GROUPABLE.has(lastEntry.source) &&
      lastEntry.source === interim.source &&
      textLength(last.entries) < options.maxChars &&
      recent
    ) {
      last.interim = interim;
    } else {
      turns.push({ id: `interim-${interim.id}`, entries: [], interim });
    }
  }
  return turns;
}
