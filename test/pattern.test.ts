import { describe, expect, it } from 'vitest'
import { randomNumber } from '~/lib/pattern'

describe('randomNumber', () => {
  it('stays within [min, max]', () => {
    for (let i = 0; i < 2000; i++) {
      const n = randomNumber(0, 1)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(1)
    }
  })

  it('snaps to step from min', () => {
    for (let i = 0; i < 2000; i++) {
      const n = randomNumber(0.5, 2.5, 0.5)
      expect([0.5, 1, 1.5, 2, 2.5]).toContain(n)
    }
  })
})
