import { describe, expect, it } from 'vitest'
import { addKept, parseKept, pushHistory, removeKept, toggleKept } from '~/lib/looks'

describe('history', () => {
  it('appends, skips a repeat of the last entry, and caps from the oldest', () => {
    expect(pushHistory([], 'a')).toEqual(['a'])
    const same = ['a', 'b']
    expect(pushHistory(same, 'b')).toBe(same)
    expect(pushHistory(['a', 'b'], 'a')).toEqual(['a', 'b', 'a'])
    expect(pushHistory(['a', 'b', 'c'], 'd', 3)).toEqual(['b', 'c', 'd'])
  })
})

describe('kept', () => {
  it('reads only an array of strings, anything else as empty', () => {
    expect(parseKept('["1.a","1.b"]')).toEqual(['1.a', '1.b'])
    expect(parseKept(['x'])).toEqual(['x'])
    for (const raw of [null, undefined, '', 'not json', '{"a":1}', '"str"', '[1,2]', '["a",null]', 42, {}])
      expect(parseKept(raw)).toEqual([])
  })

  it('keeps entries it cannot decode', () => {
    expect(parseKept('["1.no_such_pattern"]')).toEqual(['1.no_such_pattern'])
  })

  it('adds newest first without duplicates, dropping the oldest past the cap', () => {
    expect(addKept(['b', 'a'], 'c')).toEqual(['c', 'b', 'a'])
    expect(addKept(['b', 'a'], 'a')).toEqual(['a', 'b'])
    expect(addKept(['c', 'b', 'a'], 'd', 3)).toEqual(['d', 'c', 'b'])
  })

  it('removes and toggles', () => {
    expect(removeKept(['a', 'b'], 'a')).toEqual(['b'])
    expect(removeKept(['a'], 'z')).toEqual(['a'])
    expect(toggleKept(['a'], 'b')).toEqual(['b', 'a'])
    expect(toggleKept(['b', 'a'], 'b')).toEqual(['a'])
  })
})
