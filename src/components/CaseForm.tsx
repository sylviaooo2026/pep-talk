import { useState, type CSSProperties, type FormEvent } from 'react'
import type { CaseInput } from '../data/CaseRepository'
import { isValidYmd, todayYmd } from '../lib/dates'

export type CaseFormProps = {
  initial?: { title: string; body: string; tags: string[]; occurredOn: string }
  submitLabel: string
  onSubmit: (input: CaseInput) => Promise<void>
  onDelete?: () => Promise<void>
}

type FieldErrors = Partial<Record<'title' | 'body' | 'occurredOn', string>>

const styles: Record<string, CSSProperties> = {
  form: {
    display: 'grid',
    gap: '1.15rem',
  },
  field: {
    display: 'grid',
    gap: '0.4rem',
  },
  label: {
    color: 'var(--ink)',
    fontWeight: 600,
  },
  hint: {
    margin: 0,
    color: 'var(--ink-muted)',
    fontSize: '0.9rem',
  },
  control: {
    width: '100%',
    border: '1px solid var(--line)',
    borderRadius: '10px',
    padding: '0.75rem 0.85rem',
    color: 'var(--ink)',
    background: 'var(--card)',
    font: 'inherit',
    fontSize: '1rem',
  },
  textarea: {
    minHeight: '10rem',
    resize: 'vertical',
    lineHeight: 1.6,
  },
  error: {
    margin: 0,
    color: 'var(--danger)',
    fontSize: '0.9rem',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    paddingTop: '0.35rem',
  },
  button: {
    minHeight: '44px',
    flex: '1 1 9rem',
    border: 0,
    borderRadius: '10px',
    padding: '0.7rem 1rem',
    color: 'var(--card)',
    background: 'var(--brand)',
    font: 'inherit',
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteButton: {
    border: '1px solid var(--danger)',
    color: 'var(--danger)',
    background: 'transparent',
  },
}

function parseTags(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function CaseForm({ initial, submitLabel, onSubmit, onDelete }: CaseFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '')
  const [occurredOn, setOccurredOn] = useState(initial?.occurredOn ?? todayYmd())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [operationError, setOperationError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!title.trim()) next.title = '请输入标题'
    if (!body.trim()) next.body = '请输入案例内容'
    if (!isValidYmd(occurredOn)) next.occurredOn = '请选择有效日期'
    return next
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    setOperationError('')
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        tags: parseTags(tags),
        occurredOn,
      })
    } catch {
      setOperationError('保存失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    setDeleting(true)
    setOperationError('')
    try {
      await onDelete()
    } catch {
      setOperationError('删除失败，请稍后重试')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.field}>
        <label htmlFor="case-title" style={styles.label}>
          标题
        </label>
        <input
          id="case-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="焦虑 for 明天演讲"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'case-title-error' : undefined}
          style={styles.control}
        />
        <p style={styles.hint}>用“感受 for 事件”记下当时的处境。</p>
        {errors.title && (
          <p id="case-title-error" role="alert" style={styles.error}>
            {errors.title}
          </p>
        )}
      </div>

      <div style={styles.field}>
        <label htmlFor="case-body" style={styles.label}>
          案例内容
        </label>
        <textarea
          id="case-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="我当时是怎么一步步走出来的…"
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? 'case-body-error' : undefined}
          style={{ ...styles.control, ...styles.textarea }}
        />
        {errors.body && (
          <p id="case-body-error" role="alert" style={styles.error}>
            {errors.body}
          </p>
        )}
      </div>

      <div style={styles.field}>
        <label htmlFor="case-tags" style={styles.label}>
          标签
        </label>
        <input
          id="case-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="演讲, 工作, 勇气"
          style={styles.control}
        />
        <p style={styles.hint}>可用中文或英文逗号分隔。</p>
      </div>

      <div style={styles.field}>
        <label htmlFor="case-date" style={styles.label}>
          发生日期
        </label>
        <input
          id="case-date"
          type="date"
          value={occurredOn}
          onChange={(event) => setOccurredOn(event.target.value)}
          aria-invalid={Boolean(errors.occurredOn)}
          aria-describedby={errors.occurredOn ? 'case-date-error' : undefined}
          style={styles.control}
        />
        {errors.occurredOn && (
          <p id="case-date-error" role="alert" style={styles.error}>
            {errors.occurredOn}
          </p>
        )}
      </div>

      {operationError && (
        <p role="alert" style={styles.error}>
          {operationError}
        </p>
      )}

      <div style={styles.actions}>
        <button type="submit" disabled={submitting || deleting} style={styles.button}>
          {submitting ? '保存中…' : submitLabel}
        </button>
        {onDelete && (
          <button
            type="button"
            disabled={submitting || deleting}
            onClick={handleDelete}
            style={{ ...styles.button, ...styles.deleteButton }}
          >
            {deleting ? '删除中…' : '删除案例'}
          </button>
        )}
      </div>
    </form>
  )
}
