import type { LanguageCode } from './languages'

/** What the participant entered on the login screen. */
export interface MeetingSession {
  roomCode: string
  name: string
  role: string
  language: LanguageCode
}

const STORAGE_KEY = 'loop:session'

/** Mock "auth": keep the setup choices for the meeting pages (cleared when the tab closes). */
export function saveSession(session: MeetingSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Storage can be unavailable (private mode, etc.). The app still works without it.
  }
}

export function loadSession(): MeetingSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MeetingSession) : null
  } catch {
    return null
  }
}
