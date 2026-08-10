import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SettingsPanel } from '../components/SettingsPanel'
import { useCases } from '../hooks/useCases'

const styles: Record<string, CSSProperties> = {
  page: {
    width: 'min(100% - 2rem, 42rem)',
    margin: '0 auto',
    padding: 'max(1.25rem, env(safe-area-inset-top)) 0 max(2rem, env(safe-area-inset-bottom))',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.25rem',
  },
  back: {
    color: 'var(--accent)',
    fontWeight: 700,
    textDecoration: 'none',
  },
  title: {
    margin: 0,
    color: 'var(--brand)',
    fontSize: '2rem',
  },
  error: {
    padding: '1rem',
    border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-card)',
    color: 'var(--danger)',
    background: 'var(--card)',
  },
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { allCount, error, exportAll, importMerge, clearAll } = useCases()

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <Link to="/" style={styles.back}>
          ← 返回
        </Link>
        <h1 style={styles.title}>设置</h1>
      </header>
      {error ? (
        <p role="alert" style={styles.error}>
          无法访问本地存储，请检查浏览器设置后重试。
        </p>
      ) : (
        <SettingsPanel
          allCount={allCount}
          exportAll={exportAll}
          importMerge={importMerge}
          clearAll={clearAll}
          onClearComplete={() => navigate('/')}
        />
      )}
    </main>
  )
}
