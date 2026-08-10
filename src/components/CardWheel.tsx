import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Case } from '../domain/types'
import { CaseCard } from './CaseCard'

export type CardWheelProps = {
  cases: Case[]
  onSelect: (item: Case) => void
  focusCaseId?: string
}

const VISIBLE_RADIUS = 2
// Card is `min-height: 13.5rem` (see CaseCard), so its half-height is ~6.75rem.
// The step must clear that half-height (plus a visible peek margin) so neighbor
// cards are not fully covered by the focused card's footprint before rotation
// even pulls their far edge back toward the vanishing point.
const CARD_STEP_REM = 9.75
const TILT_DEG = 38

function scrollBehavior(): ScrollBehavior {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'smooth'
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

const styles: Record<string, CSSProperties> = {
  wheel: {
    position: 'absolute',
    inset: 0,
    overflowY: 'auto',
    scrollSnapType: 'y mandatory',
    WebkitOverflowScrolling: 'touch',
  },
  // Drives scroll distance/snap points only — stays invisible, one "page" per case.
  spacer: {
    height: '100dvh',
    scrollSnapAlign: 'center',
    scrollSnapStop: 'always',
  },
  // Pinned via position: sticky so the 3D stack renders at a fixed spot in the
  // viewport while the spacers underneath drive which index is "active". This
  // keeps neighbor cards visible at rest instead of a full viewport away.
  stage: {
    position: 'sticky',
    top: 0,
    perspective: '1200px',
    pointerEvents: 'none',
  },
  cardSlot: {
    position: 'absolute',
    top: '50dvh',
    left: '50%',
    pointerEvents: 'auto',
    willChange: 'transform, opacity',
  },
}

function neighborStyle(distance: number): CSSProperties {
  if (distance === 0) {
    return { transform: 'translate(-50%, -50%)', opacity: 1, zIndex: 3 }
  }
  const abs = Math.min(Math.abs(distance), VISIBLE_RADIUS)
  const sign = distance < 0 ? -1 : 1
  const scale = 1 - abs * 0.1
  const opacity = Math.max(1 - abs * 0.42, 0.16)
  const offsetRem = sign * abs * CARD_STEP_REM
  const angle = distance < 0 ? TILT_DEG : -TILT_DEG
  return {
    transform: `translate(-50%, -50%) translateY(${offsetRem}rem) rotateX(${angle}deg) scale(${scale})`,
    transformOrigin: 'center center',
    opacity,
    zIndex: 2 - abs,
  }
}

export function CardWheel({ cases, onSelect, focusCaseId }: CardWheelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const spacerRefs = useRef<Array<HTMLDivElement | null>>([])
  const focusedCaseRef = useRef<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(cases.length - 1, 0)))
  }, [cases.length])

  useEffect(() => {
    if (!focusCaseId || focusedCaseRef.current === focusCaseId) return

    const index = cases.findIndex((item) => item.id === focusCaseId)
    if (index < 0) return

    focusedCaseRef.current = focusCaseId
    setActiveIndex(index)
    spacerRefs.current[index]?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' })
  }, [cases, focusCaseId])

  useEffect(() => {
    const root = containerRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return

    const ratios = new Map<number, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.index)
          ratios.set(index, entry.intersectionRatio)
        }
        let bestIndex = -1
        let bestRatio = 0
        for (const [index, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestIndex = index
          }
        }
        if (bestIndex >= 0) setActiveIndex(bestIndex)
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    for (const spacer of spacerRefs.current) {
      if (spacer) observer.observe(spacer)
    }

    return () => observer.disconnect()
  }, [cases])

  function goTo(index: number) {
    spacerRefs.current[index]?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' })
  }

  return (
    <div ref={containerRef} style={styles.wheel}>
      <div style={styles.stage}>
        {cases.map((item, index) => {
          const distance = index - activeIndex
          if (Math.abs(distance) > VISIBLE_RADIUS) return null
          const active = distance === 0
          return (
            <div
              key={item.id}
              className="card-wheel-slot"
              style={{ ...styles.cardSlot, ...neighborStyle(distance) }}
            >
              <CaseCard
                case={item}
                active={active}
                onSelect={() => (active ? onSelect(item) : goTo(index))}
              />
            </div>
          )
        })}
      </div>
      {cases.map((item, index) => (
        <div
          key={item.id}
          ref={(el) => {
            spacerRefs.current[index] = el
          }}
          data-index={index}
          data-case-id={item.id}
          style={styles.spacer}
        />
      ))}
    </div>
  )
}
