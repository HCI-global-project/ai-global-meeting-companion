import { useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { DEFAULT_LANGUAGE, LANGUAGES } from '../lib/languages'
import type { LanguageCode } from '../lib/languages'
import { saveSession } from '../lib/session'
import '../styles/tokens.css'
import './LoginPage.css'

interface FormValues {
  roomCode: string
  name: string
  role: string
  language: LanguageCode
}

type FormErrors = Partial<Record<'roomCode' | 'name', string>>

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.roomCode.trim()) errors.roomCode = 'Enter the room code to join.'
  if (!values.name.trim()) errors.name = 'Enter your name so others can see who you are.'
  return errors
}

/** Decorative lavender "loop" shapes behind the card. */
function LoginBackground() {
  return (
    <svg
      className="login__bg"
      viewBox="0 0 1458 916"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="login-ring-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f80ea" stopOpacity="0.7" />
          <stop offset="1" stopColor="#b9b0f4" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="login-ring-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8f80ea" stopOpacity="0.65" />
          <stop offset="1" stopColor="#c3bbf6" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <ellipse cx="300" cy="150" rx="270" ry="170" fill="#ffffff" opacity="0.3" />
      <ellipse cx="1260" cy="790" rx="280" ry="210" fill="#e6dbf8" opacity="0.65" />
      <ellipse
        cx="330"
        cy="620"
        rx="190"
        ry="290"
        transform="rotate(28 330 620)"
        fill="none"
        stroke="url(#login-ring-a)"
        strokeWidth="110"
      />
      <ellipse
        cx="1070"
        cy="290"
        rx="200"
        ry="250"
        transform="rotate(-22 1070 290)"
        fill="none"
        stroke="url(#login-ring-b)"
        strokeWidth="120"
      />
    </svg>
  )
}

interface FieldProps {
  id: string
  label: string
  error?: string
  children: ReactNode
}

/** Label + control + optional error message. */
function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="login-field">
      <label className="login-field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <p className="login-field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Login / meeting setup screen (Figma: "Welcome to Loop!").
 * Collects room code, name, role and language, keeps them in sessionStorage
 * (mock auth) and routes to /meeting/:roomCode.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const uid = useId()
  const ids = {
    roomCode: `${uid}-room-code`,
    name: `${uid}-name`,
    role: `${uid}-role`,
    language: `${uid}-language`,
  }

  const [values, setValues] = useState<FormValues>({
    roomCode: '',
    name: '',
    role: '',
    language: DEFAULT_LANGUAGE,
  })
  // Errors only appear after the first submit attempt, then update as the user types.
  const [submitted, setSubmitted] = useState(false)
  const errors = submitted ? validate(values) : {}

  const roomCodeRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const update =
    (field: keyof FormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = event.target
      setValues((prev) => ({ ...prev, [field]: value }))
    }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)

    const found = validate(values)
    if (found.roomCode) return roomCodeRef.current?.focus()
    if (found.name) return nameRef.current?.focus()

    const roomCode = values.roomCode.trim()
    // TODO: replace with a real "join room" API call
    saveSession({
      roomCode,
      name: values.name.trim(),
      role: values.role.trim(),
      language: values.language,
    })
    navigate(`/meeting/${encodeURIComponent(roomCode)}`)
  }

  return (
    <main className="login">
      <LoginBackground />

      <div className="login__content">
        <Logo className="login__logo" />

        <section className="login-card" aria-labelledby={`${uid}-title`}>
          <header className="login-card__header">
            <h1 className="login-card__title" id={`${uid}-title`}>
              Welcome to Loop!
            </h1>
            <p className="login-card__subtitle">Connect with your team in any language.</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <Field id={ids.roomCode} label="Room Code" error={errors.roomCode}>
              <input
                ref={roomCodeRef}
                className="login-input"
                id={ids.roomCode}
                type="text"
                placeholder="Enter room code"
                value={values.roomCode}
                onChange={update('roomCode')}
                maxLength={32}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(errors.roomCode)}
                aria-describedby={errors.roomCode ? `${ids.roomCode}-error` : undefined}
              />
            </Field>

            <Field id={ids.name} label="Name" error={errors.name}>
              <input
                ref={nameRef}
                className="login-input"
                id={ids.name}
                type="text"
                placeholder="Enter your name"
                value={values.name}
                onChange={update('name')}
                maxLength={40}
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? `${ids.name}-error` : undefined}
              />
            </Field>

            <Field id={ids.role} label="Role">
              <input
                className="login-input"
                id={ids.role}
                type="text"
                placeholder="e.g. PM, Designer, Developer"
                value={values.role}
                onChange={update('role')}
                maxLength={40}
                autoComplete="organization-title"
              />
            </Field>

            <Field id={ids.language} label="My Language">
              <select
                className="login-input login-input--select"
                id={ids.language}
                value={values.language}
                onChange={update('language')}
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
            </Field>

            <button className="login-form__submit" type="submit">
              Start
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
