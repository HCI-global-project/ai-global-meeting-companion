import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/mockMeetingData';
import { useI18n } from '../i18n/I18nContext';
import type { LanguageCode, RoomSession } from '../types/meeting';
import { LavenderBackdrop } from './LavenderBackdrop';
import { LoopLogo } from './LoopLogo';

interface JoinRoomViewProps {
  initialSession: RoomSession;
  onStartMeeting: (session: RoomSession) => void;
}

export const JoinRoomView: React.FC<JoinRoomViewProps> = ({
  initialSession,
  onStartMeeting,
}) => {
  const { uiLanguage, setUiLanguage, t } = useI18n();
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    initialSession.uiLanguage || uiLanguage
  );

  const handleLanguageChange = (nextLang: LanguageCode) => {
    setSelectedLanguage(nextLang);
    setUiLanguage(nextLang);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartMeeting({
      roomCode: roomCode.trim() || initialSession.roomCode || 'Lab-5',
      userName: userName.trim() || initialSession.userName || 'Joe',
      userRole: userRole.trim() || initialSession.userRole || 'designer',
      uiLanguage: selectedLanguage,
      speechTargetLanguage: selectedLanguage,
    });
  };

  return (
    <main className="min-h-screen w-full relative flex flex-col items-center justify-center px-4 py-8">
      <LavenderBackdrop />

      {/* Centered Large Loop Logo */}
      <div className="mb-7">
        <LoopLogo size="lg" />
      </div>

      {/* Centered Welcome Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[460px] bg-white/95 backdrop-blur-sm rounded-[28px] shadow-[0_18px_50px_rgba(91,73,234,0.10)] px-8 sm:px-11 py-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#1A1826]">
            {t.login.title}
          </h1>
          <p className="mt-1.5 text-[14px] font-medium text-[#5B49EA]">
            {t.login.subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Room Code */}
          <div>
            <label
              htmlFor="loop-room-code"
              className="block text-[13px] font-medium text-[#1A1826] mb-1.5"
            >
              {t.login.roomCodeLabel}
            </label>
            <input
              id="loop-room-code"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder={t.login.roomCodePlaceholder}
              className="w-full rounded-xl border border-[#8E82F6] focus:border-[#5B49EA] focus:outline-none focus:ring-2 focus:ring-[#5B49EA]/15 px-4 py-2.5 text-[14px] text-[#1A1826] placeholder:text-[#A4A1B5] bg-white"
            />
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="loop-user-name"
              className="block text-[13px] font-medium text-[#1A1826] mb-1.5"
            >
              {t.login.nameLabel}
            </label>
            <input
              id="loop-user-name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={t.login.namePlaceholder}
              className="w-full rounded-xl border border-[#8E82F6] focus:border-[#5B49EA] focus:outline-none focus:ring-2 focus:ring-[#5B49EA]/15 px-4 py-2.5 text-[14px] text-[#1A1826] placeholder:text-[#A4A1B5] bg-white"
            />
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="loop-user-role"
              className="block text-[13px] font-medium text-[#1A1826] mb-1.5"
            >
              {t.login.roleLabel}
            </label>
            <input
              id="loop-user-role"
              type="text"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              placeholder={t.login.rolePlaceholder}
              className="w-full rounded-xl border border-[#8E82F6] focus:border-[#5B49EA] focus:outline-none focus:ring-2 focus:ring-[#5B49EA]/15 px-4 py-2.5 text-[14px] text-[#1A1826] placeholder:text-[#A4A1B5] bg-white"
            />
          </div>

          {/* My Language */}
          <div>
            <label
              htmlFor="loop-my-language"
              className="block text-[13px] font-medium text-[#1A1826] mb-1.5"
            >
              {t.login.languageLabel}
            </label>
            <div className="relative">
              <select
                id="loop-my-language"
                value={selectedLanguage}
                onChange={(e) =>
                  handleLanguageChange(e.target.value as LanguageCode)
                }
                className="w-full appearance-none rounded-xl border border-[#8E82F6] focus:border-[#5B49EA] focus:outline-none focus:ring-2 focus:ring-[#5B49EA]/15 px-4 py-2.5 pr-10 text-[14px] text-[#1A1826] bg-white cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeLabel}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1826]"
                strokeWidth={2}
              />
            </div>
          </div>

          {/* Primary Start CTA */}
          <button
            type="submit"
            className="mt-3 w-full rounded-xl bg-[#5B49EA] hover:bg-[#4C3ADB] text-white font-semibold text-[16px] py-3 transition-colors shadow-[0_6px_18px_rgba(91,73,234,0.28)] cursor-pointer"
          >
            {t.login.startButton}
          </button>
        </div>
      </form>
    </main>
  );
};
