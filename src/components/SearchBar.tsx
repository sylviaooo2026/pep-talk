import { useRef, useState, type CSSProperties } from 'react'

export type SearchBarProps = {
  value: string
  onChange: (value: string) => void
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  field: {
    width: 0,
    opacity: 0,
    overflow: 'hidden',
    marginRight: 0,
    transition: 'width 220ms ease, opacity 180ms ease, margin 220ms ease',
  },
  fieldOpen: {
    width: 'clamp(8.5rem, 42vw, 14rem)',
    opacity: 1,
    marginRight: '0.5rem',
  },
  input: {
    width: '100%',
    height: '2.5rem',
    border: '1px solid var(--line)',
    borderRadius: '999px',
    padding: '0 1rem',
    background: 'var(--card)',
    color: 'var(--ink)',
    font: 'inherit',
    fontSize: '0.95rem',
  },
  toggle: {
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
    fontSize: '1.1rem',
    cursor: 'pointer',
  },
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleToggle() {
    setOpen((prev) => {
      const next = !prev
      if (next) {
        requestAnimationFrame(() => inputRef.current?.focus())
      } else if (value) {
        onChange('')
      }
      return next
    })
  }

  return (
    <div style={styles.wrap}>
      <div style={{ ...styles.field, ...(open ? styles.fieldOpen : null) }}>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="搜索标题、内容或标签"
          aria-label="搜索案例"
          style={styles.input}
          tabIndex={open ? 0 : -1}
          aria-hidden={open ? undefined : true}
        />
      </div>
      <button
        type="button"
        onClick={handleToggle}
        style={styles.toggle}
        aria-label={open ? '收起搜索' : '展开搜索'}
        aria-expanded={open}
      >
        {open ? '×' : '⌕'}
      </button>
    </div>
  )
}
