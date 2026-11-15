import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { AVAILABLE_ROOMS, SUPPORTED_LANGUAGES } from '../data/mockMeetingData';
import { useI18n } from '../i18n/I18nContext';
import type { AppView, LanguageCode, RoomSession } from '../types/meeting';
import { LoopLogo } from './LoopLogo';

interface MeetingHeaderProps {
  session: RoomSession;
  isRecording: boolean;
  isRequesting?: boolean;
  activeView: Extract<AppView, 'meeting' | 'notes'>;
  onChangeLanguage: (lang: LanguageCode) => void;
  onChangeRoom: (room: string) => void;
  onToggleRecording: () => void;
  onSwitchView: (view: Extract<AppView, 'meeting' | 'notes'>) => void;
  onExit: () => void;
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  session,
  isRecording,
  isRequesting = false,
  activeView,
  onChangeLanguage,
  onChangeRoom,
  onToggleRecording,
  onSwitchView,
  onExit,
}) => {
  const { uiLanguage, t } = useI18n();
  const [openMenu, setOpenMenu] = useState<'room' | 'profile' | 'language' | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === uiLanguage) ?? SUPPORTED_LANGUAGES[0];

  return (
    <header
      ref={headerRef}
      className="w-full bg-white border-b border-gray-100 px-4 sm:px-6 py-3 relative z-30"
    >
      <div className="max-w-[1440px] mx-auto flex flex-wrap min-[900px]:flex-nowrap items-center justify-between gap-3 lg:gap-4">
        {/* Left Zone: Logo + Room Pill + User Role Pill */}
        <div className="flex items-center gap-2 lg:gap-3 flex-wrap min-[900px]:flex-nowrap min-w-0">
          <LoopLogo size="sm" onClick={() => onSwitchView('meeting')} />

          {/* Room Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'room' ? null : 'room')}
              className="inline-flex items-center gap-1.5 h-9 px-3 lg:px-4 rounded-2 bg-gray-100 hover:bg-gray-200 text-gray-600 body-02 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-expanded={openMenu === 'room'}
            >
              <span>{session.roomCode}</span>
              <ChevronDown className="size-icon-xs text-gray-500" strokeWidth={2} />
            </button>

            {openMenu === 'room' && (
              <div className="absolute left-0 mt-2 w-52 flex flex-col gap-0.5 bg-white border border-gray-100 rounded-2 shadow-01 px-2 py-3 z-40">
                <div className="px-4 pb-1 label-02 text-gray-500">
                  {t.header.switchRoom}
                </div>
                {AVAILABLE_ROOMS.map((room) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => {
                      onChangeRoom(room);
                      setOpenMenu(null);
                    }}
                    className={`w-full h-[30px] px-4 rounded-1 body-04 text-left transition-colors flex items-center justify-between cursor-pointer ${
                      room === session.roomCode
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span>{room}</span>
                    {room === session.roomCode && (
                      <span className="label-01">{t.header.active}</span>
                    )}
                  </button>
                ))}
                <div className="my-1.5 mx-2 border-t border-gray-100" />
                <button
                  type="button"
                  onClick={() => {
                    onSwitchView(activeView === 'meeting' ? 'notes' : 'meeting');
                    setOpenMenu(null);
                  }}
                  className="w-full h-[30px] px-4 rounded-1 body-04 text-left text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {activeView === 'meeting'
                    ? t.header.endMeeting
                    : t.header.backToMeetingPage}
                </button>
              </div>
            )}
          </div>

          {/* User : Role Pill */}
          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
              className="inline-flex items-center gap-1.5 h-9 px-3 lg:px-4 rounded-2 bg-gray-100 hover:bg-gray-200 text-gray-600 body-02 transition-colors whitespace-nowrap max-w-[200px] cursor-pointer"
              aria-expanded={openMenu === 'profile'}
            >
              <span className="truncate">
                {session.userName} : {session.userRole}
              </span>
              <ChevronDown className="size-icon-xs text-gray-500 shrink-0" strokeWidth={2} />
            </button>

            {openMenu === 'profile' && (
              <div className="absolute left-0 mt-2 w-60 bg-white border border-gray-100 rounded-2 shadow-01 p-3 z-40">
                <p className="body-02 text-gray-900 px-2">{session.userName}</p>
                <p className="label-01 text-gray-500 mt-0.5 px-2">
                  {t.header.roleSummary(session.userRole, session.roomCode)}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchView('meeting');
                      setOpenMenu(null);
                    }}
                    className={`w-full h-[30px] px-2 rounded-1 body-04 text-left transition-colors cursor-pointer ${
                      activeView === 'meeting'
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {t.header.meetingPage}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchView('notes');
                      setOpenMenu(null);
                    }}
                    className={`w-full h-[30px] px-2 rounded-1 body-04 text-left transition-colors cursor-pointer ${
                      activeView === 'notes'
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {t.header.meetingEndPage}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Zone: Language Selector + Exit + Start meeting / End Meeting */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'language' ? null : 'language')}
              className="inline-flex items-center gap-1.5 h-9 px-3 lg:px-4 rounded-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 body-02 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-expanded={openMenu === 'language'}
              aria-label={t.header.targetLanguageAria}
            >
              <span>{currentLang.nativeLabel}</span>
              <ChevronDown className="size-icon-xs text-gray-600" strokeWidth={2} />
            </button>

            {openMenu === 'language' && (
              <div className="absolute right-0 mt-2 w-48 flex flex-col gap-0.5 bg-white border border-gray-100 rounded-2 shadow-01 px-2 py-3 z-40">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onChangeLanguage(lang.code);
                      setOpenMenu(null);
                    }}
                    className={`w-full h-[30px] px-4 rounded-1 body-04 text-left transition-colors flex items-center justify-between cursor-pointer ${
                      lang.code === uiLanguage
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span>{lang.nativeLabel}</span>
                    <span className="label-01 text-gray-500">
                      {t.common.languages[lang.code]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Exit Button */}
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 h-9 px-3 lg:px-4 rounded-2 bg-gray-100 hover:bg-gray-200 text-gray-600 body-02 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.header.exit}
          </button>

          {/* Start meeting / End Meeting Button */}
          <button
            type="button"
            onClick={onToggleRecording}
            disabled={isRequesting}
            className="inline-flex items-center justify-center h-9 px-4 lg:px-5 rounded-2 bg-gray-400 hover:bg-gray-500 text-white body-02 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeView === 'notes'
              ? t.header.resumeMeeting
              : isRequesting
                ? t.header.starting
                : isRecording
                  ? t.header.endMeeting
                  : t.header.startMeeting}
          </button>
        </div>
      </div>
    </header>
  );
};
