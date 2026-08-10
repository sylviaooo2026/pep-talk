import { describe, expect, it } from 'vitest'
import { filterCases, mergeCases, parseExportPayload, sortCases } from './caseLogic'
import type { Case } from './types'

const base = (over: Partial<Case> & Pick<Case, 'id' | 'title'>): Case => ({
  body: 'body',
  tags: [],
  occurredOn: '2026-01-01',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...over,
})

describe('filterCases', () => {
  const cases = [
    base({ id: '1', title: '焦虑 for 演讲', body: '写提纲', tags: ['工作'] }),
    base({ id: '2', title: '尴尬 for 会议', body: '复盘', tags: ['人际'] }),
  ]
  it('matches title/body/tags case-insensitively', () => {
    expect(filterCases(cases, '焦虑').map((c) => c.id)).toEqual(['1'])
    expect(filterCases(cases, '复盘').map((c) => c.id)).toEqual(['2'])
    expect(filterCases(cases, '人际').map((c) => c.id)).toEqual(['2'])
  })
  it('empty keyword returns all', () => {
    expect(filterCases(cases, '   ')).toHaveLength(2)
  })
})

describe('sortCases', () => {
  it('sorts by occurredOn desc then updatedAt desc', () => {
    const cases = [
      base({ id: 'a', title: 'a', occurredOn: '2026-01-01', updatedAt: '2026-01-02T00:00:00.000Z' }),
      base({ id: 'b', title: 'b', occurredOn: '2026-02-01', updatedAt: '2026-01-01T00:00:00.000Z' }),
      base({ id: 'c', title: 'c', occurredOn: '2026-02-01', updatedAt: '2026-03-01T00:00:00.000Z' }),
    ]
    expect(sortCases(cases).map((c) => c.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('mergeCases + parseExportPayload', () => {
  it('overwrites same id and appends new', () => {
    const existing = [base({ id: '1', title: 'old' })]
    const incoming = [base({ id: '1', title: 'new' }), base({ id: '2', title: 'extra' })]
    const merged = mergeCases(existing, incoming)
    expect(merged.find((c) => c.id === '1')?.title).toBe('new')
    expect(merged.map((c) => c.id).sort()).toEqual(['1', '2'])
  })
  it('rejects bad payload', () => {
    expect(() => parseExportPayload({ version: 2, cases: [] })).toThrow()
    expect(() => parseExportPayload(null)).toThrow()
  })
  it('accepts version 1 payload', () => {
    const payload = parseExportPayload({
      version: 1,
      exportedAt: '2026-08-07T00:00:00.000Z',
      cases: [base({ id: '1', title: '焦虑 for 演讲' })],
    })
    expect(payload.cases).toHaveLength(1)
  })
})
