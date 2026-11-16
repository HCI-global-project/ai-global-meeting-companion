import React, { useEffect, useRef, useState } from 'react';
import { Check, PenLine } from 'lucide-react';
import type { PipelineParticipant } from '../features/pipeline/PipelineClient';
import { useI18n } from '../i18n/I18nContext';

interface SpeakerAssignMenuProps {
  /** 칩에 보이는 이름: 지정된 참여자 이름 또는 '화자 2' */
  label: string;
  timestamp: string;
  chipClassName: string;
  assignedId: string | undefined;
  participants: PipelineParticipant[];
  selfId: string;
  onAssign: (participantId: string | null) => void;
}

/**
 * 전사 줄의 화자 칩. 누르면 이 화자가 누구인지 고르는 메뉴가 열린다.
 * 고르면 같은 화자의 지난 줄과 앞으로의 줄이 모두 그 사람 이름으로 바뀐다.
 */
export const SpeakerAssignMenu: React.FC<SpeakerAssignMenuProps> = ({
  label,
  timestamp,
  chipClassName,
  assignedId,
  participants,
  selfId,
  onAssign,
}) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // 나를 맨 위에 둔다. 대부분 '이건 내 말'을 고르러 들어오기 때문이다
  const self = participants.find((p) => p.id === selfId);
  const others = participants.filter((p) => p.id !== selfId);
  const options = self ? [self, ...others] : others;

  const choose = (participantId: string | null) => {
    onAssign(participantId);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.speakers.assignLabel(label)}
        className={`group inline-flex items-center gap-2 rounded-full px-4 py-1 body-02 text-gray-800 tabular-nums cursor-pointer transition-colors ${chipClassName}`}
      >
        <span>{label}</span>
        <span>{timestamp}</span>
        <PenLine className="size-3 text-gray-500 group-hover:text-gray-700" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-1.5 w-56 rounded-2 border border-gray-100 bg-white px-2 py-3 shadow-01"
        >
          <p className="px-2 pb-2 label-01 text-gray-500">{t.speakers.assignTitle}</p>
          {options.length === 0 ? (
            <p className="px-2 py-1.5 body-04 text-gray-400">{t.speakers.noParticipants}</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {options.map((p) => {
                const selected = p.id === assignedId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      onClick={() => choose(p.id)}
                      className={`flex h-8 w-full items-center justify-between gap-2 rounded-1 px-2 text-left body-04 cursor-pointer transition-colors ${
                        selected ? 'bg-primary-50 text-primary-800' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate">{p.id === selfId ? t.speakers.me(p.name) : p.name}</span>
                      {selected && <Check className="size-3.5 shrink-0" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {assignedId && (
            <>
              <div className="my-2 border-t border-gray-100" />
              <button
                type="button"
                role="menuitem"
                onClick={() => choose(null)}
                className="flex h-8 w-full items-center rounded-1 px-2 body-04 text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                {t.speakers.clear}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
