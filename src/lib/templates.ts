import type { Templates } from '~/types'

const templates: Templates = {

  'zigzag': {
    template: {
      'background-color': '{c1}',
      'background-image': `linear-gradient(
          -45deg,
          transparent 75%,
          {c2} 75%
        ),
        linear-gradient(45deg, transparent 75%, {c2} 75%),
        linear-gradient(-135deg, transparent 75%, {c2} 75%),
        linear-gradient(135deg, transparent 75%, {c2} 75%)`,
      'background-size': 'calc({sizeX}px * {sizeFactor}) calc({sizeY}px * {sizeFactor})',
      'background-position': 'calc({positionOne}px * {sizeFactor}) 0, calc({positionOne}px * {sizeFactor}) 0, 0 0, 0 0',
    },
    variables: {
      sizeFactor: {
        type: 'range',
        value: 1,
        min: 0.1,
        max: 2,
        step: 0.1,
      },
      sizeX: {
        type: 'range',
        value: 100,
        min: 20,
        max: 200,
      },
      sizeY: {
        type: 'range',
        value: 100,
        min: 20,
        max: 200,
      },
      positionOne: {
        type: 'range',
        value: 50,
        min: 0,
        max: 200,
      },
    },
  },

  'geometric_flowers': {
    template: {
      'background': `
        radial-gradient({c1} 24%,#0000 25%),
        radial-gradient({c2} 30%,#0000 32%) calc({size}px/2) calc({size}px/2),
        repeating-conic-gradient(from {angle}deg,{c3} 0 {degree1}deg,{c4} 0 25%)`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      // Pattern-preserving variables (size)
      size: {
        type: 'range',
        value: 64,
        min: 30,
        max: 200,
      },

      // Pattern-transforming variables
      angle: {
        type: 'range',
        value: 30,
        min: 0,
        max: 360,
      },
      degree1: {
        type: 'range',
        value: 30,
        min: 10,
        max: 90,
      },
    },
  },

  '3d_triangles': {
    template: {
      'background': `
        conic-gradient(from {angle}deg, {c1} 15deg, {c2} 0 30deg, #0000 0 180deg,
                                      {c2} 0 195deg, {c1} 0 210deg, #0000 0)
          calc({size}px/2) calc(.5*{size}px/{tanValue}),
        conic-gradient({c1} 30deg, {c3} 0 75deg, {c1} 0 90deg, {c2} 0 105deg,
                       {c3} 0 150deg, {c2} 0 180deg, {c3} 0 210deg, {c1} 0 256deg,
                       {c2} 0 270deg, {c1} 0 286deg, {c2} 0 331deg, {c3} 0)`,
      'background-size': '{size}px calc({size}px/{tanValue})',
    },
    variables: {
      // Pattern size
      size: {
        type: 'range',
        value: 105,
        min: 50,
        max: 200,
        step: 5,
      },
      // Angular control
      angle: {
        type: 'range',
        value: 75,
        min: 0,
        max: 360,
      },
      // Trigonometric factor
      tanValue: {
        type: 'range',
        value: 0.577, // approximation of tan(30deg)
        min: 0.4,
        max: 0.8,
        step: 0.1,
      },
    },
  },
  'parallelograms': {
    template: {
      background:
        `linear-gradient({degree}deg,{c1} 33%,{c2} 33.5% 66.5%,{c1} 67%)
        0/{tileSize}px {tileSize}px`,
    },
    variables: {
      // Pattern Geometry
      tileSize: {
        type: 'range',
        value: 100,
        min: 50,
        max: 200,
        step: 5,
      },
      degree: {
        type: 'range',
        value: 26,
        min: 0,
        max: 360,
        step: 1,
      },

    },

  },
  'overlapping_cubes': {
    template: {
      '--_g': '0 {angleSize}deg,#0000 0',
      'background':
        `conic-gradient(at calc(250%/3) calc(100%/3),{c1} var(--_g)),
         conic-gradient(from -120deg at calc(50%/3) calc(100%/3),{c2} var(--_g)),
         conic-gradient(from 120deg at calc(100%/3) calc(250%/3),{c3} var(--_g)),
         conic-gradient(from 120deg at calc(200%/3) calc(250%/3),{c3} var(--_g)),
         conic-gradient(from -180deg at calc(100%/3) 50%,{c2} 60deg,{c3} var(--_g)),
         conic-gradient(from 60deg at calc(200%/3) 50%,{c3} 60deg,{c1} var(--_g)),
         conic-gradient(from -60deg at 50% calc(100%/3),{c3} 120deg,{c2} 0 240deg,{c1} 0)`,
      'background-size': 'calc({cubeSize}px*{cubeRatio}) {cubeSize}px',
    },
    variables: {
      // Size Controls
      cubeSize: {
        type: 'range',
        value: 84,
        min: 42,
        max: 168,
        step: 2,
      },

      // Now properly integrated cubeRatio
      cubeRatio: {
        type: 'range',
        value: 1.732, // √3
        min: 1,
        max: 4,
        step: 0.01,
      },

      // Angle Controls
      angleSize: {
        type: 'range',
        value: 120,
        min: 10,
        max: 180,
        step: 5,
      },

    },
  },
  'curved_lines': {
    template: {
      '--_g': '50%,#0000 37%,{c1} 39% 70%,#0000 72%',
      '--_t': '50%,{c2} 40deg,{c3} 0 140deg,{c2} 0 180deg,#0000 0',
      '--_s': '{position1}% {position2}% at',
      'background': `
        radial-gradient(var(--_s) -10% var(--_g)) 0 calc({size}px/2),
        radial-gradient(var(--_s) -10% var(--_g)) calc({size}px/2) 0,
        radial-gradient(var(--_s) 110% var(--_g)),
        radial-gradient(var(--_s) 110% var(--_g)) calc({size}px/2) calc({size}px/2),
        conic-gradient(from 0deg at 55% var(--_t)) calc({size}px/4) 0,
        conic-gradient(from 180deg at 45% var(--_t)) calc({size}px/4) 0,
        {c2}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      // Pattern-preserving variables (size)
      size: {
        type: 'range',
        value: 100,
        min: 50,
        max: 200,
      },

      // Pattern-transforming variables
      position1: {
        type: 'range',
        value: 47,
        min: 25,
        max: 75,
      },
      position2: {
        type: 'range',
        value: 50,
        min: 25,
        max: 75,
      },
    },
  },
  'cubes_illusion': {
    template: {
      'background': `
        repeating-conic-gradient(from {angle}deg,#0000 0 120deg,{c1} 0 50%)
         calc({size}px/2) calc({size}px*{tanFactor}/2),
        repeating-conic-gradient(from {angle}deg,{c2} 0 60deg,{c3} 0 120deg,{c1} 0 50%)`,
      'background-size': '{size}px calc({size}px*0.577)',
    },
    variables: {
      // Pattern-preserving variables
      size: {
        type: 'range',
        value: 200,
        min: 100,
        max: 400,
      },

      // Pattern-transforming variables (reduced variance)
      angle: {
        type: 'range',
        value: 30,
        min: 15,
        max: 45,
      },
      tanFactor: {
        type: 'range',
        value: 0.577, // approximation of tan(30deg)
        min: 0.4,
        max: 0.8,
        step: 0.1,
      },
    },
  },

  'overlapping_circles': {
    template: {
      '--_g': `
        {c1} 0%  5% ,{c2} 6%  15%,{c1} 16% 25%,{c2} 26% 35%,{c1} 36% 45%,
        {c2} 46% 55%,{c1} 56% 65%,{c2} 66% 75%,{c1} 76% 85%,{c2} 86% 95%,
        #0000 96%`,
      'background': `
        radial-gradient({radius1}% {radius1}% at 100% 0,var(--_g)),
        radial-gradient({radius1}% {radius1}% at 0 100%,var(--_g)),
        radial-gradient({radius1}% {radius1}%,var(--_g)),
        radial-gradient({radius1}% {radius1}%,var(--_g)) calc({size}px/2) calc({size}px/2)
        {c1}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      // Pattern-preserving variables (size)
      size: {
        type: 'range',
        value: 150,
        min: 100,
        max: 250,
      },

      // Pattern-transforming variables with limited variance
      radius1: {
        type: 'range',
        value: 50,
        min: 35,
        max: 55,
      },
    },
  },

  'equilateral_triangles': {
    template: {
      'background':
        `conic-gradient(from {topAngle}deg at 50% 33%,#0000,{c1} 0.5deg 60deg,#0000 60.5deg)
         calc({size}px/2) calc({size}px/{sqrtFactor}),
         conic-gradient(from {bottomAngle}deg at 50% 66%,#0000,{c2} 0.5deg 60deg,{c3} 60.5deg)`,
      'background-size': '{size}px calc(0.5*{size}px/tan(30deg))',
    },
    variables: {
      // Sizing
      size: {
        type: 'range',
        value: 120,
        min: 60,
        max: 240,
        step: 10,
      },

      // Angles
      topAngle: {
        type: 'range',
        value: 150,
        min: 120,
        max: 180,
      },
      bottomAngle: {
        type: 'range',
        value: -30,
        min: -60,
        max: 0,
      },

      // Math factors
      sqrtFactor: {
        type: 'range',
        value: 1.4142, // sqrt(2)
        min: 1.2,
        max: 1.6,
        step: 0.01,
      },
    },
  },

  'braided_lines': {
    template: {
      '--g': 'calc({gap}px * {sizeFactor})', // Scale gap proportionally
      'background':
        `conic-gradient(at calc({cornerSize}px * {sizeFactor}) calc(100% - calc({cornerSize}px * {sizeFactor})),
          #0000 270deg,{c1} 0) calc(calc({cornerSize}px * {sizeFactor}) + var(--g)) 0,
         linear-gradient({c2} calc({cornerSize}px * {sizeFactor}),#0000 0) 0 var(--g),
         conic-gradient(at calc({cornerSize}px * {sizeFactor}) calc(100% - calc({cornerSize}px * {sizeFactor})),
          #0000 90deg,{c2} 0 180deg, {c1} 0),
         {c3}`,
      'background-size': `calc(2*(calc({cornerSize}px * {sizeFactor}) + var(--g)))
                          calc(2*(calc({cornerSize}px * {sizeFactor}) + var(--g)))`,
    },
    variables: {
      sizeFactor: {
        type: 'range',
        value: 1,
        min: 0.5,
        max: 2,
        step: 0.1,
      },
      cornerSize: {
        type: 'range',
        value: 20,
        min: 10,
        max: 40,
        step: 2,
      },
      gap: {
        type: 'range',
        value: 20,
        min: 5,
        max: 40,
        step: 1,
      },

    },
  },

  'distorted_mesh': {
    template: {
      '--_g': '#0000 {gap}%,{c1} calc({gap}% + 2%) calc({gap}% + {bandWidth}%),#0000 calc({gap}% + 7%)',
      'background':
        `radial-gradient(farthest-side at -33.33% 50%,var(--_g)) 0 calc({baseSize}px/2),
         radial-gradient(farthest-side at 50% 133.33%,var(--_g)) calc({baseSize}px/2) 0,
         radial-gradient(farthest-side at 133.33% 50%,var(--_g)),
         radial-gradient(farthest-side at 50% -33.33%,var(--_g)),
         {c2}`,
      'background-size':
        `calc({baseSize}px/{widthRatio}) {baseSize}px,
         {baseSize}px calc({baseSize}px/{heightRatio})`,
    },
    variables: {
      // Pattern Geometry
      baseSize: {
        type: 'range',
        value: 140,
        min: 70,
        max: 280,
        step: 10,
      },
      widthRatio: {
        type: 'range',
        value: 4.667,
        min: 3,
        max: 6,
        step: 0.001,
      },
      heightRatio: {
        type: 'range',
        value: 4.667,
        min: 3,
        max: 6,
        step: 0.001,
      },

      // Band Configuration
      gap: {
        type: 'range',
        value: 52,
        min: 40,
        max: 60,
      },

      bandWidth: {
        type: 'range',
        value: 5,
        min: 3,
        max: 15,
        step: 0.1,
      },
    },
  },
  'hearts_pattern': {
    template: {
      'background': `
        radial-gradient(at 80% 80%,{c1} 25.4%,#0000 26%),
        radial-gradient(at 20% 80%,{c1} 25.4%,#0000 26%),
        conic-gradient(from -45deg at 50% 41%,{c1} 90deg,{c2} 0)
           calc({size}px/2) 0`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      // Pattern size
      size: {
        type: 'range',
        value: 120,
        min: 60,
        max: 200,
        step: 10,
      },
    },
  },
  'diagonal_squares': {
    template: {
      'background': `
        repeating-conic-gradient(at {position1}% {position1}%, {c1} 0 {degree}%, #0000 0 50%),
        repeating-conic-gradient(at {position2}% {position2}%, {c1} 0 {degree}%, #0000 0 50%),
        {c2}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      // Pattern size
      size: {
        type: 'range',
        value: 100,
        min: 50,
        max: 200,
        step: 5,
      },
      // Position controls
      position1: {
        type: 'range',
        value: 33,
        min: 20,
        max: 45,
        step: 1,
      },
      position2: {
        type: 'range',
        value: 66,
        min: 55,
        max: 80,
        step: 1,
      },
      // Degree for squares
      degree: {
        type: 'range',
        value: 25,
        min: 15,
        max: 35,
        step: 1,
      },
    },
  },
}
export default templates
