import { mergeCases, parseExportPayload } from '../domain/caseLogic'
import type { Case, ExportPayload } from '../domain/types'
import { todayYmd } from '../lib/dates'
import { createId } from '../lib/id'
import type { CaseInput, CaseRepository } from './CaseRepository'

function cloneCase(item: Case): Case {
  return { ...item, tags: [...item.tags] }
}

export class MemoryCaseRepository implements CaseRepository {
  private readonly cases = new Map<string, Case>()

  async list(): Promise<Case[]> {
    return [...this.cases.values()].map(cloneCase)
  }

  async get(id: string): Promise<Case | undefined> {
    const item = this.cases.get(id)
    return item ? cloneCase(item) : undefined
  }

  async create(input: CaseInput): Promise<Case> {
    const timestamp = new Date().toISOString()
    const stored = cloneCase({
      ...input,
      id: createId(),
      occurredOn: input.occurredOn || todayYmd(),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    this.cases.set(stored.id, stored)
    return cloneCase(stored)
  }

  async update(id: string, input: CaseInput): Promise<Case> {
    const existing = this.cases.get(id)
    if (!existing) throw new Error('Case not found')

    const stored = cloneCase({
      ...existing,
      ...input,
      occurredOn: input.occurredOn || todayYmd(),
      updatedAt: new Date().toISOString(),
    })
    this.cases.set(id, stored)
    return cloneCase(stored)
  }

  async remove(id: string): Promise<void> {
    this.cases.delete(id)
  }

  async clearAll(): Promise<void> {
    this.cases.clear()
  }

  async exportAll(): Promise<ExportPayload> {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      cases: await this.list(),
    }
  }

  async importMerge(raw: unknown): Promise<Case[]> {
    const payload = parseExportPayload(raw)
    const merged = mergeCases(await this.list(), payload.cases)
    for (const item of merged) this.cases.set(item.id, cloneCase(item))
    return this.list()
  }
}
