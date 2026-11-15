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
      className="w-full bg-white border-b border-[#EAE8F3] shadow-[0_1px_4px_rgba(30,27,46,0.04)] px-4 sm:px-6 py-3 relative z-30"
    >
      <div className="max-w-[1440px] mx-auto flex flex-wrap min-[900px]:flex-nowrap items-center justify-between gap-2.5 lg:gap-4">
        {/* Left Zone: Logo + Room Pill + User Role Pill */}
        <div className="flex items-center gap-2 lg:gap-4 flex-wrap min-[900px]:flex-nowrap min-w-0">
          <LoopLogo size="sm" onClick={() => onSwitchView('meeting')} />

          {/* Room Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'room' ? null : 'room')}
              className="inline-flex items-center gap-1.5 lg:gap-2 bg-[#ECEAF4] hover:bg-[#E2DFEE] text-[#6B6780] rounded-xl px-3 lg:px-4 py-1.5 lg:py-2 text-[13px] lg:text-[14px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-expanded={openMenu === 'room'}
            >
              <span>{session.roomCode}</span>
              <ChevronDown className="w-4 h-4 text-[#7D7994]" strokeWidth={2} />
            </button>

            {openMenu === 'room' && (
              <div className="absolute left-0 mt-2 w-52 bg-white border border-[#DFDDE9] rounded-xl shadow-[0_8px_24px_rgba(30,27,46,0.08)] py-1.5 z-40">
                <div className="px-3 py-1.5 text-[11px] font-medium text-[#8E8BA3]">
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
                    className={`w-full text-left px-3 py-2 text-[13px] transition-colors flex items-center justify-between cursor-pointer ${
                      room === session.roomCode
                        ? 'bg-[#F3F1FC] text-[#5B49EA] font-medium'
                        : 'text-[#4C4962] hover:bg-[#F7F6FC]'
                    }`}
                  >
                    <span>{room}</span>
                    {room === session.roomCode && (
                      <span className="text-xs">{t.header.active}</span>
                    )}
                  </button>
                ))}
                <div className="my-1 border-t border-[#EAE8F3]" />
                <button
                  type="button"
                  onClick={() => {
                    onSwitchView(activeView === 'meeting' ? 'notes' : 'meeting');
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 text-[13px] text-[#4C4962] hover:bg-[#F7F6FC] transition-colors cursor-pointer"
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
              className="inline-flex items-center gap-1.5 lg:gap-2 bg-[#ECEAF4] hover:bg-[#E2DFEE] text-[#6B6780] rounded-xl px-3 lg:px-4 py-1.5 lg:py-2 text-[13px] lg:text-[14px] font-medium transition-colors whitespace-nowrap max-w-[200px] cursor-pointer"
              aria-expanded={openMenu === 'profile'}
            >
              <span className="truncate">
                {session.userName} : {session.userRole}
              </span>
              <ChevronDown className="w-4 h-4 text-[#7D7994] shrink-0" strokeWidth={2} />
            </button>

            {openMenu === 'profile' && (
              <div className="absolute left-0 mt-2 w-60 bg-white border border-[#DFDDE9] rounded-xl shadow-[0_8px_24px_rgba(30,27,46,0.08)] p-3 z-40">
                <p className="text-[13px] font-medium text-[#3E3B52]">{session.userName}</p>
                <p className="text-[12px] text-[#8E8BA3] mt-0.5">
                  {t.header.roleSummary(session.userRole, session.roomCode)}
                </p>
                <div className="mt-2.5 pt-2.5 border-t border-[#EAE8F3] flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchView('meeting');
                      setOpenMenu(null);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] cursor-pointer ${
                      activeView === 'meeting'
                        ? 'bg-[#F3F1FC] text-[#5B49EA] font-medium'
                        : 'text-[#4C4962] hover:bg-[#F7F6FC]'
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
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] cursor-pointer ${
                      activeView === 'notes'
                        ? 'bg-[#F3F1FC] text-[#5B49EA] font-medium'
                        : 'text-[#4C4962] hover:bg-[#F7F6FC]'
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
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'language' ? null : 'language')}
              className="inline-flex items-center gap-1.5 lg:gap-2 bg-[#F5F4FA] hover:bg-[#ECEAF4] border border-[#C6C3D6] text-[#4C4962] rounded-xl px-3 lg:px-4 py-1.5 text-[13px] lg:text-[14px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-expanded={openMenu === 'language'}
              aria-label={t.header.targetLanguageAria}
            >
              <span>{currentLang.nativeLabel}</span>
              <ChevronDown className="w-4 h-4 text-[#6B6780]" strokeWidth={2} />
            </button>

            {openMenu === 'language' && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#DFDDE9] rounded-xl shadow-[0_8px_24px_rgba(30,27,46,0.08)] py-1.5 z-40">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onChangeLanguage(lang.code);
                      setOpenMenu(null);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-[13px] transition-colors flex items-center justify-between cursor-pointer ${
                      lang.code === uiLanguage
                        ? 'bg-[#F3F1FC] text-[#5B49EA] font-medium'
                        : 'text-[#4C4962] hover:bg-[#F7F6FC]'
                    }`}
                  >
                    <span>{lang.nativeLabel}</span>
                    <span className="text-[11px] text-[#8E8BA3]">
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
            className="bg-[#ECEAF4] hover:bg-[#E0DDEC] text-[#55526B] rounded-xl px-3 lg:px-4 py-1.5 text-[13px] lg:text-[14px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.header.exit}
          </button>

          {/* Start meeting / End Meeting Button */}
          <button
            type="button"
            onClick={onToggleRecording}
            disabled={isRequesting}
            className={`rounded-xl px-3.5 lg:px-5 py-1.5 lg:py-2 text-[13px] lg:text-[14px] font-medium text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              activeView === 'notes'
                ? 'bg-[#9490B0] hover:bg-[#827EA1]'
                : isRecording
                  ? 'bg-[#9490B0] hover:bg-[#827EA1]'
                  : 'bg-[#9E9BB8] hover:bg-[#8D89A8]'
            }`}
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
