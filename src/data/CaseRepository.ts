import type { Case, ExportPayload } from '../domain/types'

export type CaseInput = {
  title: string
  body: string
  tags: string[]
  occurredOn: string
}

export interface CaseRepository {
  list(): Promise<Case[]>
  get(id: string): Promise<Case | undefined>
  create(input: CaseInput): Promise<Case>
  update(id: string, input: CaseInput): Promise<Case>
  remove(id: string): Promise<void>
  clearAll(): Promise<void>
  exportAll(): Promise<ExportPayload>
  importMerge(raw: unknown): Promise<Case[]>
}
