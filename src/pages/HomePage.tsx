import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CardWheel } from '../components/CardWheel'
import { EmptyGuideCard } from '../components/EmptyGuideCard'
import { SearchBar } from '../components/SearchBar'
import { useCases } from '../hooks/useCases'

const styles: Record<string, CSSProperties> = {
  page: {
    position: 'relative',
    height: '100dvh',
    overflow: 'hidden',
  },
  topbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    padding: 'max(1rem, env(safe-area-inset-top)) 1.1rem 1.5rem',
    background:
      'linear-gradient(180deg, rgba(247,250,251,0.94) 0%, rgba(247,250,251,0.6) 65%, rgba(247,250,251,0) 100%)',
    pointerEvents: 'none',
  },
  brand: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 'clamp(1.7rem, 8vw, 2.2rem)',
    color: 'var(--brand)',
    letterSpacing: '-0.01em',
    pointerEvents: 'auto',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    pointerEvents: 'auto',
  },
  gear: {
    width: '2.5rem',
    height: '2.5rem',
    flexShrink: 0,
    borderRadius: '50%',
    border: '1px solid var(--line)',
    background: 'var(--card)',
    color: 'var(--ink)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    textDecoration: 'none',
  },
  stage: {
    position: 'absolute',
    inset: 0,
  },
  status: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--ink-muted)',
  },
  fab: {
    position: 'fixed',
    right: 'max(1.25rem, env(safe-area-inset-right))',
    bottom: 'max(1.5rem, env(safe-area-inset-bottom))',
    width: '3.5rem',
    height: '3.5rem',
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.9rem',
    lineHeight: 1,
    textDecoration: 'none',
    boxShadow: 'var(--shadow)',
    zIndex: 20,
  },
}

export function HomePage() {
  const navigate = useNavigate()
  const { cases, allCount, keyword, setKeyword, loading } = useCases()

  const isSearching = keyword.trim().length > 0
  const showEmptyLibrary = !loading && allCount === 0
  const showNoResults = !loading && !showEmptyLibrary && isSearching && cases.length === 0

  return (
    <div style={styles.page}>
      <header style={styles.topbar}>
        <h1 style={styles.brand}>pep talk</h1>
        <div style={styles.actions}>
          <SearchBar value={keyword} onChange={setKeyword} />
          <Link to="/settings" style={styles.gear} aria-label="设置">
            ⚙
          </Link>
        </div>
      </header>

      <div style={styles.stage}>
        {loading ? (
          <p style={styles.status}>正在加载…</p>
        ) : showEmptyLibrary ? (
          <EmptyGuideCard variant="empty" />
        ) : showNoResults ? (
          <EmptyGuideCard variant="no-results" />
        ) : (
          <CardWheel cases={cases} onSelect={(item) => navigate(`/edit/${item.id}`)} />
        )}
      </div>

      <Link to="/new" style={styles.fab} aria-label="记录新的成功案例">
        +
      </Link>
    </div>
  )
}
