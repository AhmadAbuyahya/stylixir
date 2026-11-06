import { describe, expect, it } from 'vitest'
import { randomNumber, randomVariables } from '~/lib/pattern'
import type { Variables } from '~/types'

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

describe('randomVariables', () => {
  const variables: Variables = {
    size: { type: 'range', value: 50, min: 10, max: 90, step: 1 },
    angle: { type: 'range', value: 45, min: 0, max: 90, step: 1, breaking: true },
  }

  it('leaves breaking dials at their defaults unless asked', () => {
    const sizes = new Set<number>()
    for (let i = 0; i < 200; i++) {
      const tame = randomVariables(variables, { colors: false })
      expect(tame.angle).toBe(45)
      sizes.add(Number(tame.size))
    }
    expect(sizes.size).toBeGreaterThan(1)
    const angles = new Set(Array.from({ length: 200 }, () => randomVariables(variables, { colors: false, breaking: true }).angle))
    expect(angles.size).toBeGreaterThan(1)
  })
})
