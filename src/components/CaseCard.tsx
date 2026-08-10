import type { CSSProperties, KeyboardEvent } from 'react'
import type { Case } from '../domain/types'

export type CaseCardProps = {
  case: Case
  active?: boolean
  onSelect?: () => void
}

const styles: Record<string, CSSProperties> = {
  card: {
    width: 'min(84vw, 22rem)',
    minHeight: '13.5rem',
    borderRadius: 'var(--radius-card)',
    background: 'var(--card)',
    border: '1px solid var(--line)',
    boxShadow: 'var(--shadow)',
    padding: 'clamp(1.25rem, 5vw, 1.75rem)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.7rem',
    textAlign: 'left',
    cursor: 'pointer',
    userSelect: 'none',
    font: 'inherit',
    color: 'inherit',
  },
  meta: {
    margin: 0,
    fontSize: '0.8rem',
    color: 'var(--ink-muted)',
    letterSpacing: '0.02em',
  },
  title: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 'clamp(1.15rem, 5vw, 1.45rem)',
    color: 'var(--ink)',
    lineHeight: 1.3,
  },
  body: {
    margin: 0,
    color: 'var(--ink-muted)',
    lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    marginTop: 'auto',
    paddingTop: '0.2rem',
  },
  tag: {
    padding: '0.2rem 0.65rem',
    borderRadius: '999px',
    background: 'var(--bg1)',
    color: 'var(--brand)',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
}

export function CaseCard({ case: item, active = true, onSelect }: CaseCardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!onSelect) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <article
      style={styles.card}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      {item.occurredOn && <p style={styles.meta}>{item.occurredOn}</p>}
      <h2 style={styles.title}>{item.title}</h2>
      <p style={styles.body}>{item.body}</p>
      {item.tags.length > 0 && (
        <div style={styles.tags}>
          {item.tags.map((tag) => (
            <span key={tag} style={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
