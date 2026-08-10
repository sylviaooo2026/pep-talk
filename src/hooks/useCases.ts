import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CaseInput } from '../data/CaseRepository'
import { useCaseRepository } from '../data/repoContext'
import { filterCases, sortCases } from '../domain/caseLogic'
import type { Case, ExportPayload } from '../domain/types'

type UseCasesResult = {
  cases: Case[]
  allCount: number
  keyword: string
  setKeyword: (keyword: string) => void
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (input: CaseInput) => Promise<Case>
  update: (id: string, input: CaseInput) => Promise<Case>
  remove: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  exportAll: () => Promise<ExportPayload>
  importMerge: (raw: unknown) => Promise<void>
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败'
}

export function useCases(): UseCasesResult {
  const repo = useCaseRepository()
  const [all, setAll] = useState<Case[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAll(await repo.list())
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setLoading(false)
    }
  }, [repo])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input: CaseInput) => {
      try {
        const created = await repo.create(input)
        await refresh()
        return created
      } catch (cause) {
        setError(errorMessage(cause))
        throw cause
      }
    },
    [refresh, repo],
  )

  const update = useCallback(
    async (id: string, input: CaseInput) => {
      try {
        const updated = await repo.update(id, input)
        await refresh()
        return updated
      } catch (cause) {
        setError(errorMessage(cause))
        throw cause
      }
    },
    [refresh, repo],
  )

  const remove = useCallback(
    async (id: string) => {
      try {
        await repo.remove(id)
        await refresh()
      } catch (cause) {
        setError(errorMessage(cause))
        throw cause
      }
    },
    [refresh, repo],
  )

  const clearAll = useCallback(async () => {
    try {
      await repo.clearAll()
      setAll([])
      setError(null)
    } catch (cause) {
      setError(errorMessage(cause))
      throw cause
    }
  }, [repo])

  const exportAll = useCallback(async () => {
    try {
      return await repo.exportAll()
    } catch (cause) {
      setError(errorMessage(cause))
      throw cause
    }
  }, [repo])

  const importMerge = useCallback(
    async (raw: unknown) => {
      try {
        setAll(await repo.importMerge(raw))
        setError(null)
      } catch (cause) {
        setError(errorMessage(cause))
        throw cause
      }
    },
    [repo],
  )

  const cases = useMemo(() => sortCases(filterCases(all, keyword)), [all, keyword])

  return {
    cases,
    allCount: all.length,
    keyword,
    setKeyword,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
    clearAll,
    exportAll,
    importMerge,
  }
}
