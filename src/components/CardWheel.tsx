import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Case } from '../domain/types'
import { CaseCard } from './CaseCard'

export type CardWheelProps = {
  cases: Case[]
  onSelect: (item: Case) => void
}

const styles: Record<string, CSSProperties> = {
  wheel: {
    position: 'absolute',
    inset: 0,
    overflowY: 'auto',
    scrollSnapType: 'y mandatory',
    perspective: '1200px',
    WebkitOverflowScrolling: 'touch',
  },
  slide: {
    height: '100dvh',
    scrollSnapAlign: 'center',
    scrollSnapStop: 'always',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: {
    transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease',
    willChange: 'transform, opacity',
  },
}

function neighborStyle(distance: number): CSSProperties {
  if (distance === 0) {
    return { transform: 'none', opacity: 1, zIndex: 3 }
  }
  const abs = Math.min(Math.abs(distance), 2)
  const angle = distance < 0 ? 50 : -50
  const scale = 1 - abs * 0.08
  const opacity = Math.max(1 - abs * 0.42, 0.16)
  return {
    transform: `rotateX(${angle}deg) scale(${scale})`,
    transformOrigin: distance < 0 ? 'bottom center' : 'top center',
    opacity,
    zIndex: 2 - Math.min(abs, 1),
  }
}

export function CardWheel({ cases, onSelect }: CardWheelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const slideRefs = useRef<Array<HTMLDivElement | null>>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(cases.length - 1, 0)))
  }, [cases.length])

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

    for (const slide of slideRefs.current) {
      if (slide) observer.observe(slide)
    }

    return () => observer.disconnect()
  }, [cases])

  function goTo(index: number) {
    slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div ref={containerRef} style={styles.wheel}>
      {cases.map((item, index) => {
        const active = index === activeIndex
        return (
          <div
            key={item.id}
            ref={(el) => {
              slideRefs.current[index] = el
            }}
            data-index={index}
            style={styles.slide}
          >
            <div style={{ ...styles.cardWrap, ...neighborStyle(index - activeIndex) }}>
              <CaseCard
                case={item}
                active={active}
                onSelect={() => (active ? onSelect(item) : goTo(index))}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
