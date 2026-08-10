import { useState, type ChangeEvent, type CSSProperties } from 'react'
import type { ExportPayload } from '../domain/types'
import { todayYmd } from '../lib/dates'

type SettingsPanelProps = {
  allCount: number
  exportAll: () => Promise<ExportPayload>
  importMerge: (raw: unknown) => Promise<void>
  clearAll: () => Promise<void>
  onClearComplete: () => void
}

const styles: Record<string, CSSProperties> = {
  stack: {
    display: 'grid',
    gap: '1rem',
  },
  card: {
    padding: '1.25rem',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-card)',
    background: 'var(--card)',
    boxShadow: 'var(--shadow)',
  },
  heading: {
    margin: '0 0 0.35rem',
    fontSize: '1.2rem',
  },
  copy: {
    margin: '0 0 1rem',
    color: 'var(--ink-muted)',
    lineHeight: 1.55,
  },
  count: {
    margin: 0,
    fontWeight: 700,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  button: {
    minHeight: '2.75rem',
    padding: '0.65rem 1rem',
    border: '1px solid var(--accent)',
    borderRadius: '0.7rem',
    background: 'var(--accent)',
    color: '#fff',
    font: 'inherit',
    fontWeight: 700,
    cursor: 'pointer',
  },
  fileLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '2.75rem',
    padding: '0.65rem 1rem',
    border: '1px solid var(--accent)',
    borderRadius: '0.7rem',
    color: 'var(--accent)',
    fontWeight: 700,
    cursor: 'pointer',
  },
  fileInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
  input: {
    width: '100%',
    minHeight: '2.75rem',
    marginBottom: '0.75rem',
    padding: '0.65rem 0.75rem',
    border: '1px solid var(--line)',
    borderRadius: '0.7rem',
    background: '#fff',
    color: 'var(--ink)',
    font: 'inherit',
  },
  dangerButton: {
    minHeight: '2.75rem',
    padding: '0.65rem 1rem',
    border: 0,
    borderRadius: '0.7rem',
    background: 'var(--danger)',
    color: '#fff',
    font: 'inherit',
    fontWeight: 700,
  },
  error: {
    margin: '0.75rem 0 0',
    color: 'var(--danger)',
  },
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : '操作失败'
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('无法读取备份文件'))
    reader.readAsText(file)
  })
}

export function SettingsPanel({
  allCount,
  exportAll,
  importMerge,
  clearAll,
  onClearComplete,
}: SettingsPanelProps) {
  const [confirmWord, setConfirmWord] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleExport() {
    setBusy(true)
    setError(null)
    try {
      const payload = await exportAll()
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `pep-talk-backup-${todayYmd().replaceAll('-', '')}.json`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setBusy(true)
    setError(null)
    try {
      const raw = JSON.parse(await readFile(file))
      await importMerge(raw)
      window.alert('导入成功')
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      event.target.value = ''
      setBusy(false)
    }
  }

  async function handleClear() {
    setBusy(true)
    setError(null)
    try {
      await clearAll()
      onClearComplete()
    } catch (cause) {
      setError(errorMessage(cause))
      setBusy(false)
    }
  }

  return (
    <div style={styles.stack}>
      <section style={styles.card}>
        <h2 style={styles.heading}>关于 pep talk</h2>
        <p style={styles.copy}>
          记录你的成功案例。下一次那种感觉来时，它们会告诉你：你曾经成功过。
        </p>
        <p style={styles.count}>案例总数：{allCount}</p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.heading}>备份与恢复</h2>
        <p style={styles.copy}>导出全部案例，或合并导入以前的 JSON 备份。</p>
        <div style={styles.actions}>
          <button type="button" style={styles.button} disabled={busy} onClick={handleExport}>
            导出备份
          </button>
          <label style={styles.fileLabel}>
            导入备份
            <input
              type="file"
              accept="application/json,.json"
              style={styles.fileInput}
              disabled={busy}
              onChange={handleImport}
            />
          </label>
        </div>
        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}
      </section>

      <section style={styles.card}>
        <h2 style={styles.heading}>清空案例</h2>
        <p style={styles.copy}>此操作无法撤销。请输入“清空”以确认。</p>
        <label>
          <span>输入“清空”以确认</span>
          <input
            type="text"
            value={confirmWord}
            style={styles.input}
            onChange={(event) => setConfirmWord(event.target.value)}
          />
        </label>
        <button
          type="button"
          style={{
            ...styles.dangerButton,
            cursor: confirmWord === '清空' && !busy ? 'pointer' : 'not-allowed',
            opacity: confirmWord === '清空' && !busy ? 1 : 0.45,
          }}
          disabled={confirmWord !== '清空' || busy}
          onClick={handleClear}
        >
          清空全部案例
        </button>
      </section>
    </div>
  )
}
