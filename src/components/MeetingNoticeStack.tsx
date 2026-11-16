import React from 'react';
import { EyeOff, Hand, X } from 'lucide-react';
import type { MeetingNotice } from '../hooks/useMeetingNotices';
import { useI18n } from '../i18n/I18nContext';
import type { LanguageCode, TranscriptEntry } from '../types/meeting';

interface MeetingNoticeStackProps {
  notices: MeetingNotice[];
  entries: TranscriptEntry[];
  targetLanguage: LanguageCode;
  onDismiss: (entryId: string) => void;
}

/** 헤더 바로 아래 가운데에 뜨는 회의 알림(잠깐 기다려 주세요·익명 의견) */
export const MeetingNoticeStack: React.FC<MeetingNoticeStackProps> = ({
  notices,
  entries,
  targetLanguage,
  onDismiss,
}) => {
  const { t } = useI18n();
  if (notices.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-40 flex flex-col items-center gap-2 px-4">
      {notices.map((notice) => {
        const entry = entries.find((e) => e.id === notice.entryId);
        // 익명 의견은 번역이 오면 내 언어로 바꿔 보여 준다
        const opinion = entry ? entry.translations[targetLanguage] ?? entry.originalText : '';
        return (
          <div
            key={notice.entryId}
            role="status"
            className="pointer-events-auto flex w-full max-w-[560px] items-start gap-2.5 rounded-4 border border-primary-100 bg-primary-50 py-2 pl-2 pr-1.5 shadow-01 animate-[fade-up_0.25s_ease-out]"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-600">
              {notice.kind === 'wait' ? <Hand className="size-4" /> : <EyeOff className="size-4" />}
            </span>
            <div className="min-w-0 flex-1 py-1">
              {notice.kind === 'wait' ? (
                <p className="body-02 text-primary-600">{t.quickActions.waitNotice}</p>
              ) : (
                <>
                  <p className="label-01 text-primary-500">{t.anonymousOpinion.anonymousSpeaker}</p>
                  <p className="body-02 break-keep text-gray-800">{opinion}</p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(notice.entryId)}
              aria-label={t.common.close}
              className="grid size-7 shrink-0 place-items-center rounded-full text-primary-600 hover:bg-white/70 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
