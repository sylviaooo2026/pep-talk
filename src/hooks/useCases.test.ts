import { act, createElement, type ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryCaseRepository } from '../data/memoryCaseRepository'
import { RepoProvider } from '../data/repoContext'
import { useCases } from './useCases'

function wrap(repo: MemoryCaseRepository) {
  return ({ children }: { children: ReactNode }) =>
    createElement(RepoProvider, { repo }, children)
}

describe('useCases', () => {
  it('filters by keyword', async () => {
    const repo = new MemoryCaseRepository([
      {
        id: '1',
        title: '焦虑 for 演讲',
        body: '提纲',
        tags: [],
        occurredOn: '2026-08-07',
        createdAt: '2026-08-07T00:00:00.000Z',
        updatedAt: '2026-08-07T00:00:00.000Z',
      },
      {
        id: '2',
        title: '尴尬 for 会议',
        body: '复盘',
        tags: [],
        occurredOn: '2026-08-06',
        createdAt: '2026-08-06T00:00:00.000Z',
        updatedAt: '2026-08-06T00:00:00.000Z',
      },
    ])
    const { result } = renderHook(() => useCases(), { wrapper: wrap(repo) })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.cases).toHaveLength(2)
    act(() => result.current.setKeyword('焦虑'))
    expect(result.current.cases.map((c) => c.id)).toEqual(['1'])
  })
})
