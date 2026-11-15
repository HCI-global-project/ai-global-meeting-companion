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
          <h2 className="heading-06 text-gray-700 shrink-0">
            {t.participants.title}
          </h2>
          <span className="label-02 text-gray-500 truncate">
            · {t.participants.mockLabel}
          </span>
        </div>

        {selectedParticipant && (
          <span className="label-01 text-gray-600 truncate">
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
              className={`group relative rounded-4 px-2 py-2.5 min-h-[96px] lg:min-h-[108px] flex flex-col items-center justify-between transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 min-w-0 ${
                isSpeaking
                  ? 'bg-primary-300 ring-2 ring-inset ring-primary-500'
                  : isSelected
                    ? 'bg-gray-300 ring-2 ring-inset ring-primary-400'
                    : 'bg-gray-300/80 hover:bg-gray-300'
              }`}
              aria-label={`${participant.name}, ${participant.role}, ${participant.languageLabel}${
                isSpeaking ? `, ${t.participants.speaking}` : ''
              }`}
              aria-pressed={isSelected}
            >
              {/* Top Speaking Indicator */}
              <div className="w-full flex items-center justify-end min-h-[16px]">
                {isSpeaking && (
                  <span className="inline-flex items-center gap-1 label-02 text-white bg-primary-500 rounded-full px-1.5 py-0.5">
                    <Volume2 className="size-2.5 shrink-0" />
                    <span className="hidden xl:inline">{t.participants.speaking}</span>
                  </span>
                )}
              </div>

              {/* Avatar */}
              <ParticipantAvatarIcon className="w-8 h-8 lg:w-10 lg:h-10 text-white transition-transform duration-150 group-hover:scale-[1.03] shrink-0" />

              {/* Always-visible Name & Role */}
              <div className="w-full text-center mt-1.5 min-w-0">
                <p className="body-05 text-white truncate">
                  {participant.name}
                </p>
                <p className="label-02 text-white/85 truncate">
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
