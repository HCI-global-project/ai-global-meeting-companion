import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/mockMeetingData';
import { useI18n } from '../i18n/I18nContext';
import type { LanguageCode, RoomSession } from '../types/meeting';
import { LavenderBackdrop } from './LavenderBackdrop';
import { LoopLogo } from './LoopLogo';

// OMO 인풋: 회색 테두리 + 호버 시 옅은 배경, 포커스만 primary
const INPUT_CLASS =
  'w-full h-[45px] rounded-2 border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-primary-500 focus:outline-none px-4 body-03 text-gray-900 placeholder:text-gray-400 transition-colors';

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
      <div className="mb-8">
        <LoopLogo size="lg" />
      </div>

      {/* Centered Welcome Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[460px] bg-white border border-gray-100 rounded-5 shadow-03 px-6 sm:px-10 py-10"
      >
        <div className="text-center mb-8">
          <h1 className="heading-04 text-gray-900">
            {t.login.title}
          </h1>
          <p className="mt-2 body-02 text-primary-500">
            {t.login.subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Room Code */}
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="loop-room-code"
              className="body-02 text-gray-900"
            >
              {t.login.roomCodeLabel}
            </label>
            <input
              id="loop-room-code"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder={t.login.roomCodePlaceholder}
              className={INPUT_CLASS}
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="loop-user-name"
              className="body-02 text-gray-900"
            >
              {t.login.nameLabel}
            </label>
            <input
              id="loop-user-name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={t.login.namePlaceholder}
              className={INPUT_CLASS}
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="loop-user-role"
              className="body-02 text-gray-900"
            >
              {t.login.roleLabel}
            </label>
            <input
              id="loop-user-role"
              type="text"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              placeholder={t.login.rolePlaceholder}
              className={INPUT_CLASS}
            />
          </div>

          {/* My Language */}
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="loop-my-language"
              className="body-02 text-gray-900"
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
                className={`${INPUT_CLASS} appearance-none pr-10 cursor-pointer`}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeLabel}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 size-icon-xs text-gray-600"
                strokeWidth={2}
              />
            </div>
          </div>

          {/* Primary Start CTA */}
          <button
            type="submit"
            className="mt-4 w-full h-12 rounded-2 bg-primary-500 hover:opacity-90 text-white title-02 flex items-center justify-center transition-opacity cursor-pointer"
          >
            {t.login.startButton}
          </button>
        </div>
      </form>
    </main>
  );
};
