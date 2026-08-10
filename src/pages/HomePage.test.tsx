import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryCaseRepository } from '../data/memoryCaseRepository'
import { RepoProvider } from '../data/repoContext'
import type { Case } from '../domain/types'
import { HomePage } from './HomePage'

class FakeIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly scrollMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

const scrollIntoView = vi.fn()

function renderHome(repo: MemoryCaseRepository, focusCaseId?: string) {
  return render(
    <RepoProvider repo={repo}>
      <MemoryRouter initialEntries={[{ pathname: '/', state: { focusCaseId } }]}>
        <HomePage />
      </MemoryRouter>
    </RepoProvider>,
  )
}

function makeCase(overrides: Partial<Case>): Case {
  return {
    id: overrides.id ?? 'case-1',
    title: overrides.title ?? '焦虑 for 明天演讲',
    body: overrides.body ?? '我先写提纲，再练习了三遍。',
    tags: overrides.tags ?? [],
    occurredOn: overrides.occurredOn ?? '2026-08-09',
    createdAt: overrides.createdAt ?? '2026-08-09T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-08-09T00:00:00.000Z',
  }
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    scrollIntoView.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the empty guide card when the library has no cases', async () => {
    renderHome(new MemoryCaseRepository())

    expect(await screen.findByText('写下第一个成功 — 感受 for 事件')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '开始记录' })).toHaveAttribute('href', '/new')
  })

  it('renders the brand, gear link, and FAB alongside the wheel', async () => {
    renderHome(new MemoryCaseRepository([makeCase({})]))

    expect(await screen.findByText('pep talk')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '设置' })).toHaveAttribute('href', '/settings')
    expect(screen.getByRole('link', { name: '记录新的成功案例' })).toHaveAttribute('href', '/new')
    expect(await screen.findByText('焦虑 for 明天演讲')).toBeInTheDocument()
  })

  it('focuses a newly created case requested by navigation state', async () => {
    renderHome(
      new MemoryCaseRepository([
        makeCase({ id: 'older', title: '较早的案例', occurredOn: '2026-08-08' }),
        makeCase({ id: 'newest', title: '刚刚创建的案例', occurredOn: '2026-08-10' }),
      ]),
      'newest',
    )

    expect(await screen.findByText('刚刚创建的案例')).toBeInTheDocument()
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })

  it('shows the no-results guide when a keyword matches nothing', async () => {
    const user = userEvent.setup()
    renderHome(new MemoryCaseRepository([makeCase({})]))

    await screen.findByText('焦虑 for 明天演讲')
    await user.click(screen.getByRole('button', { name: '展开搜索' }))
    await user.type(screen.getByLabelText('搜索案例'), '不存在的关键词')

    expect(await screen.findByText('先记下来')).toBeInTheDocument()
    expect(screen.queryByText('焦虑 for 明天演讲')).not.toBeInTheDocument()
  })

  it('filters the wheel down to matching cases for a keyword', async () => {
    const user = userEvent.setup()
    renderHome(
      new MemoryCaseRepository([
        makeCase({ id: 'a', title: '焦虑 for 明天演讲', tags: ['演讲'] }),
        makeCase({ id: 'b', title: '平静 for 深夜复盘', tags: ['复盘'] }),
      ]),
    )

    await screen.findByText('焦虑 for 明天演讲')
    await user.click(screen.getByRole('button', { name: '展开搜索' }))
    await user.type(screen.getByLabelText('搜索案例'), '复盘')

    expect(await screen.findByText('平静 for 深夜复盘')).toBeInTheDocument()
    expect(screen.queryByText('焦虑 for 明天演讲')).not.toBeInTheDocument()
  })

  it('opens a case detail overlay and closes it without navigating', async () => {
    const user = userEvent.setup()
    renderHome(
      new MemoryCaseRepository([
        makeCase({
          id: 'detail-case',
          body: '完整记录：我先写提纲，再练习了三遍。',
          tags: ['演讲', '准备'],
        }),
      ]),
    )

    await user.click(await screen.findByRole('button', { name: /焦虑 for 明天演讲/ }))

    const dialog = screen.getByRole('dialog', { name: '焦虑 for 明天演讲' })
    expect(within(dialog).getByText('2026-08-09')).toBeInTheDocument()
    expect(within(dialog).getByText('完整记录：我先写提纲，再练习了三遍。')).toBeInTheDocument()
    expect(within(dialog).getByText('#演讲')).toBeInTheDocument()
    expect(within(dialog).getByText('#准备')).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: '编辑' })).toHaveAttribute(
      'href',
      '/edit/detail-case',
    )

    await user.click(within(dialog).getByRole('button', { name: '关闭' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
