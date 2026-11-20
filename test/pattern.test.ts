import { describe, expect, it } from 'vitest'
import { blendValues, randomNumber, randomVariables } from '~/lib/pattern'
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

describe('blendValues', () => {
  const variables: Variables = {
    size: { type: 'range', value: 50, min: 10, max: 90 },
    bg: { type: 'color', value: '#000000' },
  }
  const a = { size: 10, bg: '#000000' }
  const b = { size: 30, bg: '#ffffff' }

  it('hits both ends exactly', () => {
    expect(blendValues(a, b, 0, variables)).toEqual(a)
    expect(blendValues(a, b, 1, variables)).toEqual(b)
  })

  it('blends numbers and colors halfway', () => {
    expect(blendValues(a, b, 0.5, variables)).toEqual({ size: 20, bg: '#808080' })
  })

  it('jumps to the target for a color that is not plain hex', () => {
    expect(blendValues(a, { ...b, bg: '#ffffff80' }, 0.5, variables).bg).toBe('#ffffff80')
  })
})
