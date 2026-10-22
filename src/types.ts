import { type ViteSSGContext } from 'vite-ssg'

export type UserModule = (ctx: ViteSSGContext) => void

export type ColorRole = 'ground' | 'figure' | 'shade-dark' | 'shade-mid' | 'shade-light'

export type ColorHarmony = 'ramp' | 'pair' | 'set'

export interface Variable {
  type: 'color' | 'number' | 'range'
  value: string | number
  min?: number
  max?: number
  step?: number
  role?: ColorRole
}

export interface Variables {
  [key: string]: Variable
}

export interface Template {
  template: {
    [key: string]: string
  }
  variables: Variables
  harmony?: ColorHarmony
}

export interface Templates {
  [key: string]: Template
}

export interface Toast {
  id: number
  title: string
  variant: 'success' | 'error' | 'warning' | 'info'
}
