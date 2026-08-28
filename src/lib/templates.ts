import type { Templates } from '~/types'

function size(value: number, min: number, max: number, step?: number) {
  return {
    type: 'range' as const,
    value,
    min,
    max,
    ...(step !== undefined ? { step } : {}),
  }
}

const templates: Templates = {

  'zigzag': {
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
      'background-size': '{size}px {size}px',
      'background-position': 'calc({size}px * {position}) 0, calc({size}px * {position}) 0, 0 0, 0 0',
    },
    variables: {
      size: size(100, 20, 200),
      bgColor: {
        type: 'color',
        value: '#101423',
      },
      colorOne: {
        type: 'color',
        value: '#9da8e1',
      },
      position: {
        type: 'range',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
  },

  'geometric_flowers': {
    template: {
      'background': `
        radial-gradient({colorOne} 24%,#0000 25%),
        radial-gradient({colorTwo} 30%,#0000 32%) calc({size}px/2) calc({size}px/2),
        repeating-conic-gradient(from {angle}deg,{colorThree} 0 {degree1}deg,{colorFour} 0 25%)`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(64, 30, 200),
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
        conic-gradient(from {angle}deg, {colorBase} 15deg, {colorLight} 0 30deg, #0000 0 180deg,
                                      {colorLight} 0 195deg, {colorBase} 0 210deg, #0000 0)
          calc({size}px/2) calc(.5*{size}px/{tanValue}),
        conic-gradient({colorBase} 30deg, {colorBright} 0 75deg, {colorBase} 0 90deg, {colorLight} 0 105deg,
                       {colorBright} 0 150deg, {colorLight} 0 180deg, {colorBright} 0 210deg, {colorBase} 0 256deg,
                       {colorLight} 0 270deg, {colorBase} 0 286deg, {colorLight} 0 331deg, {colorBright} 0)`,
      'background-size': '{size}px calc({size}px/{tanValue})',
    },
    variables: {
      size: size(105, 50, 200, 5),
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
      angle: {
        type: 'range',
        value: 75,
        min: 0,
        max: 360,
      },
      tanValue: {
        type: 'range',
        value: 0.577,
        min: 0.4,
        max: 0.8,
        step: 0.1,
      },
    },
  },

  'parallelograms': {
    template: {
      background:
        `linear-gradient({degree}deg,{colorOne} 33%,{colorTwo} 33.5% 66.5%,{colorOne} 67%)
        0/{size}px {size}px`,
    },
    variables: {
      size: size(100, 50, 200, 5),
      colorOne: {
        type: 'color',
        value: '#4ECDC4',
      },
      colorTwo: {
        type: 'color',
        value: '#556270',
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
        `conic-gradient(at calc(250%/3) calc(100%/3),{colorDark} var(--_g)),
         conic-gradient(from -120deg at calc(50%/3) calc(100%/3),{colorMid} var(--_g)),
         conic-gradient(from 120deg at calc(100%/3) calc(250%/3),{colorLight} var(--_g)),
         conic-gradient(from 120deg at calc(200%/3) calc(250%/3),{colorLight} var(--_g)),
         conic-gradient(from -180deg at calc(100%/3) 50%,{colorMid} 60deg,{colorLight} var(--_g)),
         conic-gradient(from 60deg at calc(200%/3) 50%,{colorLight} 60deg,{colorDark} var(--_g)),
         conic-gradient(from -60deg at 50% calc(100%/3),{colorLight} 120deg,{colorMid} 0 240deg,{colorDark} 0)`,
      'background-size': 'calc({size}px*{cubeRatio}) {size}px',
    },
    variables: {
      size: size(84, 42, 168, 2),
      colorDark: { type: 'color', value: '#999999' },
      colorMid: { type: 'color', value: '#cdcbcc' },
      colorLight: { type: 'color', value: '#f2f2f2' },
      cubeRatio: {
        type: 'range',
        value: 1.732,
        min: 1,
        max: 4,
        step: 0.01,
      },
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
      size: size(100, 50, 200),
      colorOne: {
        type: 'color',
        value: '#fff0e5',
      },
      colorTwo: {
        type: 'color',
        value: '#025d8c',
        role: 'ground',
      },
      colorThree: {
        type: 'color',
        value: '#e1642a',
      },
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
    harmony: 'ramp',
    template: {
      'background': `
        repeating-conic-gradient(from {angle}deg,#0000 0 120deg,{colorOne} 0 50%)
         calc({size}px/2) calc({size}px*{tanFactor}/2),
        repeating-conic-gradient(from {angle}deg,{colorTwo} 0 60deg,{colorThree} 0 120deg,{colorOne} 0 50%)`,
      'background-size': '{size}px calc({size}px*0.577)',
    },
    variables: {
      size: size(200, 100, 400),
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
      angle: {
        type: 'range',
        value: 30,
        min: 15,
        max: 45,
      },
      tanFactor: {
        type: 'range',
        value: 0.577,
        min: 0.4,
        max: 0.8,
        step: 0.1,
      },
    },
  },

  'overlapping_circles': {
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
      size: size(150, 100, 250),
      colorOne: {
        type: 'color',
        value: '#f7d2a1',
      },
      colorTwo: {
        type: 'color',
        value: '#05057e',
      },
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
        `conic-gradient(from {topAngle}deg at 50% 33%,#0000,{colorOne} 0.5deg 60deg,#0000 60.5deg)
         calc({size}px/2) calc({size}px/{sqrtFactor}),
         conic-gradient(from {bottomAngle}deg at 50% 66%,#0000,{colorTwo} 0.5deg 60deg,{colorThree} 60.5deg)`,
      'background-size': '{size}px calc(0.5*{size}px/tan(30deg))',
    },
    variables: {
      size: size(120, 60, 240, 10),
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
      sqrtFactor: {
        type: 'range',
        value: 1.4142,
        min: 1.2,
        max: 1.6,
        step: 0.01,
      },
    },
  },

  'braided_lines': {
    template: {
      '--g': '{gap}px',
      'background':
        `conic-gradient(at {size}px calc(100% - {size}px),
          #0000 270deg,{colorOne} 0) calc({size}px + var(--g)) 0,
         linear-gradient({colorTwo} {size}px,#0000 0) 0 var(--g),
         conic-gradient(at {size}px calc(100% - {size}px),
          #0000 90deg,{colorTwo} 0 180deg, {colorOne} 0),
         {backgroundColor}`,
      'background-size': `calc(2*({size}px + var(--g)))
                          calc(2*({size}px + var(--g)))`,
    },
    variables: {
      size: size(20, 10, 48, 2),
      colorOne: { type: 'color', value: '#C02942' },
      colorTwo: { type: 'color', value: '#53777A' },
      backgroundColor: { type: 'color', value: '#ECD078' },
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
      '--_g': '#0000 {gap}%,{colorBand} calc({gap}% + 2%) calc({gap}% + {bandWidth}%),#0000 calc({gap}% + 7%)',
      'background':
        `radial-gradient(farthest-side at -33.33% 50%,var(--_g)) 0 calc({size}px/2),
         radial-gradient(farthest-side at 50% 133.33%,var(--_g)) calc({size}px/2) 0,
         radial-gradient(farthest-side at 133.33% 50%,var(--_g)),
         radial-gradient(farthest-side at 50% -33.33%,var(--_g)),
         {backgroundColor}`,
      'background-size':
        `calc({size}px/{widthRatio}) {size}px,
         {size}px calc({size}px/{heightRatio})`,
    },
    variables: {
      size: size(140, 70, 280, 10),
      colorBand: {
        type: 'color',
        value: '#170409',
      },
      backgroundColor: {
        type: 'color',
        value: '#67917A',
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
        radial-gradient(at 80% 80%,{heartColor} 25.4%,#0000 26%),
        radial-gradient(at 20% 80%,{heartColor} 25.4%,#0000 26%),
        conic-gradient(from -45deg at 50% 41%,{heartColor} 90deg,{backgroundColor} 0)
           calc({size}px/2) 0`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(120, 60, 200, 10),
      heartColor: {
        type: 'color',
        value: '#e7525b',
      },
      backgroundColor: {
        type: 'color',
        value: '#78dbf0',
      },
    },
  },

  'diagonal_squares': {
    template: {
      'background': `
        repeating-conic-gradient(at {position1}% {position1}%, {squareColor} 0 {degree}%, #0000 0 50%),
        repeating-conic-gradient(at {position2}% {position2}%, {squareColor} 0 {degree}%, #0000 0 50%),
        {backgroundColor}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(100, 50, 200, 5),
      squareColor: {
        type: 'color',
        value: '#00A0B0',
      },
      backgroundColor: {
        type: 'color',
        value: '#EB6841',
      },
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
      degree: {
        type: 'range',
        value: 25,
        min: 15,
        max: 35,
        step: 1,
      },
    },
  },

  'graph_paper': {
    template: {
      '--_g': '#0000 90deg,{lineColor} 0',
      'background': `
        conic-gradient(from 90deg at {majorLine}px {majorLine}px,var(--_g)),
        conic-gradient(from 90deg at {minorLine}px {minorLine}px,var(--_g)),
        {bgColor}`,
      'background-size': `
        {size}px {size}px,
        calc({size}px/{subdiv}) calc({size}px/{subdiv})`,
    },
    variables: {
      size: size(100, 40, 200, 5),
      lineColor: {
        type: 'color',
        value: '#336666',
      },
      bgColor: {
        type: 'color',
        value: '#ffffff',
        role: 'ground',
      },
      subdiv: {
        type: 'range',
        value: 5,
        min: 2,
        max: 12,
        step: 1,
      },
      majorLine: {
        type: 'range',
        value: 2,
        min: 1,
        max: 6,
        step: 1,
      },
      minorLine: {
        type: 'range',
        value: 1,
        min: 1,
        max: 4,
        step: 1,
      },
    },
  },

  'stars': {
    template: {
      '--d': 'calc({size}px/{gapFactor})',
      '--_g': '{starColor} {pointAngle}deg, #0000 0',
      'background': `
        conic-gradient(from calc(162deg + {rotation}deg) at calc({size}px * .5) calc({size}px * .68), var(--_g)),
        conic-gradient(from calc(18deg + {rotation}deg) at calc({size}px * .19) calc({size}px * .59), var(--_g)),
        conic-gradient(from calc(306deg + {rotation}deg) at calc({size}px * .81) calc({size}px * .59), var(--_g)),
        {bgColor}`,
      'background-position': '0 calc({size}px * {offsetY})',
      'background-size': 'calc({size}px + var(--d)) calc({size}px + var(--d))',
    },
    variables: {
      size: size(90, 40, 180, 5),
      starColor: {
        type: 'color',
        value: '#fff220',
      },
      bgColor: {
        type: 'color',
        value: '#e181c2',
        role: 'ground',
      },
      gapFactor: {
        type: 'range',
        value: 10,
        min: 4,
        max: 20,
        step: 1,
      },
      pointAngle: {
        type: 'range',
        value: 36,
        min: 22,
        max: 48,
        step: 1,
      },
      rotation: {
        type: 'range',
        value: 0,
        min: 0,
        max: 72,
        step: 1,
      },
      offsetY: {
        type: 'range',
        value: 0.35,
        min: 0.2,
        max: 0.5,
        step: 0.01,
      },
    },
  },

  'rectangles_parallelograms': {
    template: {
      'background': `
        conic-gradient(from {angle}deg at {outerPos}% {outerPos}%, {colorOne} 90deg, {colorTwo} 0 180deg, #0000 0),
        conic-gradient(from calc(-1 * {angle}deg) at {innerPos}% {innerPos}%, {colorOne} 90deg, #0000 0),
        conic-gradient(from calc(-1 * {angle}deg) at 50% 100%, #0000 180deg, {colorOne} 0),
        conic-gradient(from calc(-1 * {angle}deg), {colorTwo} 90deg, {colorThree} 0 {splitAngle}deg, {colorFour} 0)`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(150, 60, 260, 5),
      colorOne: {
        type: 'color',
        value: '#FECEA8',
      },
      colorTwo: {
        type: 'color',
        value: '#FF847C',
      },
      colorThree: {
        type: 'color',
        value: '#E84A5F',
      },
      colorFour: {
        type: 'color',
        value: '#99B898',
      },
      angle: {
        type: 'range',
        value: 45,
        min: 15,
        max: 75,
        step: 1,
      },
      outerPos: {
        type: 'range',
        value: 75,
        min: 60,
        max: 85,
        step: 1,
      },
      innerPos: {
        type: 'range',
        value: 25,
        min: 15,
        max: 40,
        step: 1,
      },
      splitAngle: {
        type: 'range',
        value: 225,
        min: 180,
        max: 270,
        step: 1,
      },
    },
  },

  'squares_3d': {
    harmony: 'ramp',
    template: {
      '--_g': '{colorDark} {bandStart}%,{colorMid} calc({bandStart}% + 0.5%) {bandMid}%,#0000 calc({bandMid}% + 0.5%) calc(100% - {bandMid}% - 0.5%),{colorMid} calc(100% - {bandMid}%) calc(100% - {bandStart}% - 0.5%),{colorLight} calc(100% - {bandStart}%)',
      '--_c': 'from {cutAngle}deg at {cutPos}% 50%,#0000 75%',
      '--_l1': 'linear-gradient({bevelA}deg,var(--_g))',
      '--_l2': 'linear-gradient({bevelB}deg,var(--_g))',
      'background': `
        var(--_l1), var(--_l1) calc({size}px/2) {size}px,
        var(--_l2), var(--_l2) calc({size}px/2) {size}px,
        conic-gradient(var(--_c),{colorDark} 0) calc({size}px/8) 0,
        conic-gradient(var(--_c),{colorLight} 0) calc({size}px/2) 0,
        linear-gradient(90deg,{colorLight} {ridge}% ,{colorDark} 0 50%,{colorLight} 0 calc(100% - {ridge}%),{colorDark} 0)`,
      'background-size': '{size}px calc({size}px*{heightRatio})',
    },
    variables: {
      size: size(222, 90, 320, 6),
      colorDark: {
        type: 'color',
        value: '#7f727b',
      },
      colorMid: {
        type: 'color',
        value: '#d6b4c2',
      },
      colorLight: {
        type: 'color',
        value: '#baa0ab',
      },
      bandStart: {
        type: 'range',
        value: 10,
        min: 4,
        max: 18,
        step: 0.5,
      },
      bandMid: {
        type: 'range',
        value: 19,
        min: 12,
        max: 30,
        step: 0.5,
      },
      bevelA: {
        type: 'range',
        value: 145,
        min: 120,
        max: 170,
        step: 1,
      },
      bevelB: {
        type: 'range',
        value: 35,
        min: 15,
        max: 55,
        step: 1,
      },
      cutAngle: {
        type: 'range',
        value: -90,
        min: -120,
        max: -60,
        step: 1,
      },
      cutPos: {
        type: 'range',
        value: 37.5,
        min: 25,
        max: 45,
        step: 0.5,
      },
      ridge: {
        type: 'range',
        value: 38,
        min: 28,
        max: 45,
        step: 1,
      },
      heightRatio: {
        type: 'range',
        value: 0.667,
        min: 0.45,
        max: 0.9,
        step: 0.01,
      },
    },
  },

  'equal_sign': {
    template: {
      '--_g': '#0000 {bandStart}%,{figureColor} 0 {bandEnd}%,#0000 0 {bandGap}%',
      'background': `
        linear-gradient({tilt}deg,#0000 20.5%,{figureColor} 0 29.5%,#0000 0) 0 calc({size}px/4),
        linear-gradient(calc({tilt}deg - 90deg),var(--_g)) calc({size}px/2) 0,
        linear-gradient({tilt}deg,var(--_g),{figureColor} 0 67%,#0000 0),
        linear-gradient(calc({tilt}deg - 90deg),var(--_g),{figureColor} 0 67%,#0000 0 83%,{figureColor} 0 92%,#0000 0),
        {bgColor}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(200, 80, 320, 5),
      figureColor: {
        type: 'color',
        value: '#ffffff',
      },
      bgColor: {
        type: 'color',
        value: '#1095c1',
        role: 'ground',
      },
      tilt: {
        type: 'range',
        value: 135,
        min: 115,
        max: 155,
        step: 1,
      },
      bandStart: {
        type: 'range',
        value: 8,
        min: 4,
        max: 12,
        step: 0.5,
      },
      bandEnd: {
        type: 'range',
        value: 17,
        min: 14,
        max: 26,
        step: 0.5,
      },
      bandGap: {
        type: 'range',
        value: 58,
        min: 48,
        max: 68,
        step: 1,
      },
    },
  },

  'triangles_chevrons': {
    template: {
      '--_g': '{cut}deg,#0000 0',
      'background': `
        conic-gradient(from {angle}deg,{colorOne} var(--_g)) {size}px calc({size}px/2),
        conic-gradient(from {angle}deg,{colorTwo} var(--_g)),
        conic-gradient(from {angle}deg at {tipX}% 0,{colorOne} var(--_g)) {colorTwo}`,
      'background-size': 'calc(2*{size}px) {size}px',
    },
    variables: {
      size: size(64, 32, 160, 2),
      colorOne: {
        type: 'color',
        value: '#E0E4CC',
      },
      colorTwo: {
        type: 'color',
        value: '#69D2E7',
        role: 'ground',
      },
      angle: {
        type: 'range',
        value: 135,
        min: 90,
        max: 180,
        step: 1,
      },
      cut: {
        type: 'range',
        value: 90,
        min: 60,
        max: 120,
        step: 1,
      },
      tipX: {
        type: 'range',
        value: 50,
        min: 35,
        max: 65,
        step: 1,
      },
    },
  },

  'rhombus_stripes': {
    template: {
      background: `
        conic-gradient(from {fromA}deg,{colorOne} {wedge}deg,#0000 0 180deg,{colorTwo} 0 270deg,#0000 0)
          0 calc({size}px/2)/{size}px {size}px,
        conic-gradient(from {fromB}deg at {tipX}% 0,{colorOne} {wedge}deg,{colorTwo} 0)
          0 0/calc(2*{size}px) {size}px`,
    },
    variables: {
      size: size(64, 32, 160, 2),
      colorOne: {
        type: 'color',
        value: '#EB6841',
      },
      colorTwo: {
        type: 'color',
        value: '#EDC951',
      },
      fromA: {
        type: 'range',
        value: -45,
        min: -75,
        max: -15,
        step: 1,
      },
      fromB: {
        type: 'range',
        value: 135,
        min: 105,
        max: 165,
        step: 1,
      },
      wedge: {
        type: 'range',
        value: 90,
        min: 60,
        max: 120,
        step: 1,
      },
      tipX: {
        type: 'range',
        value: 50,
        min: 35,
        max: 65,
        step: 1,
      },
    },
  },

  'mosaic_triangles': {
    template: {
      '--_g': `calc(2*{size}px*1.732) calc(2*{size}px)
        conic-gradient(from {from}deg at {accentX}% 50%,{colorOne} {wedge}deg,#0000 0)`,
      'background': `
        calc(2.598*{size}px/2) calc({size}px/2)/var(--_g),
        calc(-0.866*{size}px/2) calc({size}px/-2)/var(--_g),
        repeating-conic-gradient({colorTwo} 0 90deg,#0000 0 180deg)
          0 0/calc(2*{size}px*1.732) calc(2*{size}px),
        repeating-conic-gradient(from {from}deg,{colorThree} 0 {wedge}deg,{colorTwo} 0 180deg)
          0 0/calc({size}px*1.732) {size}px`,
    },
    variables: {
      size: size(36, 18, 80, 2),
      colorOne: {
        type: 'color',
        value: '#8e1f08',
      },
      colorTwo: {
        type: 'color',
        value: '#ecdacb',
        role: 'ground',
      },
      colorThree: {
        type: 'color',
        value: '#b62f31',
      },
      from: {
        type: 'range',
        value: 60,
        min: 30,
        max: 90,
        step: 1,
      },
      accentX: {
        type: 'range',
        value: 62.5,
        min: 50,
        max: 75,
        step: 0.5,
      },
      wedge: {
        type: 'range',
        value: 60,
        min: 40,
        max: 80,
        step: 1,
      },
    },
  },

  'mosaic_parallelograms': {
    template: {
      '--_g': '{colorOne} {wedgeA}deg,{colorTwo} 0 {wedgeB}deg,#0000 0',
      'background': `
        conic-gradient(from -45deg at calc(100%/{cellDiv}) calc(100%/{cellDiv}),{colorOne} {wedgeA}deg,#0000 0),
        conic-gradient(from -135deg at calc(100%/{cellDiv}) calc(2*100%/{cellDiv}),var(--_g)),
        conic-gradient(from 135deg at calc(2*100%/{cellDiv}) calc(2*100%/{cellDiv}),var(--_g)),
        conic-gradient(from 45deg at calc(2*100%/{cellDiv}) calc(100%/{cellDiv}),var(--_g),{colorOne} 0 {endAngle}deg,{colorTwo} 0)`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(125, 60, 240, 5),
      colorOne: {
        type: 'color',
        value: '#F8CA00',
      },
      colorTwo: {
        type: 'color',
        value: '#BD1550',
      },
      cellDiv: {
        type: 'range',
        value: 3,
        min: 2.4,
        max: 4,
        step: 0.1,
      },
      wedgeA: {
        type: 'range',
        value: 90,
        min: 70,
        max: 110,
        step: 1,
      },
      wedgeB: {
        type: 'range',
        value: 135,
        min: 110,
        max: 160,
        step: 1,
      },
      endAngle: {
        type: 'range',
        value: 225,
        min: 200,
        max: 250,
        step: 1,
      },
    },
  },

  'meander': {
    template: {
      '--_c': '{figureColor} {fillStop}%,#0000 0',
      '--_g1': 'conic-gradient(at 62.5% 12.5%,var(--_c))',
      '--_g2': 'conic-gradient(at 87.5% 62.5%,var(--_c))',
      '--_g3': 'conic-gradient(at 25% 12.5%,var(--_c))',
      'background': `
        var(--_g1) calc({size}px/-{step}) calc(4*{size}px/{step}),var(--_g1) calc(-3*{size}px/{step}) calc(2*{size}px/{step}),
        var(--_g2) calc(3*{size}px/{step}) calc(2*{size}px/{step}),var(--_g2) calc({size}px/-{step}) 0,
        var(--_g3) 0 calc(-2*{size}px/{step}),var(--_g3) calc(-2*{size}px/{step}) 0,
        conic-gradient(at 87.5% 87.5%,var(--_c)) calc({size}px/{step}) 0
        {bgColor}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(120, 60, 220, 5),
      figureColor: {
        type: 'color',
        value: '#72e21f',
      },
      bgColor: {
        type: 'color',
        value: '#044012',
        role: 'ground',
      },
      fillStop: {
        type: 'range',
        value: 25,
        min: 18,
        max: 32,
        step: 0.5,
      },
      step: {
        type: 'range',
        value: 8,
        min: 6,
        max: 10,
        step: 1,
      },
    },
  },

  'rhombus_rectangles': {
    template: {
      '--_c': '#0000 {fillStop}%,{figureColor} 0',
      '--_g1': 'conic-gradient(at {arm}% 50%,var(--_c))',
      '--_g2': 'conic-gradient(at 50% {arm}%,var(--_c))',
      'background': `
        var(--_g1) calc({size}px/6.828) calc({size}px/2),var(--_g1) calc({size}px/-2.828) 0,
        conic-gradient(from 45deg at {corner}% {corner}%,var(--_c)) calc({size}px/-6.828) 0,
        var(--_g2) calc({size}px/2) calc({size}px/-2.828),var(--_g2) 0 calc({size}px/6.828),
        conic-gradient(from -135deg at {corner}% calc(100% - {corner}%),var(--_c)) calc({size}px/-6.828) 0,
        {bgColor}`,
      'background-size': '{size}px {size}px, {size}px {size}px, calc({size}px/2) calc({size}px/2)',
    },
    variables: {
      size: size(170, 80, 280, 5),
      figureColor: {
        type: 'color',
        value: '#3B8686',
      },
      bgColor: {
        type: 'color',
        value: '#CFF09E',
        role: 'ground',
      },
      fillStop: {
        type: 'range',
        value: 75,
        min: 65,
        max: 82,
        step: 0.5,
      },
      arm: {
        type: 'range',
        value: 20.71,
        min: 14,
        max: 28,
        step: 0.5,
      },
      corner: {
        type: 'range',
        value: 29.29,
        min: 22,
        max: 36,
        step: 0.5,
      },
    },
  },

  'triangles': {
    template: {
      'background': `
        conic-gradient(
          {colorOne} atan({slope}), {colorTwo} 0 calc(180deg - atan({slope})),
          {colorOne} 0 180deg,{colorTwo} 0 calc(180deg + atan({slope})),
          {colorOne} 0 calc(360deg - atan({slope})),{colorTwo} 0)`,
      'background-size': 'calc(2*{size}px) calc({size}px*{heightRatio})',
    },
    variables: {
      size: size(76, 36, 160, 2),
      colorOne: {
        type: 'color',
        value: '#F10C49',
      },
      colorTwo: {
        type: 'color',
        value: '#F6D86B',
      },
      slope: {
        type: 'range',
        value: 2,
        min: 1.2,
        max: 3.5,
        step: 0.1,
      },
      heightRatio: {
        type: 'range',
        value: 1,
        min: 0.65,
        max: 1.35,
        step: 0.05,
      },
    },
  },

  'plus_sign': {
    template: {
      '--_c': '#0000 {fillStop}%,{figureColor} 0',
      '--_g1': 'conic-gradient(at {arm}% 50%,var(--_c))',
      '--_g2': 'conic-gradient(at 50% {arm}%,var(--_c))',
      'background': `
        var(--_g1),
        var(--_g1) calc(1*{size}px) calc(3*{size}px),
        var(--_g1) calc(2*{size}px) calc(1*{size}px),
        var(--_g1) calc(3*{size}px) calc(4*{size}px),
        var(--_g1) calc(4*{size}px) calc(2*{size}px),
        var(--_g2) 0 calc(4*{size}px),
        var(--_g2) calc(1*{size}px) calc(2*{size}px),
        var(--_g2) calc(2*{size}px) 0,
        var(--_g2) calc(3*{size}px) calc(3*{size}px),
        var(--_g2) calc(4*{size}px) calc(1*{size}px),
        {bgColor}`,
      'background-size': 'calc(5*{size}px) calc(5*{size}px)',
    },
    variables: {
      size: size(40, 20, 80, 2),
      figureColor: {
        type: 'color',
        value: '#C0D860',
      },
      bgColor: {
        type: 'color',
        value: '#604848',
        role: 'ground',
      },
      fillStop: {
        type: 'range',
        value: 75,
        min: 65,
        max: 85,
        step: 0.5,
      },
      arm: {
        type: 'range',
        value: 10,
        min: 5,
        max: 22,
        step: 0.5,
      },
    },
  },

  'diamond_3d': {
    harmony: 'ramp',
    template: {
      '--_c': '{faceY}%,{colorMid} calc(180deg - 2*{tipAngle}deg),#0000 0',
      '--_g1': 'conic-gradient(from calc(-1 * (180deg - {tipAngle}deg)) at {facePos}% var(--_c))',
      '--_g2': 'conic-gradient(from {tipAngle}deg at calc(100% - {facePos}%) var(--_c))',
      'background': `
        var(--_g1), var(--_g1) calc(3*{size}px) calc({size}px/2),
        var(--_g2), var(--_g2) calc(3*{size}px) calc({size}px/2),
        conic-gradient(
          {colorDark} {tipAngle}deg ,{colorLight} 0 calc(180deg - {tipAngle}deg),
          {colorDark} 0 180deg   ,{colorLight} 0 calc(180deg + {tipAngle}deg),
          {colorDark} 0 calc(360deg - {tipAngle}deg),{colorLight} 0)`,
      'background-size': 'calc(2*{size}px) {size}px',
    },
    variables: {
      size: size(65, 32, 140, 1),
      colorDark: {
        type: 'color',
        value: '#4a99b4',
      },
      colorMid: {
        type: 'color',
        value: '#9cceb5',
      },
      colorLight: {
        type: 'color',
        value: '#dadee1',
      },
      tipAngle: {
        type: 'range',
        value: 63.43,
        min: 45,
        max: 80,
        step: 0.5,
      },
      faceY: {
        type: 'range',
        value: 75,
        min: 65,
        max: 85,
        step: 0.5,
      },
      facePos: {
        type: 'range',
        value: 25,
        min: 18,
        max: 35,
        step: 0.5,
      },
    },
  },

  'cube_columns': {
    harmony: 'ramp',
    template: {
      '--_g': '{colorMid} 0 {faceWedge}deg,#0000 0',
      'background': `
        conic-gradient(from -60deg at 50% calc(100%/{cellDiv}),var(--_g)),
        conic-gradient(from 120deg at 50% calc(200%/{cellDiv}),var(--_g)),
        conic-gradient(from 60deg at calc(200%/{cellDiv}),{colorMid} {wedge}deg,{colorLight} 0 {faceWedge}deg,#0000 0),
        conic-gradient(from 180deg at calc(100%/{cellDiv}),{colorDark} {wedge}deg,var(--_g)),
        linear-gradient(90deg,{colorDark} calc(100%/{ridgeDiv}),{colorLight} 0 50%,
          {colorDark} 0 calc(500%/{ridgeDiv}),{colorLight} 0)`,
      'background-size': 'calc(1.732*{size}px) {size}px',
    },
    variables: {
      size: size(82, 40, 160, 2),
      colorDark: {
        type: 'color',
        value: '#b2b2b2',
      },
      colorMid: {
        type: 'color',
        value: '#d9d9d9',
      },
      colorLight: {
        type: 'color',
        value: '#ffffff',
      },
      cellDiv: {
        type: 'range',
        value: 3,
        min: 2.4,
        max: 4,
        step: 0.1,
      },
      wedge: {
        type: 'range',
        value: 60,
        min: 45,
        max: 75,
        step: 1,
      },
      faceWedge: {
        type: 'range',
        value: 120,
        min: 100,
        max: 140,
        step: 1,
      },
      ridgeDiv: {
        type: 'range',
        value: 6,
        min: 4.5,
        max: 8,
        step: 0.1,
      },
    },
  },

  'squares': {
    template: {
      'background': `
        conic-gradient(at {pos}% {pos}%,#0000 {fillStop}%,{colorOne} 0) {size}px {size}px,
        repeating-conic-gradient(at {pos}% {pos}%,{colorOne} 0 {split}%,{colorTwo} 0 50%)`,
      'background-size': 'calc(2*{size}px) calc(2*{size}px)',
    },
    variables: {
      size: size(50, 24, 120, 2),
      colorOne: {
        type: 'color',
        value: '#0B2E59',
      },
      colorTwo: {
        type: 'color',
        value: '#0D6759',
      },
      pos: {
        type: 'range',
        value: 25,
        min: 15,
        max: 35,
        step: 1,
      },
      fillStop: {
        type: 'range',
        value: 75,
        min: 65,
        max: 85,
        step: 0.5,
      },
      split: {
        type: 'range',
        value: 25,
        min: 15,
        max: 35,
        step: 1,
      },
    },
  },

  'nested_rhombus': {
    template: {
      '--_g1': `
        {colorOne} calc({band}%/3),#0000 0 calc(2*{band}%/3),
        {colorOne} 0 {band}%,#0000 0 calc(100% - {band}%),
        {colorOne} 0 calc(10*{band}%/3),#0000 0 calc(11*{band}%/3),
        {colorOne} 0`,
      '--_g2': `
        #0000 calc({band}%/3),{colorOne} 0 calc(2*{band}%/3),
        #0000 0 calc(10*{band}%/3),{colorOne} 0 calc(11*{band}%/3),
        #0000 0`,
      'background': `
        linear-gradient({angle}deg,var(--_g2)),linear-gradient({angle}deg,var(--_g1)),
        linear-gradient(calc(-1 * {angle}deg),var(--_g2)),linear-gradient(calc(-1 * {angle}deg),var(--_g1))
        {bgColor}`,
      'background-position': '0 0,{size}px {size}px',
      'background-size': 'calc(2*{size}px) calc(2*{size}px)',
    },
    variables: {
      size: size(100, 50, 200, 5),
      colorOne: {
        type: 'color',
        value: '#1BB0CE',
      },
      bgColor: {
        type: 'color',
        value: '#DAD6CA',
        role: 'ground',
      },
      band: {
        type: 'range',
        value: 25,
        min: 18,
        max: 32,
        step: 1,
      },
      angle: {
        type: 'range',
        value: 45,
        min: 30,
        max: 60,
        step: 1,
      },
    },
  },

  'linked_squares': {
    template: {
      '--_s': 'calc(2*{size}px) calc(2*{size}px)',
      '--_g': 'var(--_s) conic-gradient(at {outer}% {outer}%,#0000 {fillStop}%,{colorOne} 0)',
      '--_p': 'var(--_s) conic-gradient(at {inner}% {inner}%,#0000 {fillStop}%,{colorTwo} 0)',
      'background': `
        calc({link}* {size}px) calc({link}* {size}px)/var(--_p),
        calc(({link} - 1)*{size}px) calc(({link} - 1)*{size}px)/var(--_p),
        calc({mid}* {size}px) calc({mid}* {size}px)/var(--_g),
        calc(({mid} - 1)*{size}px) calc(({mid} - 1)*{size}px)/var(--_g),
        conic-gradient(from 90deg at {inner}% {inner}%,{colorTwo} 25%,{colorOne} 0)
          0 0/{size}px {size}px`,
    },
    variables: {
      size: size(100, 50, 180, 5),
      colorOne: {
        type: 'color',
        value: '#C3CCAF',
      },
      colorTwo: {
        type: 'color',
        value: '#67434F',
      },
      outer: {
        type: 'range',
        value: 40,
        min: 30,
        max: 50,
        step: 1,
      },
      inner: {
        type: 'range',
        value: 20,
        min: 12,
        max: 28,
        step: 1,
      },
      fillStop: {
        type: 'range',
        value: 75,
        min: 65,
        max: 85,
        step: 0.5,
      },
      link: {
        type: 'range',
        value: 0.9,
        min: 0.75,
        max: 0.98,
        step: 0.01,
      },
      mid: {
        type: 'range',
        value: 0.7,
        min: 0.55,
        max: 0.85,
        step: 0.01,
      },
    },
  },

  'z_shape': {
    template: {
      'background': `
        conic-gradient(from {tipFrom}deg at {tipX}% 75%,{colorOne} 60deg,{colorTwo} 0 120deg,#0000 0) 0 calc(.2165*{size}px),
        conic-gradient(from -90deg at 50% {mid}%,{colorTwo} 60deg,{colorOne} 0 180deg,#0000 0),
        conic-gradient(from 90deg at 50% calc(100% - {mid}%),{colorTwo} 120deg,{colorOne} 0 180deg,#0000 0),
        conic-gradient(from calc(-1 * {tipFrom}deg) at {tipX}% 50%,{colorTwo} 120deg,{colorOne} 0 240deg,#0000 0),
        conic-gradient(from 90deg at calc({tipX}% - 50%) 50%,{colorTwo} 120deg,{colorOne} 0 180deg,{colorTwo} 0 240deg,{colorOne} 0)`,
      'background-size': '{size}px calc(.866*{size}px)',
    },
    variables: {
      size: size(106, 50, 200, 2),
      colorOne: {
        type: 'color',
        value: '#EAFDE6',
      },
      colorTwo: {
        type: 'color',
        value: '#519548',
      },
      tipFrom: {
        type: 'range',
        value: 30,
        min: 15,
        max: 45,
        step: 1,
      },
      tipX: {
        type: 'range',
        value: 87.5,
        min: 75,
        max: 95,
        step: 0.5,
      },
      mid: {
        type: 'range',
        value: 25,
        min: 18,
        max: 35,
        step: 1,
      },
    },
  },

  'three_braided_lines': {
    template: {
      'background': `
        conic-gradient(at 50% calc(100%/{cellDiv}),{colorOne} {wedge}deg,#0000 0),
        conic-gradient(at calc(100%/{cellDiv}) 50%,#0000 calc(360deg - 2*{wedge}deg),{colorOne} 0),
        conic-gradient(from 180deg at calc(100%/{cellDiv}) calc(500%/{cellDiv}),{colorOne} {wedge}deg,#0000 0),
        conic-gradient(from 180deg at calc(500%/{cellDiv}),#0000 calc(360deg - 2*{wedge}deg),{colorOne} 0) calc(4*.866*{size}px) 0,
        repeating-linear-gradient(-150deg,{colorTwo} 0 calc(100%/{cellDiv}),#0000 0 50%),
        repeating-linear-gradient(-30deg,{colorThree} 0 calc(100%/{cellDiv}),{colorFour} 0 50%)`,
      'background-size': 'calc(6*.866*{size}px) calc(3*{size}px)',
    },
    variables: {
      size: size(30, 16, 60, 2),
      colorOne: {
        type: 'color',
        value: '#5E9FA3',
      },
      colorTwo: {
        type: 'color',
        value: '#B05574',
      },
      colorThree: {
        type: 'color',
        value: '#B39C82',
      },
      colorFour: {
        type: 'color',
        value: '#DCD1B4',
        role: 'ground',
      },
      cellDiv: {
        type: 'range',
        value: 6,
        min: 4.5,
        max: 8,
        step: 0.1,
      },
      wedge: {
        type: 'range',
        value: 60,
        min: 45,
        max: 75,
        step: 1,
      },
    },
  },

  'quatrefoils': {
    template: {
      '--_g': '#0000 {ring}%,{figureColor} calc({ring}% + {gap}%) calc({ring}% + {spread}%),#0000 calc({ring}% + {spread}% + {gap}%)',
      'background': `
        radial-gradient({petalA}% {petalB}% at right,var(--_g)) calc({size}px/2) {size}px,
        radial-gradient({petalA}% {petalB}% at left,var(--_g)) calc({size}px/-2) {size}px,
        radial-gradient({petalB}% {petalA}% at top,var(--_g)) 0 calc({size}px/2),
        radial-gradient({petalB}% {petalA}% at bottom,var(--_g)) 0 calc({size}px/-2)
        {bgColor}`,
      'background-size': 'calc(2*{size}px) calc(2*{size}px)',
    },
    variables: {
      size: size(60, 30, 140, 2),
      figureColor: {
        type: 'color',
        value: '#b09f79',
      },
      bgColor: {
        type: 'color',
        value: '#476074',
        role: 'ground',
      },
      petalA: {
        type: 'range',
        value: 27,
        min: 20,
        max: 35,
        step: 1,
      },
      petalB: {
        type: 'range',
        value: 29,
        min: 22,
        max: 38,
        step: 1,
      },
      ring: {
        type: 'range',
        value: 83,
        min: 75,
        max: 90,
        step: 0.5,
      },
      gap: {
        type: 'range',
        value: 2,
        min: 1,
        max: 4,
        step: 0.5,
      },
      spread: {
        type: 'range',
        value: 16,
        min: 10,
        max: 22,
        step: 0.5,
      },
    },
  },

  'curvy': {
    template: {
      '--_s': 'calc(2*{size}px) calc(2*{size}px)',
      '--_g': '{oval}% {oval}% at',
      '--_c': '#0000 {strokeStart}%,{colorOne} calc({strokeStart}% + {stroke}%) calc({strokeStart}% + 2*{stroke}%),#0000 calc({strokeStart}% + 3*{stroke}%)',
      'background': `
        radial-gradient(var(--_g) 100% 25%,var(--_c)) {size}px {size}px/var(--_s),
        radial-gradient(var(--_g) 0 75%,var(--_c)) {size}px {size}px/var(--_s),
        radial-gradient(var(--_g) 100% 25%,var(--_c)) 0 0/var(--_s),
        radial-gradient(var(--_g) 0 75%,var(--_c)) 0 0/var(--_s),
        repeating-conic-gradient({colorTwo} 0 25%,#0000 0 50%) 0 0/var(--_s),
        radial-gradient(var(--_c)) 0 calc({size}px/2)/{size}px {size}px
        {colorTwo}`,
    },
    variables: {
      size: size(80, 40, 160, 2),
      colorOne: {
        type: 'color',
        value: '#bfb35a',
      },
      colorTwo: {
        type: 'color',
        value: '#5E8C6A',
        role: 'ground',
      },
      oval: {
        type: 'range',
        value: 35.36,
        min: 28,
        max: 42,
        step: 0.5,
      },
      strokeStart: {
        type: 'range',
        value: 66,
        min: 55,
        max: 75,
        step: 1,
      },
      stroke: {
        type: 'range',
        value: 2,
        min: 1,
        max: 4,
        step: 0.5,
      },
    },
  },

  'loop_circles': {
    template: {
      '--_g': '{colorOne} {edge}%,{colorTwo} calc({edge}% + {gap}%) calc({edge}% + {gap}% + {band}%),{colorOne} calc({edge}% + 2*{gap}% + {band}%) calc({edge}% + 2*{gap}% + 2*{band}%),{colorTwo} calc({edge}% + 3*{gap}% + 2*{band}%) calc({edge}% + 3*{gap}% + 3*{band}%),{colorOne} calc({edge}% + 4*{gap}% + 3*{band}%) calc({edge}% + 4*{gap}% + 4*{band}%),{colorTwo} calc({edge}% + 5*{gap}% + 4*{band}%) calc({edge}% + 5*{gap}% + 5*{band}%),#0000 calc({edge}% + 6*{gap}% + 5*{band}%)',
      'background': `
        radial-gradient({size}px at 100% 0,var(--_g)),
        radial-gradient({size}px at 0 0,var(--_g)),
        radial-gradient({size}px at 0 100%,var(--_g)),
        radial-gradient({size}px at 100% 100%,var(--_g)) {colorOne}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(150, 70, 260, 5),
      colorOne: {
        type: 'color',
        value: '#CCBF82',
        role: 'ground',
      },
      colorTwo: {
        type: 'color',
        value: '#604848',
      },
      edge: {
        type: 'range',
        value: 6.1,
        min: 3,
        max: 12,
        step: 0.1,
      },
      gap: {
        type: 'range',
        value: 0.3,
        min: 0.1,
        max: 1.2,
        step: 0.1,
      },
      band: {
        type: 'range',
        value: 12.2,
        min: 8,
        max: 16,
        step: 0.1,
      },
    },
  },

  'rotated_squares': {
    template: {
      '--_g': '#0000 {cut}deg,{colorOne} 0',
      'background': `
        conic-gradient(from {angle}deg at calc(100%/{cellDiv}) 0,var(--_g)),
        conic-gradient(from calc({angle}deg - 180deg) at calc(200%/{cellDiv}) 100%,var(--_g))
        {bgColor}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(150, 70, 260, 5),
      colorOne: {
        type: 'color',
        value: '#046D8B',
      },
      bgColor: {
        type: 'color',
        value: '#2FB8AC',
        role: 'ground',
      },
      angle: {
        type: 'range',
        value: 116.56,
        min: 95,
        max: 140,
        step: 0.5,
      },
      cellDiv: {
        type: 'range',
        value: 3,
        min: 2.4,
        max: 4,
        step: 0.1,
      },
      cut: {
        type: 'range',
        value: 90,
        min: 70,
        max: 110,
        step: 1,
      },
    },
  },

  'diagonal_zig_zag': {
    template: {
      '--_s': 'calc(2*{size}px) calc(2*{size}px)',
      '--_g1': 'var(--_s) conic-gradient(at calc(500%/(2*{cellDiv})) 50%,{colorDark} {split}%,#0000 0)',
      '--_g2': 'var(--_s) conic-gradient(at calc(200%/{cellDiv}) 50%,{colorMid} {split}%,#0000 0)',
      'background': `
        {size}px {size}px/var(--_g1),0 0/var(--_g1),
        {size}px {size}px/var(--_g2),0 0/var(--_g2),
        repeating-conic-gradient({colorLight} 0 {split}%,#0000 0 50%) 0 0/var(--_s),
        linear-gradient({colorLight} calc(100%/{cellDiv}),{colorMid} 0 calc(200%/{cellDiv}),{colorDark} 0)
          0 0/{size}px {size}px`,
    },
    variables: {
      size: size(60, 30, 120, 2),
      colorDark: {
        type: 'color',
        value: '#803201',
      },
      colorMid: {
        type: 'color',
        value: '#fe6601',
      },
      colorLight: {
        type: 'color',
        value: '#ffdc56',
      },
      cellDiv: {
        type: 'range',
        value: 3,
        min: 2.4,
        max: 4,
        step: 0.1,
      },
      split: {
        type: 'range',
        value: 25,
        min: 15,
        max: 35,
        step: 1,
      },
    },
  },

  'stairs_3d': {
    harmony: 'ramp',
    template: {
      '--_g': 'conic-gradient(at 50% {step}%,#0000 {fillStop}%,{colorOne} 0)',
      'background': `
        var(--_g),var(--_g) {size}px {size}px,
        var(--_g) calc(2*{size}px) calc(2*{size}px),
        var(--_g) calc(3*{size}px) calc(3*{size}px),
        repeating-linear-gradient({angle}deg,{colorDark} 0 {band}%,{colorLight} 0 {split}%)`,
      'background-size': 'calc(4*{size}px) calc(4*{size}px)',
    },
    variables: {
      size: size(50, 24, 120, 2),
      colorOne: {
        type: 'color',
        value: '#f86466',
      },
      colorDark: {
        type: 'color',
        value: '#000000',
      },
      colorLight: {
        type: 'color',
        value: '#ffffff',
      },
      fillStop: {
        type: 'range',
        value: 75,
        min: 65,
        max: 85,
        step: 0.5,
      },
      step: {
        type: 'range',
        value: 25,
        min: 18,
        max: 32,
        step: 1,
      },
      angle: {
        type: 'range',
        value: 135,
        min: 120,
        max: 150,
        step: 1,
      },
      band: {
        type: 'range',
        value: 12.5,
        min: 8,
        max: 18,
        step: 0.5,
      },
      split: {
        type: 'range',
        value: 25,
        min: 20,
        max: 35,
        step: 1,
      },
    },
  },

  'nested_diamond': {
    template: {
      '--_g': '#0000, {colorDark} {gap}deg {wedge}deg,{colorMid} calc({wedge}deg + {gap}deg) calc({face}deg - {gap}deg),{colorDark} {face}deg calc({wedge}deg + {face}deg - {gap}deg),#0000 calc({wedge}deg + {face}deg)',
      'background': `
        conic-gradient(from -60deg at 50% {arm}%,var(--_g)),
        conic-gradient(from 30deg at calc(100% - {arm}%) 50%,var(--_g)),
        conic-gradient(from 120deg at 50% calc(100% - {arm}%),var(--_g)),
        conic-gradient(from 210deg at {arm}% 50%,var(--_g))
        {bgColor}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(100, 50, 200, 5),
      colorDark: {
        type: 'color',
        value: '#668284',
      },
      colorMid: {
        type: 'color',
        value: '#B6D8C0',
      },
      bgColor: {
        type: 'color',
        value: '#B9D7D9',
        role: 'ground',
      },
      wedge: {
        type: 'range',
        value: 30,
        min: 22,
        max: 38,
        step: 1,
      },
      face: {
        type: 'range',
        value: 90,
        min: 75,
        max: 105,
        step: 1,
      },
      gap: {
        type: 'range',
        value: 1,
        min: 0.5,
        max: 3,
        step: 0.5,
      },
      arm: {
        type: 'range',
        value: 28.86,
        min: 24,
        max: 34,
        step: 0.5,
      },
    },
  },

  'circles_squares': {
    template: {
      '--_g': '{figureColor} 0 100%,#0000 102%',
      'background': `
        conic-gradient(#0000 {fillStop}%,var(--_g)) calc({size}px/4) calc({size}px/4),
        radial-gradient({radial}% {radial}% at 50% -50%,var(--_g)),
        radial-gradient({radial}% {radial}% at -50% 50%,var(--_g)),
        radial-gradient({radial}% {radial}% at 50% 150%,var(--_g)),
        radial-gradient({radial}% {radial}% at 150% 50%,var(--_g))
        {bgColor}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(100, 50, 200, 5),
      figureColor: {
        type: 'color',
        value: '#FCD036',
      },
      bgColor: {
        type: 'color',
        value: '#987F69',
        role: 'ground',
      },
      fillStop: {
        type: 'range',
        value: 75,
        min: 65,
        max: 85,
        step: 0.5,
      },
      radial: {
        type: 'range',
        value: 65,
        min: 50,
        max: 80,
        step: 1,
      },
    },
  },

  'triangles_trapezoids': {
    template: {
      'background': `
        conic-gradient(from {fromA}deg,{colorOne} {wedge}deg,#0000 0 180deg,{colorThree} 0 240deg,#0000 0) {size}px 0,
        conic-gradient(from {fromB}deg,{colorOne} {wedge}deg,{colorTwo} 0 120deg,{colorFour} 0 180deg,{colorThree} 0 240deg,{colorTwo} 0 300deg,{colorFour} 0)`,
      'background-size': 'calc(2*{size}px) {size}px',
    },
    variables: {
      size: size(76, 36, 160, 2),
      colorOne: {
        type: 'color',
        value: '#F77825',
      },
      colorTwo: {
        type: 'color',
        value: '#F1EFA5',
      },
      colorThree: {
        type: 'color',
        value: '#60B99A',
      },
      colorFour: {
        type: 'color',
        value: '#554236',
      },
      wedge: {
        type: 'range',
        value: 60,
        min: 45,
        max: 75,
        step: 1,
      },
      fromA: {
        type: 'range',
        value: 150,
        min: 120,
        max: 180,
        step: 1,
      },
      fromB: {
        type: 'range',
        value: -30,
        min: -60,
        max: 0,
        step: 1,
      },
    },
  },

  'striped_circles': {
    template: {
      '--_g': 'conic-gradient({stripeColor} {split}%,#0000 0) 0 0',
      'background': `
        var(--_g)/calc(2*{size}px) calc({size}px/{stripeDiv}),
        var(--_g)/calc({size}px/{stripeDiv}) calc(2*{size}px),
        repeating-conic-gradient(#0000 0 {split}%,{stripeColor} 0 50%)
          {size}px 0/calc(2*{size}px) calc(2*{size}px),
        radial-gradient(50% 50%,{centerColor} {circleFill}%,{stripeColor})
          0 0/{size}px {size}px`,
    },
    variables: {
      size: size(76, 36, 160, 2),
      stripeColor: {
        type: 'color',
        value: '#1a144a',
      },
      centerColor: {
        type: 'color',
        value: '#2eb044',
      },
      split: {
        type: 'range',
        value: 25,
        min: 15,
        max: 35,
        step: 1,
      },
      stripeDiv: {
        type: 'range',
        value: 9.5,
        min: 6,
        max: 14,
        step: 0.5,
      },
      circleFill: {
        type: 'range',
        value: 98,
        min: 92,
        max: 99,
        step: 0.5,
      },
    },
  },

  'nested_triangles_3d': {
    harmony: 'ramp',
    template: {
      '--_g': 'conic-gradient(from {tipFrom}deg at 50% {tipY}%,#0000 calc(360deg - {wedge}deg),{colorOne} 0)',
      'background': `
        var(--_g) calc(0.2885*{size}px) calc(7*{size}px/12),
        var(--_g) 0 calc({size}px/12),
        conic-gradient(from 120deg at 50% calc(250%/{cellDiv}),{colorTwo} calc(2*{wedge}deg),#0000 0),
        repeating-conic-gradient(from {tipFrom}deg,#0000 0 {wedge}deg,{colorThree} 0 calc(2*{wedge}deg)),
        repeating-conic-gradient({colorFour} 0 {wedge}deg,{colorTwo} 0 calc(2*{wedge}deg),{colorFive} 0 calc(3*{wedge}deg))`,
      'background-size': 'calc(0.577*{size}px) {size}px',
    },
    variables: {
      size: size(162, 80, 280, 2),
      colorOne: {
        type: 'color',
        value: '#cd2942',
      },
      colorTwo: {
        type: 'color',
        value: '#62928c',
      },
      colorThree: {
        type: 'color',
        value: '#e8cba9',
      },
      colorFour: {
        type: 'color',
        value: '#33152e',
      },
      colorFive: {
        type: 'color',
        value: '#414352',
      },
      wedge: {
        type: 'range',
        value: 60,
        min: 45,
        max: 75,
        step: 1,
      },
      tipFrom: {
        type: 'range',
        value: 30,
        min: 15,
        max: 45,
        step: 1,
      },
      tipY: {
        type: 'range',
        value: 25,
        min: 18,
        max: 32,
        step: 1,
      },
      cellDiv: {
        type: 'range',
        value: 3,
        min: 2.4,
        max: 4,
        step: 0.1,
      },
    },
  },

  'triangles_grid': {
    template: {
      '--_g': '{colorOne} {split}%,{colorTwo} 0 50%,#0000 0',
      '--_l1': '#ffffff 0 {line}px,#0000 0 calc({split}% - {line}px),#ffffff 0 {split}%',
      '--_l2': '#ffffff 0 {line}px,#0000 0 calc(50% - {line}px),#ffffff 0 50%',
      'background': `
        repeating-linear-gradient(45deg,var(--_l1)),
        repeating-linear-gradient(-45deg,var(--_l1)),
        repeating-linear-gradient(0deg,var(--_l2)),
        repeating-linear-gradient(90deg,var(--_l2)),
        conic-gradient(from 135deg at 25% 75%,var(--_g)),
        conic-gradient(from 225deg at 25% 25%,var(--_g)),
        conic-gradient(from 45deg at 75% 75%,var(--_g)),
        conic-gradient(from -45deg at 75% 25%,var(--_g)),
        repeating-conic-gradient({colorThree} 0 45deg,{colorFour} 0 90deg)`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(200, 100, 320, 5),
      colorOne: {
        type: 'color',
        value: '#dc9d37',
      },
      colorTwo: {
        type: 'color',
        value: '#fed450',
      },
      colorThree: {
        type: 'color',
        value: '#125c65',
      },
      colorFour: {
        type: 'color',
        value: '#bc4a33',
      },
      split: {
        type: 'range',
        value: 25,
        min: 18,
        max: 32,
        step: 1,
      },
      line: {
        type: 'range',
        value: 1,
        min: 0.5,
        max: 3,
        step: 0.5,
      },
    },
  },

  'flower_petals': {
    template: {
      '--_g': 'radial-gradient({petal}% {petal}% at 25% 25%,{colorTwo} 99%,#0000 101%)',
      'background': `
        var(--_g) {size}px {size}px/calc(2*{size}px) calc(2*{size}px),
        var(--_g) 0 0/calc(2*{size}px) calc(2*{size}px),
        radial-gradient(50% 50%,{colorOne} 98%,#0000) 0 0/{size}px {size}px,
        repeating-conic-gradient({colorOne} 0 {split}%,{colorTwo} 0 50%)
          calc(.5*{size}px) 0/calc(2*{size}px) {size}px`,
    },
    variables: {
      size: size(60, 30, 140, 2),
      colorOne: {
        type: 'color',
        value: '#91204D',
      },
      colorTwo: {
        type: 'color',
        value: '#F2B4A8',
      },
      petal: {
        type: 'range',
        value: 25,
        min: 18,
        max: 35,
        step: 1,
      },
      split: {
        type: 'range',
        value: 25,
        min: 18,
        max: 35,
        step: 1,
      },
    },
  },

  'circles_curved_lines': {
    template: {
      '--_l': '#0000 {strokeStart}%,{lineColor} calc({strokeStart}% + {soft}%) calc({strokeStart}% + {soft}% + {band}%),#0000 calc({strokeStart}% + 2*{soft}% + {band}%)',
      'background': `
        radial-gradient(100% 100% at 100% 100%,var(--_l)) {size}px {size}px,
        radial-gradient(100% 100% at 0 0,var(--_l)) {size}px {size}px,
        radial-gradient(100% 100%,
          #0000 {ringStart}%,
          {lineColor} calc({ringStart}% + {soft}%) calc({ringStart}% + {soft}% + {band}%),
          #0000 calc({ringStart}% + 2*{soft}% + {band}%) calc({ringStart}% + 2*{soft}% + {band}% + {gap}%),
          {lineColor} calc({ringStart}% + 3*{soft}% + {band}% + {gap}%) calc({ringStart}% + 3*{soft}% + 2*{band}% + {gap}%),
          #0000 calc({ringStart}% + 4*{soft}% + 2*{band}% + {gap}%)),
        {bgColor}`,
      'background-size': 'calc({size}px*2) calc({size}px*2)',
    },
    variables: {
      size: size(70, 35, 150, 2),
      lineColor: {
        type: 'color',
        value: '#6B5344',
      },
      bgColor: {
        type: 'color',
        value: '#F8ECC9',
        role: 'ground',
      },
      strokeStart: {
        type: 'range',
        value: 46,
        min: 38,
        max: 52,
        step: 1,
      },
      ringStart: {
        type: 'range',
        value: 22,
        min: 16,
        max: 28,
        step: 1,
      },
      soft: {
        type: 'range',
        value: 1,
        min: 0.5,
        max: 2,
        step: 0.5,
      },
      band: {
        type: 'range',
        value: 6,
        min: 3,
        max: 10,
        step: 0.5,
      },
      gap: {
        type: 'range',
        value: 4,
        min: 2,
        max: 8,
        step: 0.5,
      },
    },
  },

  'wavy_3d': {
    harmony: 'ramp',
    template: {
      '--_g': `
        {colorDark} {edge}% calc({edge}% + {band}%),
        {colorLight} calc({edge}% + {band}% + {gap}%) calc({edge}% + 2*{band}% + {gap}%),
        {colorDark} calc({edge}% + 2*{band}% + 2*{gap}%) calc({edge}% + 3*{band}% + 2*{gap}%),
        {colorLight} calc({edge}% + 3*{band}% + 3*{gap}%) calc({edge}% + 4*{band}% + 3*{gap}%),
        {colorDark} calc({edge}% + 4*{band}% + 4*{gap}%) calc({edge}% + 5*{band}% + 4*{gap}%),
        {colorLight} calc({edge}% + 5*{band}% + 5*{gap}%) calc({edge}% + 6*{band}% + 5*{gap}%),
        {colorDark} calc({edge}% + 6*{band}% + 6*{gap}%) calc({edge}% + 7*{band}% + 6*{gap}%),
        {colorLight} calc({edge}% + 7*{band}% + 7*{gap}%) calc({edge}% + 8*{band}% + 7*{gap}%),
        {colorDark} calc({edge}% + 8*{band}% + 8*{gap}%) calc({edge}% + 9*{band}% + 8*{gap}%)`,
      'background': `
        radial-gradient(100% 100% at 100% 0,{colorLight} {highlight}%,var(--_g),#0008 calc(100% - {highlight}%),#0000),
        radial-gradient(100% 100% at 0 100%,#0000,#0008 {highlight}%,var(--_g),{colorLight} calc(100% - {highlight}%))
        {colorLight}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(100, 50, 200, 5),
      colorDark: {
        type: 'color',
        value: '#355C7D',
      },
      colorLight: {
        type: 'color',
        value: '#F8B195',
      },
      edge: {
        type: 'range',
        value: 6,
        min: 3,
        max: 10,
        step: 0.5,
      },
      gap: {
        type: 'range',
        value: 2,
        min: 1,
        max: 4,
        step: 0.5,
      },
      band: {
        type: 'range',
        value: 8,
        min: 5,
        max: 12,
        step: 0.5,
      },
      highlight: {
        type: 'range',
        value: 4,
        min: 2,
        max: 8,
        step: 0.5,
      },
    },
  },

  'wavy_lines': {
    template: {
      '--_g': '#0000 {edge}%,#0008 calc({edge}% + 22%),{colorOne} calc({edge}% + 28%) calc({edge}% + 122%),{colorTwo} calc({edge}% + 128%) calc({edge}% + 222%),{colorOne} calc({edge}% + 228%) calc({edge}% + 322%),{colorTwo} calc({edge}% + 328%) calc({edge}% + 422%),{colorOne} calc({edge}% + 428%) calc({edge}% + 522%),#0008 calc({edge}% + 528%),#0000 calc({edge}% + 550%)',
      '--_s': 'calc(25%/3) calc(25%/4) at 50%',
      'background': `
        radial-gradient(var(--_s) 100%,var(--_g)),
        radial-gradient(var(--_s) 100%,var(--_g)) calc({size}px/2) calc(3*{size}px/4),
        radial-gradient(var(--_s) 0,var(--_g)) calc({size}px/2) 0,
        radial-gradient(var(--_s) 0,var(--_g)) 0 calc(3*{size}px/4),
        repeating-linear-gradient(90deg,{colorThree} calc(25%/-6) calc(25%/6),{colorFour} 0 calc(25%/2))`,
      'background-size': '{size}px calc(3*{size}px/2)',
    },
    variables: {
      size: size(140, 70, 240, 5),
      colorOne: {
        type: 'color',
        value: '#AB3E5B',
      },
      colorTwo: {
        type: 'color',
        value: '#FFBE40',
      },
      colorThree: {
        type: 'color',
        value: '#ACCEC0',
      },
      colorFour: {
        type: 'color',
        value: '#61A6AB',
        role: 'ground',
      },
      edge: {
        type: 'range',
        value: 25,
        min: 18,
        max: 32,
        step: 1,
      },
    },
  },

  'arabesque_style': {
    template: {
      '--t': 'calc({size}px/{thicknessDiv})',
      '--_c': '#0000 calc(98% - var(--t)),{figureColor} calc(100% - var(--t)) 98%,#0000',
      '--_s': 'calc(2*{size}px) calc(5*{size}px/2)',
      '--_r0': '/var(--_s) radial-gradient(calc({size}px/2) at 0 20%,var(--_c))',
      '--_r1': '/var(--_s) radial-gradient(calc({size}px/2) at 100% 20%,var(--_c))',
      'background': `
        0 0 var(--_r0),calc(-1*{size}px) calc(5*{size}px/4) var(--_r0),
        {size}px 0 var(--_r1),0 calc(5*{size}px/4) var(--_r1),
        conic-gradient(at var(--t) calc(20% + 2*var(--t)),#0000 {fillStop}%,{figureColor} 0)
          calc(var(--t)/-2) calc({size}px - var(--t))/{size}px calc(5*{size}px/4),
        repeating-conic-gradient({bgColor} 0 25%,#0000 0 50%)
          {size}px calc({size}px/-8)/var(--_s),
        conic-gradient(from 90deg at var(--t) var(--t),{bgColor} 25%,{figureColor} 0)
          calc(({size}px - var(--t))/2) calc(({size}px - var(--t))/2)/{size}px calc(5*{size}px/4)`,
    },
    variables: {
      size: size(50, 28, 100, 2),
      figureColor: {
        type: 'color',
        value: '#084c7f',
      },
      bgColor: {
        type: 'color',
        value: '#fef5e9',
        role: 'ground',
      },
      thicknessDiv: {
        type: 'range',
        value: 10,
        min: 6,
        max: 16,
        step: 0.5,
      },
      fillStop: {
        type: 'range',
        value: 75,
        min: 65,
        max: 85,
        step: 0.5,
      },
    },
  },

  'citrus_shapes': {
    template: {
      '--b': 'calc({size}px/{thickDiv})',
      '--_r': 'calc(1.28*{size}px + var(--b)/2) at top 50%',
      '--_f': 'calc(99.5% - var(--b)),{fillColor} calc(101% - var(--b)) 99.5%,#0000 101%',
      '--_g0': 'calc(-.8*{size}px), {colorOne} var(--_f)',
      '--_g1': 'calc(-.8*{size}px), {colorTwo} var(--_f)',
      '--_s': 'calc(1.8*{size}px + var(--b))',
      'background': `
        radial-gradient(var(--_r) right var(--_g0)) calc(-1*var(--_s)) {size}px,
        radial-gradient(var(--_r) left var(--_g1)) var(--_s) calc(-1*{size}px),
        radial-gradient(var(--_r) right var(--_g1)) calc(var(--_s)/-2) calc(-1*{size}px),
        radial-gradient(var(--_r) left var(--_g0)) calc(var(--_s)/2) {size}px,
        linear-gradient(90deg,{colorOne} 50%,{colorTwo} 0)`,
      'background-size': 'var(--_s) calc(4*{size}px)',
    },
    variables: {
      size: size(55, 28, 110, 1),
      colorOne: {
        type: 'color',
        value: '#88A65E',
      },
      colorTwo: {
        type: 'color',
        value: '#BFB35A',
      },
      fillColor: {
        type: 'color',
        value: '#F9F2E7',
        role: 'ground',
      },
      thickDiv: {
        type: 'range',
        value: 3.67,
        min: 2.5,
        max: 5.5,
        step: 0.01,
      },
    },
  },

  'quarter_circles': {
    template: {
      '--_g': '{figureColor} {fill}%, #0000 calc({fill}% + {gap}%)',
      'background': `
        radial-gradient(at 100% 100%, var(--_g)),
        radial-gradient(at 0 0, var(--_g))
        {bgColor}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(64, 28, 140, 2),
      figureColor: {
        type: 'color',
        value: '#036564',
      },
      bgColor: {
        type: 'color',
        value: '#E8DDCB',
        role: 'ground',
      },
      fill: {
        type: 'range',
        value: 35,
        min: 25,
        max: 48,
        step: 0.5,
      },
      gap: {
        type: 'range',
        value: 1,
        min: 0.5,
        max: 4,
        step: 0.5,
      },
    },
  },

  'rhombus_nested': {
    template: {
      '--_g': '#0000 calc(-650%/{bandDiv}) calc(50%/{bandDiv}),{figureColor} 0 calc(100%/{bandDiv}),#0000 0 calc(150%/{bandDiv}),{figureColor} 0 calc(200%/{bandDiv}),#0000 0 calc(250%/{bandDiv}),{figureColor} 0 calc(300%/{bandDiv})',
      '--_g0': 'repeating-linear-gradient(45deg,var(--_g))',
      '--_g1': 'repeating-linear-gradient(-45deg,var(--_g))',
      'background': `
        var(--_g0),var(--_g0) {size}px {size}px,
        var(--_g1),var(--_g1) {size}px {size}px {bgColor}`,
      'background-size': 'calc(2*{size}px) calc(2*{size}px)',
    },
    variables: {
      size: size(80, 40, 160, 5),
      figureColor: {
        type: 'color',
        value: '#542437',
      },
      bgColor: {
        type: 'color',
        value: '#C02942',
        role: 'ground',
      },
      bandDiv: {
        type: 'range',
        value: 13,
        min: 9,
        max: 17,
        step: 1,
      },
    },
  },

  'lollipop': {
    template: {
      '--_c1': '{colorOne} 99%,#0000 101%',
      '--_c2': '{colorTwo} 99%,#0000 101%',
      '--r': 'calc({size}px*.866)',
      '--g0': 'radial-gradient({size}px,var(--_c1))',
      '--g1': 'radial-gradient({size}px,var(--_c2))',
      '--f': 'radial-gradient({size}px at calc(100% + var(--r)) 50%,var(--_c1))',
      '--p': 'radial-gradient({size}px at 100% 50%,var(--_c2))',
      'background': `
        var(--f) 0 calc(-5*{size}px/2),
        var(--f) calc(-2*var(--r)) calc({size}px/2),
        var(--p) 0 calc(-2*{size}px),
        var(--g0) var(--r) calc(-5*{size}px/2),
        var(--g1) var(--r) calc(5*{size}px/2),
        radial-gradient({size}px at 100% 100%,var(--_c1)) 0 calc(-1*{size}px),
        radial-gradient({size}px at 0% 50%,var(--_c1)) 0 calc(-4*{size}px),
        var(--g1) calc(-1*var(--r)) calc(-7*{size}px/2),
        var(--g0) calc(-1*var(--r)) calc(-5*{size}px/2),
        var(--p) calc(-2*var(--r)) {size}px,
        var(--g0) calc(-1*var(--r)) calc({size}px/2),
        var(--g1) calc(-1*var(--r)) calc({size}px/-2),
        var(--g0) 0 calc(-1*{size}px),
        var(--g1) var(--r) calc({size}px/-2),
        var(--g0) var(--r) calc({size}px/2)
        {colorTwo}`,
      'background-size': 'calc(4*var(--r)) calc(6*{size}px)',
    },
    variables: {
      size: size(56, 28, 100, 2),
      colorOne: {
        type: 'color',
        value: '#3FB8AF',
      },
      colorTwo: {
        type: 'color',
        value: '#FF9E9D',
        role: 'ground',
      },
    },
  },

  'semi_circles': {
    template: {
      '--_g': 'radial-gradient({figureColor} {fill}%,#0000 calc({fill}% + {gap}%))',
      'background': `
        var(--_g) calc({size}px/-2) calc({size}px/2),
        repeating-conic-gradient(from {angle}deg,{bgColor} 0 25%,#0000 0 50%)
          calc({size}px/2) calc({size}px/2),
        var(--_g),var(--_g) {size}px {size}px {bgColor}`,
      'background-size': 'calc(2*{size}px) calc(2*{size}px)',
    },
    variables: {
      size: size(50, 24, 120, 2),
      figureColor: {
        type: 'color',
        value: '#0B486B',
      },
      bgColor: {
        type: 'color',
        value: '#CFF09E',
        role: 'ground',
      },
      fill: {
        type: 'range',
        value: 49,
        min: 40,
        max: 55,
        step: 0.5,
      },
      gap: {
        type: 'range',
        value: 1,
        min: 0.5,
        max: 4,
        step: 0.5,
      },
      angle: {
        type: 'range',
        value: 45,
        min: 0,
        max: 90,
        step: 1,
      },
    },
  },

  'christmas_tree': {
    template: {
      '--_c': '#0000,{treeColor} {gap}deg calc({wedge}deg - {gap}deg),#0000 calc({wedge}deg + {gap}deg)',
      '--g0': 'conic-gradient(from {from}deg at 50% 87.5%,var(--_c))',
      '--g1': 'conic-gradient(from {from}deg at 50% 81.25%,var(--_c))',
      '--g2': 'conic-gradient(from {from}deg at 50% 75%,var(--_c))',
      '--g3': 'conic-gradient(at 10% 20%,#0000 75%,{treeColor} 0)',
      'background': `
        var(--g0) 0 calc({size}px/-4),var(--g0) {size}px calc(3*{size}px/4),
        var(--g1),var(--g1) {size}px {size}px,
        var(--g2) 0 calc({size}px/4),var(--g2) {size}px calc(5*{size}px/4),
        var(--g3) calc({size}px/-10) {size}px,
        var(--g3) calc(9*{size}px/10) calc(2*{size}px),
        repeating-conic-gradient(from 45deg,{colorOne} 0 25%,{colorTwo} 0 50%)`,
      'background-size': 'calc(2*{size}px) calc(2*{size}px)',
    },
    variables: {
      size: size(75, 40, 140, 5),
      treeColor: {
        type: 'color',
        value: '#ffffff',
      },
      colorOne: {
        type: 'color',
        value: '#a31e39',
      },
      colorTwo: {
        type: 'color',
        value: '#31570e',
      },
      from: {
        type: 'range',
        value: 140,
        min: 120,
        max: 160,
        step: 1,
      },
      wedge: {
        type: 'range',
        value: 80,
        min: 60,
        max: 100,
        step: 1,
      },
      gap: {
        type: 'range',
        value: 1,
        min: 0.5,
        max: 3,
        step: 0.5,
      },
    },
  },

  'christmas': {
    template: {
      '--b': 'calc({size}px/{thickDiv})',
      '--_r': 'calc(1.28*{size}px + var(--b)/2) at left 50%',
      '--_f': 'calc(100% - var(--b)),{fillColor} calc(101% - var(--b)) 100%,#0000 101%',
      '--g0': 'calc(-.8*{size}px),{colorOne} var(--_f)',
      '--g1': 'calc(-.8*{size}px),{colorTwo} var(--_f)',
      '--_s': 'calc(1.5*{size}px + var(--b))',
      'background': `
        radial-gradient(var(--_r) bottom var(--g0)) calc(2*{size}px) calc(-1*var(--_s)),
        radial-gradient(var(--_r) bottom var(--g1)) calc(-1*{size}px) calc(var(--_s)/-2),
        radial-gradient(var(--_r) top var(--g1)) 0 var(--_s),
        radial-gradient(var(--_r) top var(--g0)) {size}px calc(var(--_s)/2),
        linear-gradient({colorOne} 50%,{colorTwo} 0)`,
      'background-size': 'calc(4*{size}px) var(--_s)',
    },
    variables: {
      size: size(48, 24, 100, 2),
      colorOne: {
        type: 'color',
        value: '#bb2528',
      },
      colorTwo: {
        type: 'color',
        value: '#146b3a',
      },
      fillColor: {
        type: 'color',
        value: '#d8d8d8',
        role: 'ground',
      },
      thickDiv: {
        type: 'range',
        value: 2.67,
        min: 1.8,
        max: 4,
        step: 0.01,
      },
    },
  },

  'diagonal_rectangles': {
    template: {
      'background': `
        linear-gradient({angle}deg,#0000 {cutStart}%,{colorOne} 0 {cutEnd}%,#0000 0),
        repeating-linear-gradient(calc({angle}deg - 90deg),{colorOne} calc(-1 * {band}%) {band}%,{colorTwo} 0 calc(3*{band}%))`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(150, 70, 260, 5),
      colorOne: {
        type: 'color',
        value: '#5E412F',
      },
      colorTwo: {
        type: 'color',
        value: '#FCEBB6',
        role: 'ground',
      },
      angle: {
        type: 'range',
        value: 135,
        min: 120,
        max: 150,
        step: 1,
      },
      cutStart: {
        type: 'range',
        value: 18.75,
        min: 12,
        max: 24,
        step: 0.25,
      },
      cutEnd: {
        type: 'range',
        value: 31.25,
        min: 26,
        max: 38,
        step: 0.25,
      },
      band: {
        type: 'range',
        value: 6.25,
        min: 4,
        max: 10,
        step: 0.25,
      },
    },
  },

  'rhombus_octagons': {
    template: {
      '--_g': '{colorOne} {inner}%,{colorTwo} 0 {mid}%,#0000 0 calc(100% - {mid}%),{colorTwo} 0 calc(100% - {inner}%),{colorOne} 0',
      'background': `
        conic-gradient(from 90deg at {dot}px {dot}px,#0000 25%,{colorOne} 0) calc(-0.5*{dot}px) calc(-0.5*{dot}px),
        linear-gradient(-45deg,var(--_g)),linear-gradient(45deg,var(--_g)),
        conic-gradient(from 90deg at {cell}% {cell}%,{colorOne} 25%,{colorTwo} 0)
          calc({size}px/-5) calc({size}px/-5)`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(120, 60, 220, 5),
      colorOne: {
        type: 'color',
        value: '#4E395D',
      },
      colorTwo: {
        type: 'color',
        value: '#8EBE94',
      },
      inner: {
        type: 'range',
        value: 15,
        min: 10,
        max: 22,
        step: 0.5,
      },
      mid: {
        type: 'range',
        value: 28,
        min: 22,
        max: 36,
        step: 0.5,
      },
      cell: {
        type: 'range',
        value: 40,
        min: 30,
        max: 50,
        step: 1,
      },
      dot: {
        type: 'range',
        value: 2,
        min: 1,
        max: 4,
        step: 0.5,
      },
    },
  },

  'colorful_circles': {
    template: {
      '--_g': 'radial-gradient(#0000 {ring}%,{ringColor} calc({ring}% + {gap}%))',
      'background': `
        var(--_g),var(--_g) calc({size}px/2) calc({size}px/2),
        conic-gradient({colorOne} 25%,{colorTwo} 0 50%,{colorThree} 0 75%,{colorFour} 0)`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(120, 60, 220, 5),
      colorOne: {
        type: 'color',
        value: '#0f9177',
      },
      colorTwo: {
        type: 'color',
        value: '#fdebad',
      },
      colorThree: {
        type: 'color',
        value: '#d34434',
      },
      colorFour: {
        type: 'color',
        value: '#b5d999',
      },
      ringColor: {
        type: 'color',
        value: '#1a2030',
      },
      ring: {
        type: 'range',
        value: 70,
        min: 55,
        max: 82,
        step: 1,
      },
      gap: {
        type: 'range',
        value: 1,
        min: 0.5,
        max: 4,
        step: 0.5,
      },
    },
  },

  'pill_shapes': {
    template: {
      '--_g': 'radial-gradient(calc({size}px/2),{colorOne} 97%,#0000)',
      'background': `
        var(--_g),var(--_g) calc(2*{size}px) calc(2*{size}px),
        repeating-conic-gradient(from {angle}deg,#0000 0 25%,{colorTwo} 0 50%) calc(-.707*{size}px) calc(-.707*{size}px),
        repeating-linear-gradient(calc({angle}deg + 90deg),{colorOne} calc({size}px/-2) calc({size}px/2),{colorTwo} 0 calc(2.328*{size}px))`,
      'background-size': 'calc(4*{size}px) calc(4*{size}px)',
    },
    variables: {
      size: size(34, 18, 70, 1),
      colorOne: {
        type: 'color',
        value: '#ECBE13',
      },
      colorTwo: {
        type: 'color',
        value: '#309292',
      },
      angle: {
        type: 'range',
        value: 45,
        min: 15,
        max: 75,
        step: 1,
      },
    },
  },

  'half_circles': {
    template: {
      background: `
        radial-gradient({rx}% {ry}% at 25% -50%,{colorOne} {fill}%,#0000)
          0 0/calc(2*{size}px) {size}px,
        radial-gradient({rx}% {ry}% at 75% 150%,{colorOne} {fill}%,#0000)
          0 0/calc(2*{size}px) {size}px,
        radial-gradient({ry}% {rx}% at 150% 25%,{colorOne} {fill}%,#0000)
          0 0/{size}px calc(2*{size}px),
        radial-gradient({ry}% {rx}% at -50% 75%,{colorOne} {fill}%,#0000)
          0 0/{size}px calc(2*{size}px),
        repeating-conic-gradient({colorOne} 0 {wedge}deg,{colorTwo} 0 25%)
          0 0/calc(2*{size}px) calc(2*{size}px)`,
    },
    variables: {
      size: size(71, 36, 140, 1),
      colorOne: {
        type: 'color',
        value: '#FCEBB6',
      },
      colorTwo: {
        type: 'color',
        value: '#78C0A8',
      },
      rx: {
        type: 'range',
        value: 36,
        min: 28,
        max: 45,
        step: 1,
      },
      ry: {
        type: 'range',
        value: 72,
        min: 58,
        max: 85,
        step: 1,
      },
      fill: {
        type: 'range',
        value: 98,
        min: 92,
        max: 99,
        step: 0.5,
      },
      wedge: {
        type: 'range',
        value: 45,
        min: 30,
        max: 60,
        step: 1,
      },
    },
  },

  'curved_segments': {
    template: {
      '--_c': '{colorOne} calc(100% - {size}px/2) 99%,#0000',
      '--_g': '{size}px,#0000 calc(99% - {size}px/2),var(--_c)',
      'background': `
        radial-gradient({size}px at 100% var(--_g)),
        radial-gradient(calc({size}px/4) at 50% calc(100%/{cellDiv}),var(--_c)) {size}px 0,
        radial-gradient({size}px at 0% var(--_g)) 0 calc(3*{size}px)
        {bgColor}`,
      'background-size': `
        calc(2*{size}px) calc(9*{size}px/4),
        calc(2*{size}px) calc(3*{size}px/4)`,
    },
    variables: {
      size: size(60, 30, 120, 2),
      colorOne: {
        type: 'color',
        value: '#7BB0A8',
      },
      bgColor: {
        type: 'color',
        value: '#A7DBAB',
        role: 'ground',
      },
      cellDiv: {
        type: 'range',
        value: 3,
        min: 2.4,
        max: 4,
        step: 0.1,
      },
    },
  },

  'waves': {
    template: {
      '--_s': '{ovalX}% {ovalY}% at {anchor}%',
      '--_g': '{edge}% 99%,#0000 101%',
      '--g1': 'radial-gradient(var(--_s) 100%,#0000 {cut}%,{colorOne} var(--_g))',
      '--g2': 'radial-gradient(var(--_s) 0,#0000 {cut}%,{colorOne} var(--_g))',
      '--g3': 'radial-gradient(var(--_s) 100%,#0000 {cut}%,{colorTwo} var(--_g))',
      '--g4': 'radial-gradient(var(--_s) 0,#0000 {cut}%,{colorTwo} var(--_g))',
      'background': `
        var(--g1),
        var(--g2) 0 calc(3*{size}px),
        var(--g3) {size}px calc(3*{size}px),
        var(--g4) {size}px calc(6*{size}px),
        var(--g1) calc(2*{size}px) calc(6*{size}px),
        var(--g2) calc(2*{size}px) calc(9*{size}px),
        var(--g3) calc(3*{size}px) calc(9*{size}px),
        var(--g4) calc(3*{size}px) 0,
        repeating-linear-gradient({colorOne} 0 25%,{colorTwo} 0 50%)`,
      'background-size': 'calc(4*{size}px) calc(12*{size}px)',
    },
    variables: {
      size: size(30, 16, 60, 2),
      colorOne: {
        type: 'color',
        value: '#E5FCC2',
      },
      colorTwo: {
        type: 'color',
        value: '#45ADA8',
      },
      ovalX: {
        type: 'range',
        value: 37.5,
        min: 28,
        max: 48,
        step: 0.5,
      },
      ovalY: {
        type: 'range',
        value: 12.5,
        min: 8,
        max: 18,
        step: 0.5,
      },
      anchor: {
        type: 'range',
        value: 62.5,
        min: 50,
        max: 75,
        step: 0.5,
      },
      cut: {
        type: 'range',
        value: 32,
        min: 24,
        max: 40,
        step: 1,
      },
      edge: {
        type: 'range',
        value: 34,
        min: 26,
        max: 42,
        step: 1,
      },
    },
  },

  'chevron_stripes': {
    template: {
      '--g': 'calc({size}px/{gapDiv})',
      '--_l': '#0000 calc(33% - .866*var(--g)),{figureColor} calc(33.2% - .866*var(--g)) 33%,#0000 34%',
      'background': `
        repeating-linear-gradient({figureColor} 0 var(--g), #0000 0 50%)
          0 calc(.866*{size}px - var(--g)/2),
        conic-gradient(from -150deg at var(--g) 50%,{figureColor} 120deg,#0000 0),
        linear-gradient(-120deg,var(--_l)),linear-gradient(-60deg,var(--_l))
        {bgColor}`,
      'background-size': '{size}px calc(3.466*{size}px)',
    },
    variables: {
      size: size(65, 32, 130, 1),
      figureColor: {
        type: 'color',
        value: '#ECD078',
      },
      bgColor: {
        type: 'color',
        value: '#0B486B',
        role: 'ground',
      },
      gapDiv: {
        type: 'range',
        value: 5,
        min: 3,
        max: 8,
        step: 0.5,
      },
    },
  },

  'wavy_bands': {
    harmony: 'ramp',
    template: {
      '--_g': '#0000, #0004 {soft}%,{colorDark} calc({soft}% + 1%) calc({soft}% + 1% + {band}%),{colorLight} calc({soft}% + 1% + {band}% + {gap}%) calc({soft}% + 1% + 2*{band}% + {gap}%),{colorDark} calc({soft}% + 1% + 2*{band}% + 2*{gap}%) calc({soft}% + 1% + 3*{band}% + 2*{gap}%),{colorLight} calc({soft}% + 1% + 3*{band}% + 3*{gap}%) calc({soft}% + 1% + 4*{band}% + 3*{gap}%),{colorDark} calc({soft}% + 1% + 4*{band}% + 4*{gap}%) calc({soft}% + 1% + 5*{band}% + 4*{gap}%),{colorLight} calc({soft}% + 1% + 5*{band}% + 5*{gap}%) calc({soft}% + 1% + 6*{band}% + 5*{gap}%),{colorDark} calc({soft}% + 1% + 6*{band}% + 6*{gap}%) calc({soft}% + 1% + 7*{band}% + 6*{gap}%),{colorLight} calc({soft}% + 1% + 7*{band}% + 7*{gap}%) calc({soft}% + 1% + 8*{band}% + 7*{gap}%),{colorDark} calc({soft}% + 1% + 8*{band}% + 8*{gap}%) calc({soft}% + 1% + 9*{band}% + 8*{gap}%),#0004 calc(100% - {soft}%),#0000',
      'background': `
        radial-gradient(100% 50% at 100% 0,var(--_g)),
        radial-gradient(100% 50% at 0 50%,var(--_g)),
        radial-gradient(100% 50% at 100% 100%,var(--_g))`,
      'background-size': '{size}px calc(2*{size}px)',
    },
    variables: {
      size: size(100, 50, 200, 5),
      colorDark: {
        type: 'color',
        value: '#3B8183',
      },
      colorLight: {
        type: 'color',
        value: '#E1F5C4',
      },
      soft: {
        type: 'range',
        value: 5,
        min: 2,
        max: 8,
        step: 0.5,
      },
      gap: {
        type: 'range',
        value: 2,
        min: 1,
        max: 4,
        step: 0.5,
      },
      band: {
        type: 'range',
        value: 8,
        min: 5,
        max: 12,
        step: 0.5,
      },
    },
  },

  'arrows': {
    template: {
      'background': `
        conic-gradient(#0000 {fillStop}%,{colorOne} 0) 0 calc({size}px/4),
        conic-gradient(from {angle}deg,{colorOne} 25%,{colorTwo} 0)`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(100, 50, 200, 5),
      colorOne: {
        type: 'color',
        value: '#CFF09E',
      },
      colorTwo: {
        type: 'color',
        value: '#3B8686',
      },
      fillStop: {
        type: 'range',
        value: 75,
        min: 60,
        max: 85,
        step: 0.5,
      },
      angle: {
        type: 'range',
        value: 45,
        min: 15,
        max: 75,
        step: 1,
      },
    },
  },

  'diagonal_chevrons': {
    template: {
      background: `
        conic-gradient({colorOne} {a}deg,{colorTwo} 0 {b}deg,{colorOne} 0 {c}deg,{colorTwo} 0)
        0/{size}px {size}px`,
    },
    variables: {
      size: size(100, 50, 200, 5),
      colorOne: {
        type: 'color',
        value: '#7A6A53',
      },
      colorTwo: {
        type: 'color',
        value: '#D9CEB2',
      },
      a: {
        type: 'range',
        value: 135,
        min: 110,
        max: 155,
        step: 1,
      },
      b: {
        type: 'range',
        value: 270,
        min: 240,
        max: 300,
        step: 1,
      },
      c: {
        type: 'range',
        value: 315,
        min: 290,
        max: 340,
        step: 1,
      },
    },
  },

  'irregular_zig_zag': {
    template: {
      '--c': '{figureColor} {fill}%',
      'background': `
        conic-gradient(from {fromA}deg at {tipX}% {tipY}%,var(--c),#0000 0),
        conic-gradient(from {fromB}deg at calc(100% - {tipX}%) calc(100% - {tipY}%),var(--c),#0000 0)
          0 calc({size}px/2),
        conic-gradient(from 180deg at 50% calc(100% - {mid}%),#0000 {cut}%,var(--c)),
        conic-gradient(at 50% {mid}%,#0000 {cut}%,var(--c))
          0 calc({size}px/2) {bgColor}`,
      'background-size': '{size}px calc(2*{size}px)',
    },
    variables: {
      size: size(66, 32, 130, 2),
      figureColor: {
        type: 'color',
        value: '#B38184',
      },
      bgColor: {
        type: 'color',
        value: '#413E4A',
        role: 'ground',
      },
      fill: {
        type: 'range',
        value: 25,
        min: 15,
        max: 35,
        step: 1,
      },
      fromA: {
        type: 'range',
        value: -45,
        min: -75,
        max: -15,
        step: 1,
      },
      fromB: {
        type: 'range',
        value: 135,
        min: 105,
        max: 165,
        step: 1,
      },
      tipX: {
        type: 'range',
        value: 75,
        min: 60,
        max: 88,
        step: 0.5,
      },
      tipY: {
        type: 'range',
        value: 12.5,
        min: 6,
        max: 20,
        step: 0.5,
      },
      mid: {
        type: 'range',
        value: 25,
        min: 18,
        max: 35,
        step: 1,
      },
      cut: {
        type: 'range',
        value: 62.5,
        min: 50,
        max: 75,
        step: 0.5,
      },
    },
  },

  'zig_zag_3d': {
    harmony: 'ramp',
    template: {
      '--g1': 'conic-gradient(at calc(250%/{cellDiv}) calc(50%/{cellDiv}),{colorMid} {wedge}deg,#0000 0 calc(360deg - {wedge}deg),{colorDark} 0)',
      '--g2': 'conic-gradient(at calc(50%/{cellDiv}) 50%,#0000 {fillStop}%,{colorDark} 0)',
      '--g3': 'conic-gradient(at calc(100%/{cellDiv}) 50%,#0000 {fillStop}%,{colorMid} 0)',
      '--g4': 'conic-gradient(from calc({wedge}deg - 1deg) at calc(200%/{cellDiv}) calc(249%/(3*{cellDiv})),{colorBase} calc({wedge}deg + 1deg),#0000 calc({wedge}deg + 2deg))',
      '--g5': 'conic-gradient(from {wedge}deg at 50% calc(250%/{cellDiv}),{colorLight} {wedge}deg,{colorDark} 0 calc(2*{wedge}deg),#0000 0)',
      '--_p': 'calc(9*tan(30deg)*{size}px)',
      'background': `
        var(--g1) calc(-1*{size}px) 0,var(--g1) calc(2*{size}px) var(--_p),
        var(--g2),var(--g2) calc(3*{size}px) var(--_p),
        var(--g3),var(--g3) calc(3*{size}px) var(--_p),
        var(--g4),var(--g4) calc(3*{size}px) var(--_p),
        var(--g5) calc(3*{size}px) 0,var(--g5) 0 var(--_p) {colorBase}`,
      'background-size': 'calc(6*{size}px) calc(2*var(--_p))',
    },
    variables: {
      size: size(36, 18, 72, 1),
      colorDark: {
        type: 'color',
        value: '#000000',
      },
      colorMid: {
        type: 'color',
        value: '#d2d3d5',
      },
      colorBase: {
        type: 'color',
        value: '#727c7e',
      },
      colorLight: {
        type: 'color',
        value: '#f1f1f1',
      },
      cellDiv: {
        type: 'range',
        value: 3,
        min: 2.4,
        max: 4,
        step: 0.1,
      },
      wedge: {
        type: 'range',
        value: 60,
        min: 45,
        max: 75,
        step: 1,
      },
      fillStop: {
        type: 'range',
        value: 75,
        min: 65,
        max: 85,
        step: 0.5,
      },
    },
  },

  'outline_circles': {
    template: {
      '--_g': 'radial-gradient(#0000 {ringA}%,{figureColor} calc({ringA}% + {gap}%) calc({ringA}% + {gap}% + {stroke}%),#0000 calc({ringA}% + 2*{gap}% + {stroke}%) {ringB}%,{figureColor} calc({ringB}% + {gap}%) calc({ringB}% + {gap}% + {stroke}%),#0000 calc({ringB}% + 2*{gap}% + {stroke}%))',
      '--_c': ',#0000 {fillStop}%,{bgColor} 0',
      'background': `
        conic-gradient(at {armA}% {armB}% var(--_c)) calc({size}px * .44) calc(.9*{size}px),
        conic-gradient(at {armA}% {armB}% var(--_c)) calc({size}px * -.06) calc(.4*{size}px),
        conic-gradient(at {armB}% {armA}% var(--_c)) calc(.9*{size}px) calc({size}px * .44),
        conic-gradient(at {armB}% {armA}% var(--_c)) calc(.4*{size}px) calc({size}px * -.06),
        var(--_g),var(--_g) calc({size}px/2) calc({size}px/2) {bgColor}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(220, 100, 320, 5),
      figureColor: {
        type: 'color',
        value: '#774F38',
      },
      bgColor: {
        type: 'color',
        value: '#F1D4AF',
        role: 'ground',
      },
      ringA: {
        type: 'range',
        value: 60,
        min: 50,
        max: 68,
        step: 1,
      },
      ringB: {
        type: 'range',
        value: 77,
        min: 70,
        max: 85,
        step: 1,
      },
      gap: {
        type: 'range',
        value: 1,
        min: 0.5,
        max: 2.5,
        step: 0.5,
      },
      stroke: {
        type: 'range',
        value: 2,
        min: 1,
        max: 4,
        step: 0.5,
      },
      fillStop: {
        type: 'range',
        value: 75,
        min: 65,
        max: 85,
        step: 0.5,
      },
      armA: {
        type: 'range',
        value: 12,
        min: 8,
        max: 18,
        step: 0.5,
      },
      armB: {
        type: 'range',
        value: 20,
        min: 14,
        max: 28,
        step: 0.5,
      },
    },
  },

  'zig_zag_rectangles': {
    template: {
      '--g': '{colorTwo} {band}%,{colorOne} 0 calc(3*{band}%),{colorTwo} 0 calc(5*{band}%),{colorOne} 0 calc(7*{band}%),{colorTwo} 0 calc(9*{band}%),#0000 0',
      'background': `
        linear-gradient(225deg,#0000 {band}%,{colorOne} 0 calc(3*{band}%),#0000 0 calc(25*{band}%),{colorOne} 0 calc(27*{band}%),#0000 0)
          0 calc({size}px/2),
        linear-gradient(45deg,var(--g)) 0 {size}px,
        linear-gradient(45deg,var(--g)) calc({size}px/-2) calc({size}px/-2),
        linear-gradient(225deg,var(--g)) {size}px 0,
        linear-gradient(225deg,var(--g)) calc({size}px/2) {size}px,
        repeating-linear-gradient(-45deg,{colorTwo} calc(-1 * {band}%) {band}%,{colorOne} 0 calc(3*{band}%))`,
      'background-size': 'calc(2*{size}px) calc(2*{size}px)',
    },
    variables: {
      size: size(100, 50, 200, 5),
      colorOne: {
        type: 'color',
        value: '#987F69',
      },
      colorTwo: {
        type: 'color',
        value: '#FDF1CC',
        role: 'ground',
      },
      band: {
        type: 'range',
        value: 3.125,
        min: 2,
        max: 5,
        step: 0.125,
      },
    },
  },

  'right_triangles': {
    template: {
      '--_g': ',#0000 {fillStop}%,{figureColor} 0',
      'background': `
        linear-gradient(-45deg var(--_g)),
        linear-gradient(45deg var(--_g))
          0 calc({size}px/2) {bgColor}`,
      'background-size': '{size}px {size}px',
    },
    variables: {
      size: size(70, 35, 140, 5),
      figureColor: {
        type: 'color',
        value: '#F67280',
      },
      bgColor: {
        type: 'color',
        value: '#355C7D',
        role: 'ground',
      },
      fillStop: {
        type: 'range',
        value: 75,
        min: 60,
        max: 85,
        step: 0.5,
      },
    },
  },

  'optical_illusion': {
    template: {
      background: `
        radial-gradient({rx}% {ry}%,{colorOne} {fill}%,#0000)
          {size}px 0/calc(2*{size}px) {size}px,
        radial-gradient({rx}% {ry}%,{colorTwo} {fill}%,#0000)
          0 0/calc(2*{size}px) {size}px,
        repeating-conic-gradient({colorOne} 0 25%,{colorTwo} 0 50%)
          0 0/calc(2*{size}px) calc(2*{size}px)`,
    },
    variables: {
      size: size(50, 24, 100, 2),
      colorOne: {
        type: 'color',
        value: '#5E412F',
      },
      colorTwo: {
        type: 'color',
        value: '#FCEBB6',
      },
      rx: {
        type: 'range',
        value: 25,
        min: 18,
        max: 35,
        step: 1,
      },
      ry: {
        type: 'range',
        value: 50,
        min: 35,
        max: 65,
        step: 1,
      },
      fill: {
        type: 'range',
        value: 98,
        min: 92,
        max: 99,
        step: 0.5,
      },
    },
  },

  'triangle_tiles': {
    template: {
      background: `
        repeating-conic-gradient({colorOne} 0 {wedge}deg,{colorTwo} 0 calc(2*{wedge}deg))
        0/{size}px {size}px`,
    },
    variables: {
      size: size(100, 50, 200, 5),
      colorOne: {
        type: 'color',
        value: '#F2E9E1',
      },
      colorTwo: {
        type: 'color',
        value: '#99B2B7',
      },
      wedge: {
        type: 'range',
        value: 45,
        min: 30,
        max: 60,
        step: 1,
      },
    },
  },

  'thick_wavy': {
    template: {
      '--_g': `calc(2*{size}px) calc(2*{size}px)
        radial-gradient({petal}% {petal}%,{colorOne} 99%,#0000 101%)`,
      'background': `
        0 {size}px/var(--_g),{size}px 0/var(--_g),
        radial-gradient(50% 50%,{colorTwo} {fill}%,#0000)
          calc({size}px/2) calc({size}px/2)/{size}px {size}px,
        linear-gradient(90deg,{colorOne} 50%,{colorTwo} 0)
          0 0/calc(2*{size}px)`,
    },
    variables: {
      size: size(50, 24, 100, 2),
      colorOne: {
        type: 'color',
        value: '#D9CEB2',
      },
      colorTwo: {
        type: 'color',
        value: '#948C75',
      },
      petal: {
        type: 'range',
        value: 25,
        min: 18,
        max: 35,
        step: 1,
      },
      fill: {
        type: 'range',
        value: 97,
        min: 90,
        max: 99,
        step: 0.5,
      },
    },
  },

  'two_color_circles': {
    template: {
      background: `
        radial-gradient(#0000 {inner}%,{colorOne} calc({inner}% + {gap}%) calc({inner}% + {gap}% + {ring}%),{colorTwo} calc({inner}% + 2*{gap}% + {ring}%))
        0 0/{size}px {size}px,
        repeating-linear-gradient({angle}deg,{colorOne} 0 25%,{colorTwo} 0 50%)
        0 0/calc(2*{size}px) calc(2*{size}px)`,
    },
    variables: {
      size: size(100, 50, 200, 5),
      colorOne: {
        type: 'color',
        value: '#5A3D31',
      },
      colorTwo: {
        type: 'color',
        value: '#E5EDB8',
      },
      inner: {
        type: 'range',
        value: 50,
        min: 40,
        max: 60,
        step: 1,
      },
      gap: {
        type: 'range',
        value: 2,
        min: 1,
        max: 4,
        step: 0.5,
      },
      ring: {
        type: 'range',
        value: 3,
        min: 1,
        max: 6,
        step: 0.5,
      },
      angle: {
        type: 'range',
        value: 45,
        min: 15,
        max: 75,
        step: 1,
      },
    },
  },

  'folded_zig_zag': {
    template: {
      '--a': 'from {from}deg at',
      'background': `
        linear-gradient(#0000 50%,#0004 0),
        conic-gradient(var(--a) {posA}%,{colorLight} {wedge}deg,#0000 0),
        conic-gradient(var(--a) {posB}%,{colorMid} {wedge}deg,#0000 0),
        conic-gradient(var(--a) {posC}%,#0000 {wedge}deg,{colorLight} 0),
        conic-gradient(var(--a) {posD}%,{colorLight} {wedge}deg,{colorDark} 0)`,
      'background-size': 'calc(1.5*{size}px) {size}px',
    },
    variables: {
      size: size(84, 42, 160, 2),
      colorLight: {
        type: 'color',
        value: '#ffffff',
      },
      colorMid: {
        type: 'color',
        value: '#71e9a0',
      },
      colorDark: {
        type: 'color',
        value: '#2a6a9b',
      },
      from: {
        type: 'range',
        value: -30,
        min: -50,
        max: -10,
        step: 1,
      },
      wedge: {
        type: 'range',
        value: 240,
        min: 200,
        max: 280,
        step: 1,
      },
      posA: {
        type: 'range',
        value: 90,
        min: 80,
        max: 95,
        step: 1,
      },
      posB: {
        type: 'range',
        value: 75,
        min: 65,
        max: 85,
        step: 1,
      },
      posC: {
        type: 'range',
        value: 25,
        min: 15,
        max: 35,
        step: 1,
      },
      posD: {
        type: 'range',
        value: 40,
        min: 30,
        max: 50,
        step: 1,
      },
    },
  },
}
export default templates
