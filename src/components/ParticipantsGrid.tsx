import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { Participant } from '../types/meeting';
import { ParticipantAvatarIcon } from './LoopIcons';

interface ParticipantsGridProps {
  participants: Participant[];
  activeSpeakerId?: string;
}

export const ParticipantsGrid: React.FC<ParticipantsGridProps> = ({
  participants,
  activeSpeakerId,
}) => {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedParticipant =
    participants.find((p) => p.id === selectedId) ?? null;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-2 mb-2.5 min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-[17px] lg:text-[18px] font-medium text-[#5A5770] tracking-[-0.01em] shrink-0">
            {t.participants.title}
          </h2>
          <span className="text-[11px] font-medium text-[#8E8BA3] truncate">
            · {t.participants.mockLabel}
          </span>
        </div>

        {selectedParticipant && (
          <span className="text-[11.5px] text-[#7D7994] truncate">
            {selectedParticipant.name} · {selectedParticipant.role} ·{' '}
            {selectedParticipant.languageLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 min-[460px]:grid-cols-4 gap-2.5 lg:gap-3">
        {participants.map((participant) => {
          const isSpeaking = activeSpeakerId === participant.id;
          const isSelected = selectedId === participant.id;

          return (
            <button
              key={participant.id}
              type="button"
              onClick={() =>
                setSelectedId(isSelected ? null : participant.id)
              }
              title={`${participant.name} (${participant.role}) — ${participant.languageLabel}`}
              className={`group relative rounded-[16px] lg:rounded-[18px] px-2 py-2.5 min-h-[96px] lg:min-h-[108px] flex flex-col items-center justify-between transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B49EA] min-w-0 ${
                isSpeaking
                  ? 'bg-[#B3ACEF] ring-2 ring-[#5B49EA] ring-offset-2 ring-offset-[#F7F6FC]'
                  : isSelected
                    ? 'bg-[#B8B4C6] ring-2 ring-[#7C6CEB] ring-offset-2 ring-offset-[#F7F6FC]'
                    : 'bg-[#C3C0CF] hover:bg-[#B8B4C6]'
              }`}
              aria-label={`${participant.name}, ${participant.role}, ${participant.languageLabel}${
                isSpeaking ? `, ${t.participants.speaking}` : ''
              }`}
              aria-pressed={isSelected}
            >
              {/* Top Speaking Indicator */}
              <div className="w-full flex items-center justify-end min-h-[16px]">
                {isSpeaking && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-[#5B49EA] rounded-full px-1.5 py-0.5 leading-none">
                    <Volume2 className="w-2.5 h-2.5 shrink-0" />
                    <span className="hidden xl:inline">{t.participants.speaking}</span>
                  </span>
                )}
              </div>

              {/* Avatar */}
              <ParticipantAvatarIcon className="w-8 h-8 lg:w-10 lg:h-10 text-white transition-transform duration-150 group-hover:scale-[1.03] shrink-0" />

              {/* Always-visible Name & Role */}
              <div className="w-full text-center mt-1.5 min-w-0">
                <p className="text-[12px] lg:text-[12.5px] font-semibold text-white leading-tight truncate">
                  {participant.name}
                </p>
                <p className="text-[10.5px] lg:text-[11px] font-medium text-white/85 leading-tight truncate">
                  {participant.role}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
