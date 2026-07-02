export const colors = {
  bg: {
    app:     '#F5F0E8',
    sidebar: '#EDE7D9',
    card:    '#FFFFFF',
    inset:   '#EDE7D9',
    active:  '#DEEADE',
  },
  border: {
    def:  '#D4CDBF',
    card: '#D8D2C6',
    str:  '#C4D9C4',
  },
  text: {
    pri:        '#1C1C18',
    sec:        '#6A6661',
    mut:        '#8B837C',
    decorative: '#A89F96',
  },
  brand: {
    dark:  '#245224',
    base:  '#2D6A2D',
    light: '#DEEADE',
  },
} as const;

export const fonts = {
  heading: "'Literata', Georgia, serif",
  body:    "'Instrument Sans Variable', system-ui, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
} as const;

export const fontSizes = {
  xs:   '10px',
  sm:   '11px',
  base: '14px',
  md:   '16px',
  lg:   '20px',
  xl:   '24px',
  '2xl': '32px',
} as const;

export const spacing = {
   1:  '4px',
   2:  '8px',
   3:  '12px',
   4:  '16px',
   5:  '20px',
   6:  '24px',
   8:  '32px',
  10:  '40px',
  12:  '48px',
  16:  '64px',
  20:  '80px',
} as const;

export const radii = {
  sm:   '4px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  pill: '999px',
} as const;
