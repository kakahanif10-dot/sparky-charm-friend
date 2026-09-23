// SUPERINTELLIGENS — Universal Context-Aware UI/UX design model.
// A single generation returns an industry-aware spec: the AI detects the
// industry from the prompt, picks a functional multi-page `template`, and
// emits a matching hex `palette` + an industry-specific `catalog`.

export type Template =
  | 'government'
  | 'fintech'
  | 'edutech'
  | 'food'
  | 'ecommerce'
  | 'health'
  | 'saas'
  | 'game'
  | 'generic'

// Which playable arcade game the preview should boot into when template==='game'.
export type GameKind = 'snake' | 'tetris' | 'dino' | 'pong' | 'breakout' | 'flappy' | '2048' | 'memory'

export type Palette = {
  bg: string
  surface: string
  border: string
  text: string
  muted: string
  accent: string
  accentText: string
}

// One row in the industry catalog: a menu item, a product, or a public service.
export type CatalogItem = {
  name: string
  price: number // currency amount (0 = free / not priced)
  meta: string // category, subtitle or short descriptor
}

export type DesignSpec = {
  appName: string
  industry: string // human label of the detected industry, e.g. "Government / Tax"
  template: Template // drives which interactive multi-page UI renders
  palette: Palette // industry-appropriate colors (hex)
  currency: string // symbol prefixing prices, e.g. "Rp", "$"
  tagline: string
  description: string
  primaryAction: string
  categories: string[] // filter chips / quick sections (up to 5)
  catalog: CatalogItem[] // menu items / products / services (up to 6)
  game?: GameKind // when template==='game', which arcade game boots first
  hasContent: boolean // false = neutral "awaiting blueprint" state
}

// Strong, industry-appropriate palette defaults per template. The AI may
// override individual hex values; anything invalid falls back to these so the
// preview is always coherent for the detected industry.
export const TEMPLATE_PALETTES: Record<Template, Palette> = {
  // Institutional civic authority: deep navy + slate silver + alert amber.
  // Production tokens: #0A192F navy, #8892B0 slate, #FF6B00 transaction accent.
  government: {
    bg: '#0A192F',
    surface: '#112240',
    border: 'rgba(136,146,176,0.22)',
    text: '#E6F1FF',
    muted: '#8892B0',
    accent: '#FF6B00',
    accentText: '#0A192F',
  },
  // Fintech trust + growth: near-black vault + emerald money accent.
  fintech: {
    bg: '#06120f',
    surface: '#0d2320',
    border: 'rgba(45,212,191,0.18)',
    text: '#e9fbf4',
    muted: '#86a89a',
    accent: '#10b981',
    accentText: '#04140b',
  },
  // EduTech: friendly, focused deep blue with a bright academic accent.
  edutech: {
    bg: '#0b1226',
    surface: '#16203f',
    border: 'rgba(96,165,250,0.20)',
    text: '#eaf1ff',
    muted: '#93a7c4',
    accent: '#3b82f6',
    accentText: '#ffffff',
  },
  // Warm earth tones: espresso, cream, forest green.
  food: {
    bg: '#1b130d',
    surface: '#291d14',
    border: 'rgba(206,170,124,0.22)',
    text: '#f4e9dd',
    muted: '#c2a988',
    accent: '#3f9c5f',
    accentText: '#04140b',
  },
  // Bright commercial flagship (Shopee/Amazon-like): clean ivory canvas,
  // pearl-white product cards, high-vis orange conversion accent (#EE4D2D).
  ecommerce: {
    bg: '#F5F5F5',
    surface: '#FFFFFF',
    border: 'rgba(17,24,39,0.10)',
    text: '#17181C',
    muted: '#6B7280',
    accent: '#EE4D2D',
    accentText: '#FFFFFF',
  },
  // Clinical trust: deep teal, clean surfaces, healing teal-green accent.
  health: {
    bg: '#06171a',
    surface: '#0f2b2e',
    border: 'rgba(94,234,212,0.18)',
    text: '#e6fbf7',
    muted: '#8fb9b4',
    accent: '#14b8a6',
    accentText: '#03130f',
  },
  // Modern software: sleek near-black, violet product accent.
  saas: {
    bg: '#0b0b16',
    surface: '#16162a',
    border: 'rgba(139,124,246,0.18)',
    text: '#f2f1fb',
    muted: '#a5a3c4',
    accent: '#8b5cf6',
    accentText: '#ffffff',
  },
  // Retro arcade: black cabinet, neon-green phosphor glow.
  game: {
    bg: '#07060f',
    surface: '#12101f',
    border: 'rgba(74,222,128,0.22)',
    text: '#e8ffe8',
    muted: '#7c9a86',
    accent: '#4ade80',
    accentText: '#04140b',
  },
  // Neutral fallback for anything else.
  generic: {
    bg: '#0a0a0a',
    surface: '#171717',
    border: 'rgba(255,255,255,0.10)',
    text: '#fafafa',
    muted: '#a3a3a3',
    accent: '#6366f1',
    accentText: '#ffffff',
  },
}

export const TEMPLATES: readonly Template[] = [
  'government',
  'fintech',
  'edutech',
  'food',
  'ecommerce',
  'health',
  'saas',
  'game',
  'generic',
] as const

export const TEMPLATE_LABELS: Record<Template, string> = {
  government: 'Government / Public Service',
  fintech: 'Fintech / Banking',
  edutech: 'EduTech / Learning',
  food: 'Food & Beverage',
  ecommerce: 'E-Commerce / Marketplace',
  health: 'Health / Medical',
  saas: 'SaaS / Productivity',
  game: 'Arcade / Game',
  generic: 'Universal App',
}

export const DEFAULT_SPEC: DesignSpec = {
  appName: 'SUPERINTELLIGENS',
  industry: '',
  template: 'generic',
  palette: TEMPLATE_PALETTES.generic,
  currency: '$',
  tagline: '',
  description: '',
  primaryAction: '',
  categories: [],
  catalog: [],
  hasContent: false,
}
