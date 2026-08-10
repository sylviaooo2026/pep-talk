import { createContext, type ReactNode, useContext } from 'react'
import type { CaseRepository } from './CaseRepository'
import { IndexedDbCaseRepository } from './indexedDbCaseRepository'

const RepoContext = createContext<CaseRepository | null>(null)
let defaultRepository: CaseRepository | undefined

function getDefaultRepository(): CaseRepository {
  defaultRepository ??= new IndexedDbCaseRepository()
  return defaultRepository
}

type RepoProviderProps = {
  children?: ReactNode
  repo?: CaseRepository
}

export function RepoProvider({ children, repo }: RepoProviderProps) {
  return <RepoContext.Provider value={repo ?? getDefaultRepository()}>{children}</RepoContext.Provider>
}

export function useCaseRepository(): CaseRepository {
  const repo = useContext(RepoContext)
  if (!repo) throw new Error('useCaseRepository must be used within RepoProvider')
  return repo
}
