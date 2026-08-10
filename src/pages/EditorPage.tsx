import type { CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CaseForm } from '../components/CaseForm'
import { useCases } from '../hooks/useCases'

const styles: Record<string, CSSProperties> = {
  page: {
    width: 'min(100% - 2rem, 42rem)',
    margin: '0 auto',
    padding: 'clamp(1.25rem, 5vw, 3rem) 0',
  },
  back: {
    display: 'inline-block',
    marginBottom: '1rem',
    color: 'var(--accent)',
    fontWeight: 600,
    textDecoration: 'none',
  },
  card: {
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-card)',
    padding: 'clamp(1.1rem, 4vw, 2rem)',
    background: 'var(--card)',
    boxShadow: 'var(--shadow)',
  },
  heading: {
    margin: '0 0 0.35rem',
    color: 'var(--ink)',
    fontSize: 'clamp(1.8rem, 8vw, 2.5rem)',
  },
  intro: {
    margin: '0 0 1.5rem',
    color: 'var(--ink-muted)',
    lineHeight: 1.6,
  },
  status: {
    color: 'var(--ink-muted)',
  },
  error: {
    color: 'var(--danger)',
  },
}

export function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cases, loading, error, create, update, remove } = useCases()
  const editing = Boolean(id)
  const existing = editing ? cases.find((item) => item.id === id) : undefined

  if (editing && loading) {
    return (
      <main style={styles.page}>
        <p style={styles.status}>正在加载案例…</p>
      </main>
    )
  }

  if (editing && !existing) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.heading}>没有找到这条案例</h1>
          <p style={styles.error}>{error || '它可能已经被删除。'}</p>
          <Link to="/" style={styles.back}>
            返回案例列表
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <Link to="/" style={styles.back}>
        ← 返回案例列表
      </Link>
      <section style={styles.card} aria-labelledby="editor-title">
        <h1 id="editor-title" style={styles.heading}>
          {editing ? '编辑成功案例' : '记录成功案例'}
        </h1>
        <p style={styles.intro}>
          写下曾经的感受、面对的事件，以及你是如何一步步走出来的。
        </p>
        <CaseForm
          initial={existing}
          submitLabel={editing ? '保存修改' : '保存案例'}
          onSubmit={async (input) => {
            if (editing && id) {
              await update(id, input)
              navigate('/')
            } else {
              const created = await create(input)
              navigate('/', { state: { focusCaseId: created.id } })
            }
          }}
          onDelete={
            editing && id
              ? async () => {
                  if (!window.confirm('确定删除这条成功案例？')) return
                  await remove(id)
                  navigate('/')
                }
              : undefined
          }
        />
      </section>
    </main>
  )
}
