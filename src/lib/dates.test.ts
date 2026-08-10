import { describe, expect, it } from 'vitest'
import { isValidYmd } from './dates'

describe('isValidYmd', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(isValidYmd('2026-08-07')).toBe(true)
  })
  it('rejects garbage', () => {
    expect(isValidYmd('08/07/2026')).toBe(false)
    expect(isValidYmd('2026-13-01')).toBe(false)
    expect(isValidYmd('')).toBe(false)
  })
})
