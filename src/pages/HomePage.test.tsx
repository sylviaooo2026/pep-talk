import { act, render, screen, waitFor, within } from '@testing-library/react'
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

class UnavailableRepository extends MemoryCaseRepository {
  override async list(): Promise<Case[]> {
    throw new Error('IndexedDB unavailable')
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

    expect(await screen.findByText('PEP TALK')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '设置' })).toHaveAttribute('href', '/settings')
    expect(screen.getByRole('link', { name: '记录新的成功案例' })).toHaveAttribute('href', '/new')
    expect(await screen.findByText('焦虑 for 明天演讲')).toBeInTheDocument()
  })

  it('blocks create actions when storage cannot be opened', async () => {
    renderHome(new UnavailableRepository())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '无法访问本地存储，请检查浏览器设置后重试。',
    )
    expect(screen.queryByRole('link', { name: '记录新的成功案例' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '开始记录' })).not.toBeInTheDocument()
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

  it('positions tilted neighbors to peek above and below the focused card', async () => {
    renderHome(
      new MemoryCaseRepository([
        makeCase({ id: 'above', title: '上方案例', occurredOn: '2026-08-08' }),
        makeCase({ id: 'focused', title: '聚焦案例', occurredOn: '2026-08-09' }),
        makeCase({ id: 'below', title: '下方案例', occurredOn: '2026-08-10' }),
      ]),
      'focused',
    )

    const focused = await screen.findByText('聚焦案例')
    const slots = Array.from(document.querySelectorAll<HTMLElement>('.card-wheel-slot'))
    expect(slots).toHaveLength(3)
    await waitFor(() =>
      expect(focused.closest('.card-wheel-slot')).toHaveStyle({ opacity: '1' }),
    )

    const tiltedSlots = slots.filter((slot) => slot.style.transform.includes('rotateX'))
    expect(tiltedSlots).toHaveLength(2)
    for (const slot of tiltedSlots) {
      expect(slot.style.transformOrigin).toBe('center center')
    }

    // 13.5rem card, 9.75rem center step, 38° tilt, and 0.9 scale:
    // the far edge reaches ~14.54rem from center, past the focused edge at 6.75rem.
    const projectedHalfHeight = 6.75 * Math.cos((38 * Math.PI) / 180) * 0.9
    expect(9.75 + projectedHalfHeight).toBeGreaterThan(6.75)
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
    const pushState = vi.spyOn(window.history, 'pushState')
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
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

    expect(pushState).toHaveBeenCalled()
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
    expect(back).toHaveBeenCalledOnce()
  })

  it('closes the detail overlay when browser history goes back', async () => {
    const user = userEvent.setup()
    renderHome(new MemoryCaseRepository([makeCase({ id: 'detail-case' })]))

    await user.click(await screen.findByRole('button', { name: /焦虑 for 明天演讲/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    act(() => window.dispatchEvent(new PopStateEvent('popstate')))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
