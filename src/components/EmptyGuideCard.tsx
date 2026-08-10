import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

export type EmptyGuideCardProps = {
  variant: 'empty' | 'no-results'
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  },
  card: {
    width: 'min(84vw, 22rem)',
    borderRadius: 'var(--radius-card)',
    background: 'var(--card)',
    border: '1px solid var(--line)',
    boxShadow: 'var(--shadow)',
    padding: 'clamp(1.75rem, 6vw, 2.5rem)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.1rem',
  },
  title: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 'clamp(1.25rem, 6vw, 1.55rem)',
    color: 'var(--ink)',
    lineHeight: 1.45,
  },
  hint: {
    margin: 0,
    color: 'var(--ink-muted)',
    lineHeight: 1.6,
  },
  link: {
    color: 'var(--accent)',
    fontWeight: 700,
    textDecoration: 'underline',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    padding: '0 1.5rem',
    borderRadius: '10px',
    background: 'var(--brand)',
    color: 'var(--card)',
    fontWeight: 600,
    textDecoration: 'none',
  },
}

export function EmptyGuideCard({ variant }: EmptyGuideCardProps) {
  if (variant === 'no-results') {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <p style={styles.hint}>
            换个词，或
            <Link to="/new" style={styles.link}>
              先记下来
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={styles.title}>写下第一个成功 — 感受 for 事件</h2>
        <Link to="/new" style={styles.button}>
          开始记录
        </Link>
      </div>
    </div>
  )
}
