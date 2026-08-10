import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryCaseRepository } from '../data/memoryCaseRepository'
import { RepoProvider } from '../data/repoContext'
import type { Case } from '../domain/types'
import { EditorPage } from './EditorPage'

function CaseListRoute() {
  const location = useLocation()
  const state = location.state as { focusCaseId?: string } | null

  return (
    <>
      <p>案例列表</p>
      <output aria-label="聚焦案例">{state?.focusCaseId ?? ''}</output>
    </>
  )
}

function renderEditor(path: string, repo: MemoryCaseRepository) {
  return render(
    <RepoProvider repo={repo}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/new" element={<EditorPage />} />
          <Route path="/edit/:id" element={<EditorPage />} />
          <Route path="/" element={<CaseListRoute />} />
        </Routes>
      </MemoryRouter>
    </RepoProvider>,
  )
}

describe('EditorPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('validates and creates a case from the new-case form', async () => {
    const user = userEvent.setup()
    const repo = new MemoryCaseRepository()
    renderEditor('/new', repo)

    await user.click(screen.getByRole('button', { name: '保存案例' }))

    expect(screen.getByText('请输入标题')).toBeInTheDocument()
    expect(screen.getByText('请输入案例内容')).toBeInTheDocument()

    await user.type(screen.getByLabelText('标题'), '焦虑 for 明天演讲')
    await user.type(screen.getByLabelText('案例内容'), '我先写提纲，再练习了三遍。')
    await user.type(screen.getByLabelText('标签'), '演讲, 勇气， 复盘 ')
    await user.click(screen.getByRole('button', { name: '保存案例' }))

    expect(await screen.findByText('案例列表')).toBeInTheDocument()
    const cases = await repo.list()
    expect(cases).toHaveLength(1)
    expect(cases[0]).toMatchObject({
      title: '焦虑 for 明天演讲',
      body: '我先写提纲，再练习了三遍。',
      tags: ['演讲', '勇气', '复盘'],
    })
    expect(screen.getByLabelText('聚焦案例')).toHaveTextContent(cases[0].id)
  })

  it('loads and updates an existing case', async () => {
    const user = userEvent.setup()
    const existing: Case = {
      id: 'case-1',
      title: '紧张 for 汇报',
      body: '先深呼吸。',
      tags: ['工作'],
      occurredOn: '2026-08-09',
      createdAt: '2026-08-09T00:00:00.000Z',
      updatedAt: '2026-08-09T00:00:00.000Z',
    }
    const repo = new MemoryCaseRepository([existing])
    renderEditor('/edit/case-1', repo)

    const title = await screen.findByLabelText('标题')
    expect(title).toHaveValue('紧张 for 汇报')
    expect(screen.getByLabelText('案例内容')).toHaveValue('先深呼吸。')
    expect(screen.getByLabelText('发生日期')).toHaveValue('2026-08-09')

    await user.clear(title)
    await user.type(title, '平静 for 汇报')
    await user.click(screen.getByRole('button', { name: '保存修改' }))

    expect(await screen.findByText('案例列表')).toBeInTheDocument()
    expect(await repo.get('case-1')).toMatchObject({ title: '平静 for 汇报' })
  })

  it('deletes an existing case after confirmation', async () => {
    const user = userEvent.setup()
    const existing: Case = {
      id: 'case-1',
      title: '焦虑 for 演讲',
      body: '完整讲完了。',
      tags: [],
      occurredOn: '2026-08-09',
      createdAt: '2026-08-09T00:00:00.000Z',
      updatedAt: '2026-08-09T00:00:00.000Z',
    }
    const repo = new MemoryCaseRepository([existing])
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderEditor('/edit/case-1', repo)

    await user.click(await screen.findByRole('button', { name: '删除案例' }))

    expect(confirm).toHaveBeenCalledWith('确定删除这条成功案例？')
    await waitFor(async () => expect(await repo.get('case-1')).toBeUndefined())
    expect(await screen.findByText('案例列表')).toBeInTheDocument()
  })
})
