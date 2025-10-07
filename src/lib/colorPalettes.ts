import type { ColorPalettes } from '~/types'

// Predefined color palettes - all with exactly 4 colors
export const colorPalettes: ColorPalettes = {
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    colors: ['#1E3A8A', '#3B82F6', '#06B6D4', '#0EA5E9'],
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    colors: ['#064E3B', '#065F46', '#10B981', '#34D399'],
  },
  desert: {
    id: 'desert',
    name: 'Desert',
    colors: ['#92400E', '#D97706', '#F59E0B', '#FCD34D'],
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    colors: ['#FF0080', '#00FF80', '#8000FF', '#FFFF00'],
  },
  pastel: {
    id: 'pastel',
    name: 'Pastel',
    colors: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA'],
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    colors: ['#000000', '#333333', '#999999', '#FFFFFF'],
  },
  warm: {
    id: 'warm',
    name: 'Warm',
    colors: ['#DC2626', '#EA580C', '#D97706', '#F59E0B'],
  },
  cool: {
    id: 'cool',
    name: 'Cool',
    colors: ['#1E40AF', '#3730A3', '#7C3AED', '#A855F7'],
  },
  // earth: {
  //   id: 'earth',
  //   name: 'Earth',
  //   colors: ['#78350F', '#92400E', '#B45309', '#D97706'],
  // },
  // New high contrast palettes
  highContrast: {
    id: 'highContrast',
    name: 'High Contrast',
    colors: ['#000000', '#FFFFFF', '#FF0000', '#00FF00'],
  },
  // accessibility: {
  //   id: 'accessibility',
  //   name: 'Accessibility',
  //   colors: ['#000000', '#FFFFFF', '#0066CC', '#CC0000'],
  // },
  // bold: {
  //   id: 'bold',
  //   name: 'Bold',
  //   colors: ['#000000', '#FFFFFF', '#FF6B35', '#004E89'],
  // },
  // vibrant: {
  //   id: 'vibrant',
  //   name: 'Vibrant',
  //   colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
  // },
  // electric: {
  //   id: 'electric',
  //   name: 'Electric',
  //   colors: ['#000000', '#FFFFFF', '#FF00FF', '#00FFFF'],
  // },
  // stark: {
  //   id: 'stark',
  //   name: 'Stark',
  //   colors: ['#000000', '#FFFFFF', '#FF4500', '#4169E1'],
  // },
  // dramatic: {
  //   id: 'dramatic',
  //   name: 'Dramatic',
  //   colors: ['#000000', '#FFFFFF', '#DC143C', '#32CD32'],
  // },
  // intense: {
  //   id: 'intense',
  //   name: 'Intense',
  //   colors: ['#000000', '#FFFFFF', '#FF1493', '#00CED1'],
  // },
  // powerful: {
  //   id: 'powerful',
  //   name: 'Powerful',
  //   colors: ['#000000', '#FFFFFF', '#FF8C00', '#8A2BE2'],
  // },
  // striking: {
  //   id: 'striking',
  //   name: 'Striking',
  //   colors: ['#000000', '#FFFFFF', '#FF6347', '#20B2AA'],
  // },
}

// Default palette ID
export const defaultPaletteId = 'monochrome'
