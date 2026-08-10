import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { todayYmd } from '../lib/dates'
import type { CaseRepository } from './CaseRepository'
import { IndexedDbCaseRepository } from './indexedDbCaseRepository'
import { MemoryCaseRepository } from './memoryCaseRepository'

const input = {
  title: '焦虑 for 演讲',
  body: '写提纲',
  tags: ['工作'],
  occurredOn: '2026-08-07',
}

function repositoryContract(
  name: string,
  makeRepository: () => CaseRepository,
): void {
  describe(name, () => {
    let repo: CaseRepository

    beforeEach(async () => {
      repo = makeRepository()
      await repo.clearAll()
    })

    it('creates, gets, and lists cases', async () => {
      const created = await repo.create(input)

      expect(created.id).toBeTruthy()
      expect(created.createdAt).toBeTruthy()
      expect(created.updatedAt).toBe(created.createdAt)
      expect(await repo.get(created.id)).toEqual(created)
      expect(await repo.list()).toEqual([created])
    })

    it('uses today when occurredOn is empty', async () => {
      const created = await repo.create({ ...input, occurredOn: '' })

      expect(created.occurredOn).toBe(todayYmd())
    })

    it('updates an existing case while preserving its creation metadata', async () => {
      const created = await repo.create(input)
      const updated = await repo.update(created.id, {
        title: '平静 for 演讲',
        body: '先深呼吸',
        tags: ['成长'],
        occurredOn: '2026-08-08',
      })

      expect(updated).toMatchObject({
        id: created.id,
        title: '平静 for 演讲',
        body: '先深呼吸',
        tags: ['成长'],
        occurredOn: '2026-08-08',
        createdAt: created.createdAt,
      })
      expect(await repo.get(created.id)).toEqual(updated)
    })

    it('rejects updates for a missing case', async () => {
      await expect(repo.update('missing', input)).rejects.toThrow('Case not found')
    })

    it('removes cases and clears all cases', async () => {
      const first = await repo.create(input)
      await repo.create({ ...input, title: 'second' })

      await repo.remove(first.id)
      expect(await repo.get(first.id)).toBeUndefined()
      expect(await repo.list()).toHaveLength(1)

      await repo.clearAll()
      expect(await repo.list()).toEqual([])
    })

    it('exports all cases', async () => {
      const created = await repo.create(input)

      const payload = await repo.exportAll()

      expect(payload.version).toBe(1)
      expect(new Date(payload.exportedAt).toISOString()).toBe(payload.exportedAt)
      expect(payload.cases).toEqual([created])
    })

    it('imports and merges cases by id', async () => {
      const created = await repo.create({ ...input, title: 'old' })
      const merged = await repo.importMerge({
        version: 1,
        exportedAt: '2026-08-07T00:00:00.000Z',
        cases: [
          { ...created, title: 'new' },
          {
            id: 'other',
            title: '无力 for 延期',
            body: '拆步骤',
            tags: [],
            occurredOn: '2026-08-02',
            createdAt: '2026-08-02T00:00:00.000Z',
            updatedAt: '2026-08-02T00:00:00.000Z',
          },
        ],
      })

      expect(merged).toHaveLength(2)
      expect(merged.find((item) => item.id === created.id)?.title).toBe('new')
      expect(await repo.list()).toEqual(merged)
    })

    it('does not mutate on a bad import', async () => {
      const created = await repo.create({ ...input, title: 'keep' })

      await expect(repo.importMerge({ version: 9 })).rejects.toThrow()

      expect(await repo.list()).toEqual([created])
    })
  })
}

repositoryContract(
  'IndexedDbCaseRepository',
  () => new IndexedDbCaseRepository(`pep-talk-test-${crypto.randomUUID()}`),
)

repositoryContract('MemoryCaseRepository', () => new MemoryCaseRepository())
