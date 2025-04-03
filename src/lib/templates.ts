import type { Templates } from '~/types'

const templates: Templates = {

  zigzag: {
    template: {
      'background-color': '{bgColor}',
      'background-image': `linear-gradient(
          -45deg,
          transparent 75%,
          {colorOne} 75%
        ),
        linear-gradient(45deg, transparent 75%, {colorOne} 75%),
        linear-gradient(-135deg, transparent 75%, {colorOne} 75%),
        linear-gradient(135deg, transparent 75%, {colorOne} 75%)`,
      'background-size': '{sizeX}px {sizeY}px',
      'background-position': '{PositionOne}px 0, {PositionOne}px 0, 0 0, 0 0',
    },
    variables: {
      bgColor: {
        type: 'color',
        value: '#101423',
      },
      colorOne: {
        type: 'color',
        value: '#9da8e1',
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
      PositionOne: {
        type: 'range',
        value: 50,
        min: 0,
        max: 200,
      },
    },
  },

  geometricFlowers: {
    template: {
      'background': `
        radial-gradient({colorOne} 24%,#0000 25%),
        radial-gradient({colorTwo} 30%,#0000 32%) calc({size}px/2) calc({size}px/2),
        repeating-conic-gradient(from {angle}deg,{colorThree} 0 {degree1}deg,{colorFour} 0 25%)`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      // Pattern-preserving variables (colors, size)
      colorOne: {
        type: 'color',
        value: '#c02942',
      },
      colorTwo: {
        type: 'color',
        value: '#53777a',
      },
      colorThree: {
        type: 'color',
        value: '#ecd078',
      },
      colorFour: {
        type: 'color',
        value: '#d95b43',
      },
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

  trianglesPattern: {
    template: {
      'background': `
        conic-gradient(from {angle}deg, {colorBase} 15deg, {colorLight} 0 30deg, #0000 0 180deg,
                                      {colorLight} 0 195deg, {colorBase} 0 210deg, #0000 0)
          calc({size}px/2) calc(.5*{size}px/{tanValue}),
        conic-gradient({colorBase} 30deg, {colorBright} 0 75deg, {colorBase} 0 90deg, {colorLight} 0 105deg,
                       {colorBright} 0 150deg, {colorLight} 0 180deg, {colorBright} 0 210deg, {colorBase} 0 256deg,
                       {colorLight} 0 270deg, {colorBase} 0 286deg, {colorLight} 0 331deg, {colorBright} 0)`,
      'background-size': '{size}px calc({size}px/{tanValue})',
    },
    variables: {
      // Colors
      colorBase: {
        type: 'color',
        value: '#b9b9b9',
      },
      colorLight: {
        type: 'color',
        value: '#dcdcdc',
      },
      colorBright: {
        type: 'color',
        value: '#fafafa',
      },
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
  parallelograms: {
    template: {
      background:
        `linear-gradient({degree}deg,{colorOne} 33%,{colorTwo} 33.5% 66.5%,{colorOne} 67%)
        0/{tileSize}px {tileSize}px`,
    },
    variables: {
      // Colors
      colorOne: {
        type: 'color',
        value: '#4ECDC4',
      },
      colorTwo: {
        type: 'color',
        value: '#556270',
      },

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
  overlappingCubes: {
    template: {
      '--_g': '0 {angleSize}deg,#0000 0',
      'background':
        `conic-gradient(at calc(250%/3) calc(100%/3),{colorDark} var(--_g)),
         conic-gradient(from -120deg at calc(50%/3) calc(100%/3),{colorMid} var(--_g)),
         conic-gradient(from 120deg at calc(100%/3) calc(250%/3),{colorLight} var(--_g)),
         conic-gradient(from 120deg at calc(200%/3) calc(250%/3),{colorLight} var(--_g)),
         conic-gradient(from -180deg at calc(100%/3) 50%,{colorMid} 60deg,{colorLight} var(--_g)),
         conic-gradient(from 60deg at calc(200%/3) 50%,{colorLight} 60deg,{colorDark} var(--_g)),
         conic-gradient(from -60deg at 50% calc(100%/3),{colorLight} 120deg,{colorMid} 0 240deg,{colorDark} 0)`,
      'background-size': 'calc({cubeSize}px*{cubeRatio}) {cubeSize}px',
    },
    variables: {
      // Color Palette (unchanged)
      colorDark: { type: 'color', value: '#999999' },
      colorMid: { type: 'color', value: '#cdcbcc' },
      colorLight: { type: 'color', value: '#f2f2f2' },

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
  curvedLines: {
    template: {
      '--_g': '50%,#0000 37%,{colorOne} 39% 70%,#0000 72%',
      '--_t': '50%,{colorTwo} 40deg,{colorThree} 0 140deg,{colorTwo} 0 180deg,#0000 0',
      '--_s': '{position1}% {position2}% at',
      'background': `
        radial-gradient(var(--_s) -10% var(--_g)) 0 calc({size}px/2),
        radial-gradient(var(--_s) -10% var(--_g)) calc({size}px/2) 0,
        radial-gradient(var(--_s) 110% var(--_g)),
        radial-gradient(var(--_s) 110% var(--_g)) calc({size}px/2) calc({size}px/2),
        conic-gradient(from 0deg at 55% var(--_t)) calc({size}px/4) 0,
        conic-gradient(from 180deg at 45% var(--_t)) calc({size}px/4) 0,
        {colorTwo}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      // Pattern-preserving variables (colors, size)
      colorOne: {
        type: 'color',
        value: '#fff0e5',
      },
      colorTwo: {
        type: 'color',
        value: '#025d8c',
      },
      colorThree: {
        type: 'color',
        value: '#e1642a',
      },
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
  cubesIllusion: {
    template: {
      'background': `
        repeating-conic-gradient(from {angle}deg,#0000 0 120deg,{colorOne} 0 50%)
         calc({size}px/2) calc({size}px*{tanFactor}/2),
        repeating-conic-gradient(from {angle}deg,{colorTwo} 0 60deg,{colorThree} 0 120deg,{colorOne} 0 50%)`,
      'background-size': '{size}px calc({size}px*0.577)',
    },
    variables: {
      // Pattern-preserving variables
      colorOne: {
        type: 'color',
        value: '#3c3c3c',
      },
      colorTwo: {
        type: 'color',
        value: '#1d1d1d',
      },
      colorThree: {
        type: 'color',
        value: '#4e4f51',
      },
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

  overlappingCircles: {
    template: {
      '--_g': `
        {colorOne} 0%  5% ,{colorTwo} 6%  15%,{colorOne} 16% 25%,{colorTwo} 26% 35%,{colorOne} 36% 45%,
        {colorTwo} 46% 55%,{colorOne} 56% 65%,{colorTwo} 66% 75%,{colorOne} 76% 85%,{colorTwo} 86% 95%,
        #0000 96%`,
      'background': `
        radial-gradient({radius1}% {radius1}% at 100% 0,var(--_g)),
        radial-gradient({radius1}% {radius1}% at 0 100%,var(--_g)),
        radial-gradient({radius1}% {radius1}%,var(--_g)),
        radial-gradient({radius1}% {radius1}%,var(--_g)) calc({size}px/2) calc({size}px/2)
        {colorOne}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      // Pattern-preserving variables (colors, size)
      colorOne: {
        type: 'color',
        value: '#f7d2a1',
      },
      colorTwo: {
        type: 'color',
        value: '#05057e',
      },
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

  equilateralTriangles: {
    template: {
      'background':
        `conic-gradient(from {topAngle}deg at 50% 33%,#0000,{colorOne} 0.5deg 60deg,#0000 60.5deg)
         calc({size}px/2) calc({size}px/{sqrtFactor}),
         conic-gradient(from {bottomAngle}deg at 50% 66%,#0000,{colorTwo} 0.5deg 60deg,{colorThree} 60.5deg)`,
      'background-size': '{size}px calc(0.5*{size}px/tan(30deg))',
    },
    variables: {
      // Colors
      colorOne: {
        type: 'color',
        value: '#FA6900',
      },
      colorTwo: {
        type: 'color',
        value: '#D95B43',
      },
      colorThree: {
        type: 'color',
        value: '#ECD078',
      },

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

  braidedLines: {
    template: {
      '--g': 'calc({gap}px * {sizeFactor})', // Scale gap proportionally
      'background':
        `conic-gradient(at calc({cornerSize}px * {sizeFactor}) calc(100% - calc({cornerSize}px * {sizeFactor})),
          #0000 270deg,{colorOne} 0) calc(calc({cornerSize}px * {sizeFactor}) + var(--g)) 0,
         linear-gradient({colorTwo} calc({cornerSize}px * {sizeFactor}),#0000 0) 0 var(--g),
         conic-gradient(at calc({cornerSize}px * {sizeFactor}) calc(100% - calc({cornerSize}px * {sizeFactor})),
          #0000 90deg,{colorTwo} 0 180deg, {colorOne} 0),
         {backgroundColor}`,
      'background-size': `calc(2*(calc({cornerSize}px * {sizeFactor}) + var(--g)))
                          calc(2*(calc({cornerSize}px * {sizeFactor}) + var(--g)))`,
    },
    variables: {
      colorOne: { type: 'color', value: '#C02942' },
      colorTwo: { type: 'color', value: '#53777A' },
      backgroundColor: { type: 'color', value: '#ECD078' },
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

  distortedMesh: {
    template: {
      '--_g': '#0000 {gap}%,{colorBand} calc({gap}% + 2%) calc({gap}% + {bandWidth}%),#0000 calc({gap}% + 7%)',
      'background':
        `radial-gradient(farthest-side at -33.33% 50%,var(--_g)) 0 calc({baseSize}px/2),
         radial-gradient(farthest-side at 50% 133.33%,var(--_g)) calc({baseSize}px/2) 0,
         radial-gradient(farthest-side at 133.33% 50%,var(--_g)),
         radial-gradient(farthest-side at 50% -33.33%,var(--_g)),
         {backgroundColor}`,
      'background-size':
        `calc({baseSize}px/{widthRatio}) {baseSize}px,
         {baseSize}px calc({baseSize}px/{heightRatio})`,
    },
    variables: {
      // Colors
      colorBand: {
        type: 'color',
        value: '#170409',
      },
      backgroundColor: {
        type: 'color',
        value: '#67917A',
      },
      transparentColor: {
        type: 'color',
        value: '#0000',
      },

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
  heartsPattern: {
    template: {
      'background': `
        radial-gradient(at 80% 80%,{colorHeart} 25.4%,#0000 26%),
        radial-gradient(at 20% 80%,{colorHeart} 25.4%,#0000 26%),
        conic-gradient(from -45deg at 50% 41%,{colorHeart} 90deg,{colorBackground} 0)
           calc({size}px/2) 0`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      // Colors
      colorHeart: {
        type: 'color',
        value: '#e7525b',
      },
      colorBackground: {
        type: 'color',
        value: '#78dbf0',
      },
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
  diagonalSquares: {
    template: {
      'background': `
        repeating-conic-gradient(at {position1}% {position1}%, {colorSquare} 0 {degree}%, #0000 0 50%),
        repeating-conic-gradient(at {position2}% {position2}%, {colorSquare} 0 {degree}%, #0000 0 50%),
        {colorBackground}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      // Colors
      colorSquare: {
        type: 'color',
        value: '#00A0B0',
      },
      colorBackground: {
        type: 'color',
        value: '#EB6841',
      },
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
