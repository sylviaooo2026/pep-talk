import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryCaseRepository } from '../data/memoryCaseRepository'
import { RepoProvider } from '../data/repoContext'
import type { Case, ExportPayload } from '../domain/types'
import { SettingsPage } from './SettingsPage'

const existingCase: Case = {
  id: 'case-1',
  title: '紧张 for 演讲',
  body: '我完成了整场演讲。',
  tags: ['演讲'],
  occurredOn: '2026-08-09',
  createdAt: '2026-08-09T00:00:00.000Z',
  updatedAt: '2026-08-09T00:00:00.000Z',
}

function renderSettings(repo = new MemoryCaseRepository([existingCase])) {
  return {
    repo,
    ...render(
      <RepoProvider repo={repo}>
        <MemoryRouter initialEntries={['/settings']}>
          <Routes>
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<p>案例列表</p>} />
          </Routes>
        </MemoryRouter>
      </RepoProvider>,
    ),
  }
}

describe('SettingsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('shows the product blurb and current case count', async () => {
    renderSettings()

    expect(
      screen.getByText(
        '记录你的成功案例。下一次那种感觉来时，它们会告诉你：你曾经成功过。',
      ),
    ).toBeInTheDocument()
    expect(await screen.findByText('案例总数：1')).toBeInTheDocument()
  })

  it('exports a dated JSON backup', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn(() => 'blob:backup')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)

    renderSettings()
    await user.click(screen.getByRole('button', { name: '导出备份' }))

    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    const anchor = click.mock.instances[0] as HTMLAnchorElement
    expect(anchor.download).toMatch(/^pep-talk-backup-\d{8}\.json$/)
    expect(anchor.href).toBe('blob:backup')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:backup')
  })

  it('merge-imports a JSON backup and reports success', async () => {
    const user = userEvent.setup()
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    const { repo } = renderSettings(new MemoryCaseRepository())
    const payload: ExportPayload = {
      version: 1,
      exportedAt: '2026-08-10T00:00:00.000Z',
      cases: [existingCase],
    }
    const file = new File([JSON.stringify(payload)], 'backup.json', {
      type: 'application/json',
    })

    await user.upload(screen.getByLabelText('导入备份'), file)

    await waitFor(() => expect(alert).toHaveBeenCalledWith('导入成功'))
    expect(await repo.list()).toEqual([existingCase])
    expect(await screen.findByText('案例总数：1')).toBeInTheDocument()
  })

  it('shows import errors and leaves the library unchanged', async () => {
    const user = userEvent.setup()
    const { repo } = renderSettings()
    const file = new File(['{"version":2}'], 'bad.json', {
      type: 'application/json',
    })

    await user.upload(screen.getByLabelText('导入备份'), file)

    expect(await screen.findByRole('alert')).toHaveTextContent('不支持的备份版本')
    expect(await repo.list()).toEqual([existingCase])
  })

  it('only enables clearing for the exact confirmation word, then goes home', async () => {
    const user = userEvent.setup()
    const { repo } = renderSettings()
    const clearButton = screen.getByRole('button', { name: '清空全部案例' })
    const confirmation = screen.getByLabelText('输入“清空”以确认')

    expect(clearButton).toBeDisabled()
    await user.type(confirmation, '清空 ')
    expect(clearButton).toBeDisabled()
    await user.clear(confirmation)
    await user.type(confirmation, '清空')
    expect(clearButton).toBeEnabled()
    await user.click(clearButton)

    expect(await screen.findByText('案例列表')).toBeInTheDocument()
    expect(await repo.list()).toEqual([])
  })
})
