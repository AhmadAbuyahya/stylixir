export const overlayTypes = {
  'none': {
    type: 'none',
    preview: 'none',
  },
  'opacity': {
    type: 'opacity',
    preview: '#00000050',
  },
  'linear-gradient-top': {
    type: 'linear',
    direction: 'to top',
    preview: 'linear-gradient(to top, transparent, black)',
  },
  'linear-gradient-right': {
    type: 'linear',
    direction: 'to right',
    preview: 'linear-gradient(to right, transparent, black)',
  },
  'linear-gradient-bottom': {
    type: 'linear',
    direction: 'to bottom',
    preview: 'linear-gradient(to bottom, transparent, black)',
  },
  'linear-gradient-left': {
    type: 'linear',
    direction: 'to left',
    preview: 'linear-gradient(to left, transparent, black)',
  },
  'radial-gradient-center': {
    type: 'radial',
    position: 'circle',
    start: 'transparent',
    end: 'color',
    preview: 'radial-gradient(circle, transparent, black)',
  },
  'radial-gradient-center-out': {
    type: 'radial',
    position: 'circle',
    start: 'color',
    end: 'transparent',
    preview: 'radial-gradient(circle, black, transparent)',
  },
  'linear-gradient-inner': {
    type: 'inner',
    direction: 'to left',
    preview: 'linear-gradient(to left, black, transparent, black)',
  },
  'linear-gradient-outer': {
    type: 'outer',
    direction: 'to left',
    preview: 'linear-gradient(to left, transparent, black, transparent)',
  },

}
