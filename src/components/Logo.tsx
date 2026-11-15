import './Logo.css'

interface LogoProps {
  className?: string
}

/**
 * Loop wordmark: an infinity mark (two linked rings) followed by "loop".
 * Size it with `font-size` on the element (the mark scales with the text).
 * TODO: swap the mark for the official SVG exported from Figma.
 */
export default function Logo({ className }: LogoProps) {
  return (
    <span
      className={className ? `logo ${className}` : 'logo'}
      role="img"
      aria-label="Loop"
    >
      <svg className="logo__mark" viewBox="0 0 64 32" aria-hidden="true" focusable="false">
        <circle cx="20" cy="16" r="12" />
        <circle cx="44" cy="16" r="12" />
      </svg>
      <span className="logo__word" aria-hidden="true">
        loop
      </span>
    </span>
  )
}
