import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { mergeCases, parseExportPayload } from '../domain/caseLogic'
import type { Case, ExportPayload } from '../domain/types'
import { todayYmd } from '../lib/dates'
import { createId } from '../lib/id'
import type { CaseInput, CaseRepository } from './CaseRepository'

interface CaseDatabase extends DBSchema {
  cases: {
    key: string
    value: Case
  }
}

export class IndexedDbCaseRepository implements CaseRepository {
  private readonly database: Promise<IDBPDatabase<CaseDatabase>>

  constructor(databaseName = 'pep-talk') {
    this.database = openDB<CaseDatabase>(databaseName, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('cases')) {
          database.createObjectStore('cases', { keyPath: 'id' })
        }
      },
    })
  }

  async list(): Promise<Case[]> {
    return (await this.database).getAll('cases')
  }

  async get(id: string): Promise<Case | undefined> {
    return (await this.database).get('cases', id)
  }

  async create(input: CaseInput): Promise<Case> {
    const timestamp = new Date().toISOString()
    const item: Case = {
      ...input,
      id: createId(),
      occurredOn: input.occurredOn || todayYmd(),
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await (await this.database).add('cases', item)
    return item
  }

  async update(id: string, input: CaseInput): Promise<Case> {
    const database = await this.database
    const transaction = database.transaction('cases', 'readwrite')
    const existing = await transaction.store.get(id)
    if (!existing) {
      await transaction.done
      throw new Error('Case not found')
    }

    const item: Case = {
      ...existing,
      ...input,
      occurredOn: input.occurredOn || todayYmd(),
      updatedAt: new Date().toISOString(),
    }
    await transaction.store.put(item)
    await transaction.done
    return item
  }

  async remove(id: string): Promise<void> {
    await (await this.database).delete('cases', id)
  }

  async clearAll(): Promise<void> {
    await (await this.database).clear('cases')
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
    const transaction = (await this.database).transaction('cases', 'readwrite')
    await Promise.all(merged.map((item) => transaction.store.put(item)))
    await transaction.done
    return this.list()
  }
}
