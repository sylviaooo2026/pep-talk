import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Case } from '../domain/types'

export type CaseDetailProps = {
  case: Case
  onClose: () => void
}

const styles: Record<string, CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'center',
    padding:
      'max(0.75rem, env(safe-area-inset-top)) max(0.75rem, env(safe-area-inset-right)) max(0.75rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left))',
    background: 'rgba(28, 51, 64, 0.48)',
    transition: 'opacity 200ms ease-out',
  },
  panel: {
    width: 'min(100%, 48rem)',
    height: '100%',
    overflowY: 'auto',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-card)',
    background: 'var(--bg2)',
    boxShadow: 'var(--shadow)',
    padding: 'clamp(1.25rem, 5vw, 3rem)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  meta: {
    margin: 0,
    color: 'var(--ink-muted)',
    fontSize: '0.9rem',
    letterSpacing: '0.02em',
  },
  title: {
    margin: 0,
    color: 'var(--ink)',
    fontSize: 'clamp(2rem, 8vw, 3.25rem)',
    lineHeight: 1.15,
    overflowWrap: 'anywhere',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  tag: {
    padding: '0.3rem 0.75rem',
    borderRadius: '999px',
    background: 'var(--bg1)',
    color: 'var(--brand)',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  body: {
    margin: 0,
    color: 'var(--ink)',
    fontSize: 'clamp(1rem, 3.5vw, 1.15rem)',
    lineHeight: 1.75,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: 'auto',
    paddingTop: '1rem',
  },
  button: {
    minWidth: '5.5rem',
    minHeight: '2.75rem',
    borderRadius: '999px',
    border: '1px solid var(--line)',
    padding: '0.65rem 1.25rem',
    background: 'var(--card)',
    color: 'var(--ink)',
    font: 'inherit',
    fontWeight: 600,
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  editButton: {
    borderColor: 'var(--accent)',
    background: 'var(--accent)',
    color: '#fff',
  },
}

export function CaseDetail({ case: item, onClose }: CaseDetailProps) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true))
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{ ...styles.backdrop, opacity: visible ? 1 : 0 }}
    >
      <article style={styles.panel}>
        {item.occurredOn && <p style={styles.meta}>{item.occurredOn}</p>}
        <h2 id={titleId} style={styles.title}>
          {item.title}
        </h2>
        {item.tags.length > 0 && (
          <div style={styles.tags} aria-label="标签">
            {item.tags.map((tag) => (
              <span key={tag} style={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}
        <p style={styles.body}>{item.body}</p>
        <div style={styles.actions}>
          <button ref={closeButtonRef} type="button" style={styles.button} onClick={onClose}>
            关闭
          </button>
          <Link to={`/edit/${item.id}`} style={{ ...styles.button, ...styles.editButton }}>
            编辑
          </Link>
        </div>
      </article>
    </div>
  )
}
