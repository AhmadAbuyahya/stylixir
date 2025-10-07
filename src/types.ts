import { type ViteSSGContext } from 'vite-ssg'

export type UserModule = (ctx: ViteSSGContext) => void

interface Variable {
  type: 'color' | 'number' | 'range'
  value: string | number
  min?: number
  max?: number
  step?: number
}

export interface Variables {
  [key: string]: Variable
}

export interface Template {
  template: {
    [key: string]: string
  }
  variables: Variables
}

export interface Templates {
  [key: string]: Template
}

export interface Toast {
  id: number
  title: string
  variant: 'success' | 'error' | 'warning' | 'info'
}

// New color palette types
export interface ColorPalette {
  id: string
  name: string
  colors: string[]
  isCustom?: boolean
}

export interface ColorPalettes {
  [key: string]: ColorPalette
}
