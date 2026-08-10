import type { Case, ExportPayload } from './types'

export function filterCases(cases: Case[], keyword: string): Case[] {
  const q = keyword.trim().toLowerCase()
  if (!q) return cases
  return cases.filter((c) => {
    if (c.title.toLowerCase().includes(q)) return true
    if (c.body.toLowerCase().includes(q)) return true
    return c.tags.some((t) => t.toLowerCase().includes(q))
  })
}

export function sortCases(cases: Case[]): Case[] {
  return [...cases].sort((a, b) => {
    if (a.occurredOn !== b.occurredOn) return a.occurredOn < b.occurredOn ? 1 : -1
    if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? 1 : -1
    return 0
  })
}

function isCase(value: unknown): value is Case {
  if (!value || typeof value !== 'object') return false
  const c = value as Record<string, unknown>
  return (
    typeof c.id === 'string' &&
    typeof c.title === 'string' &&
    typeof c.body === 'string' &&
    Array.isArray(c.tags) &&
    c.tags.every((t) => typeof t === 'string') &&
    typeof c.occurredOn === 'string' &&
    typeof c.createdAt === 'string' &&
    typeof c.updatedAt === 'string'
  )
}

export function parseExportPayload(raw: unknown): ExportPayload {
  if (!raw || typeof raw !== 'object') throw new Error('备份文件无效')
  const obj = raw as Record<string, unknown>
  if (obj.version !== 1) throw new Error('不支持的备份版本')
  if (typeof obj.exportedAt !== 'string') throw new Error('备份文件无效')
  if (!Array.isArray(obj.cases) || !obj.cases.every(isCase)) throw new Error('备份文件无效')
  return { version: 1, exportedAt: obj.exportedAt, cases: obj.cases }
}

export function mergeCases(existing: Case[], incoming: Case[]): Case[] {
  const map = new Map(existing.map((c) => [c.id, c]))
  for (const c of incoming) map.set(c.id, c)
  return [...map.values()]
}
