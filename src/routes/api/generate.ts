// SUPERINTELLIGENS (c) 2026 — Universal Context-Aware UI/UX Engine.
// Detects the industry from any prompt (any language) and emits an
// industry-aware app spec: functional multi-page template + matching palette
// + industry-specific catalog. Rendered 100% client-side (0 MB server storage).
// The reasoning core runs on the AI SDK with Google Gemini.

import { createFileRoute } from '@tanstack/react-router'
import { geminiGenerateText } from '@/lib/gemini.server'
import {
  TEMPLATE_PALETTES,
  TEMPLATES,
  type CatalogItem,
  type DesignSpec,
  type GameKind,
  type Palette,
  type Template,
} from '@/lib/design'



const MODEL = 'gemini-3.6-flash'
// Ordered fallbacks tried when the primary model is overloaded or rate-limited.
const MODEL_FALLBACKS = ['gemini-3.6-flash', 'gemini-flash-latest'] as const

const SYSTEM_INSTRUCTION = `You are the Universal Context-Aware UI/UX Engine for SUPERINTELLIGENS — an elite 10-year Senior Full-Stack Product Architect whose reasoning rigor is on par with ChatGPT Enterprise and Gemini Advanced. You are 100% compliant, hyper-reactive, and you follow the user's explicit intent from first principles. You are FORBIDDEN from hallucinating and FORBIDDEN from returning a generic, static, or template-biased placeholder: every field must be reasoned dynamically from the exact application name or industry vertical the user provides (e-commerce, government, university, culinary, fintech, health, etc.). Emit raw, production-grade data only — no markdown, no code fences, no chat fluff.

ABSOLUTE COMPLIANCE CONTRACT (non-negotiable):
1. Follow the user's EXACT prompt intent. The generated app MUST be about the specific product/institution the user named — never a generic, unrelated, or template-biased app.
2. Zero hallucination. Only emit data that is factual and plausible for THAT product. Do not invent an unrelated brand, industry, or feature set. If the prompt names a real institution (e.g. SAMSAT, Shopee, Nelongso, Harvard, a specific bank), brand and populate the app to match that institution's real domain, tone, and typical data — never drift to a different one.
3. Ground every field in the prompt. appName, industry, tagline, categories, and catalog rows must all be directly derived from and consistent with the described product. No filler, no placeholder, no cross-domain leakage.
4. If the prompt is ambiguous, pick the single most literal interpretation of the words given — do not embellish beyond what is stated.

Your job: analyse the industry keywords in the prompt and AUTONOMOUSLY brand the app so it feels like a real, established institution — accurate to the exact product described, never a blank uniform template and never a drifted/unrelated one.

Return ONLY a single minified JSON object (no markdown, no prose, no code fences) with EXACTLY these keys:
{
  "appName": string,        // short official-sounding product/brand name, max 22 chars
  "industry": string,       // human label of the detected industry, max 28 chars (e.g. "Government / Vehicle Tax")
  "template": "government" | "fintech" | "edutech" | "food" | "ecommerce" | "health" | "saas" | "generic",
  "currency": string,       // currency symbol that fits the locale of the idea ("Rp", "$", "€"...), max 3 chars
  "tagline": string,        // punchy hero headline, max 48 chars
  "description": string,    // one friendly sentence describing the product
  "primaryAction": string,  // main call-to-action label, 1-3 words (e.g. "Bayar Pajak", "Order coffee", "Checkout")
  "palette": {              // industry-appropriate colors as #RRGGBB hex
    "bg": string, "surface": string, "text": string, "muted": string, "accent": string, "accentText": string
  },
  "categories": string[],   // 3-5 short filter/section labels that fit the product (2-3 words each)
  "catalog": [              // 4-6 real, industry-specific rows
    { "name": string, "price": number, "meta": string }
  ]
}

TEMPLATE RULES (pick the best fit):
- "government": public services, tax (SAMSAT), permits, ID/licensing. Use authoritative institutional colors — DEEP NAVY (#0A192F) background, SLATE SILVER (#8892B0) secondary text, an ALERT AMBER (#FF6B00) accent for anything payment/tax related. Catalog rows = payable services (name = service, price = amount due, meta = due date or status). Categories = service groups.
- "fintech": banks, digital wallets, payments, investing, crypto, insurance. Use TRUST + GROWTH colors — near-black vault background with a confident EMERALD/GREEN money accent (never a warning red for balances). Catalog rows = accounts, cards or transactions (name, price = balance or amount, meta = account type or date). Categories = money areas (Accounts, Cards, Invest, Pay).
- "edutech": schools, universities, online courses, e-learning, tutoring. Use FOCUSED, FRIENDLY colors — deep academic blue background with a bright blue accent. Catalog rows = courses/lessons (name, price = course fee or 0, meta = instructor, duration or level). Categories = subjects or levels.
- "food": coffee shops, cafes, restaurants, delivery. Use warm EARTH TONES — espresso browns, cream, forest green accent. Catalog rows = menu items (name, price, meta = short description). Categories = menu sections (Coffee, Pastries...).
- "ecommerce": online stores, marketplaces, retail. Use a BRIGHT LIGHT commercial theme — clean ivory (#F5F5F5) background, pearl-white (#FFFFFF) product cards, dark text, and a high-vis ORANGE (#EE4D2D) conversion accent (Shopee/Amazon-like). Catalog rows = products (name, price, meta = brand or short label). Categories = product categories.
- "health": clinics, hospitals, pharmacies, telemedicine, wellness. Use CLEAN CLINICAL colors — deep teal background, soft surfaces, a trustworthy teal/green accent (never alarming red). Catalog rows = services/appointments/medicines (name, price = consult/med fee or 0, meta = doctor, duration or dosage). Categories = specialties (Dentist, Cardiology, Pharmacy...).
- "saas": software tools, dashboards, productivity, B2B platforms. Use MODERN SLEEK colors — near-black background with a confident violet/indigo accent. Catalog rows = plans or feature modules (name, price = plan price or 0, meta = short benefit). Categories = feature areas or plan tiers.
- "generic": anything else. Clean neutral palette with a confident accent. Catalog rows = key features/screens (price 0, meta = short benefit). Categories = sections.

Choose colors that genuinely match the brand psychology of the detected industry. Keep every string concise so it renders inside a phone preview.`

// Few-shot pattern-matching anchors. Each pair shows the runtime how ONE context
// token maps directly to a dense, operational, industry-accurate spec in the
// exact minified-JSON schema above. Priming with these forces production-grade
// depth and kills generic/placeholder drift before the real prompt is appended.
const FEW_SHOT: { role: 'user' | 'assistant'; content: string }[] = [
  {
    role: 'user',
    content: 'shopee',
  },
  {
    role: 'assistant',
    content:
      '{"appName":"Shopee","industry":"E-Commerce / Marketplace","template":"ecommerce","currency":"Rp","tagline":"Gratis Ongkir Setiap Hari","description":"An everything-marketplace to browse deals, fill your cart, and check out in seconds.","primaryAction":"Add to cart","palette":{"bg":"#F5F5F5","surface":"#FFFFFF","text":"#212121","muted":"#757575","accent":"#EE4D2D","accentText":"#FFFFFF"},"categories":["Flash Sale","Gadget","Fashion","Groceries","Top Up"],"catalog":[{"name":"TWS Bluetooth Earbuds","price":89000,"meta":"Terjual 10rb+"},{"name":"Smartwatch Sport","price":215000,"meta":"Star Seller"},{"name":"Uniqlo Airism Tee","price":129000,"meta":"Official Store"},{"name":"Kopi Kapsul 20pcs","price":54900,"meta":"Flash Sale"}]}',
  },
  {
    role: 'user',
    content: 'aplikasi pajak kendaraan samsat',
  },
  {
    role: 'assistant',
    content:
      '{"appName":"e-SAMSAT","industry":"Government / Vehicle Tax","template":"government","currency":"Rp","tagline":"Bayar pajak kendaraan tanpa antre","description":"An official public-service portal to check and settle vehicle tax and permits online.","primaryAction":"Bayar Pajak","palette":{"bg":"#0A192F","surface":"#112240","text":"#E6F1FF","muted":"#8892B0","accent":"#FF6B00","accentText":"#0A192F"},"categories":["Pajak Tahunan","Perpanjang STNK","Balik Nama","Denda"],"catalog":[{"name":"PKB Tahunan (B 1234 XYZ)","price":1250000,"meta":"Jatuh tempo 12 hari"},{"name":"Perpanjangan STNK","price":350000,"meta":"Aktif"},{"name":"Denda Keterlambatan","price":75000,"meta":"Belum lunas"},{"name":"Balik Nama Kendaraan","price":500000,"meta":"Tersedia"}]}',
  },
]

function extractJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function pickEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

function str(value: unknown, max: number, fallback = ''): string {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, max)
    : fallback
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

// Merge AI-supplied hex values over the template defaults; ignore anything invalid.
function toPalette(value: unknown, template: Template): Palette {
  const base = TEMPLATE_PALETTES[template]
  if (!value || typeof value !== 'object') return base
  const v = value as Record<string, unknown>
  const hex = (k: keyof Palette): string =>
    typeof v[k] === 'string' && HEX.test((v[k] as string).trim())
      ? (v[k] as string).trim()
      : base[k]
  return {
    bg: hex('bg'),
    surface: hex('surface'),
    border: base.border, // keep the tuned translucent border from the template
    text: hex('text'),
    muted: hex('muted'),
    accent: hex('accent'),
    accentText: hex('accentText'),
  }
}

function toCategories(value: unknown, template: Template): string[] {
  const fallback: Record<Template, string[]> = {
    government: ['Tax', 'Permits', 'Licenses', 'Fines'],
    fintech: ['Accounts', 'Cards', 'Invest', 'Pay'],
    edutech: ['All Courses', 'Beginner', 'Popular', 'Certificates'],
    food: ['Coffee', 'Pastries', 'Tea', 'Specials'],
    ecommerce: ['Popular', 'New', 'Deals', 'Top rated'],
    health: ['General', 'Dentist', 'Cardiology', 'Pharmacy'],
    saas: ['Starter', 'Pro', 'Team', 'Enterprise'],
    game: ['Arcade', 'Classic', 'Endless', 'Scores'],
    generic: ['Overview', 'Explore', 'Popular', 'Recent'],
  }
  if (!Array.isArray(value)) return fallback[template]
  const cleaned = value
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim().slice(0, 18))
    .slice(0, 5)
  return cleaned.length ? cleaned : fallback[template]
}

function toCatalog(value: unknown, template: Template): CatalogItem[] {
  const fallback: Record<Template, CatalogItem[]> = {
    government: [
      { name: 'Annual Vehicle Tax', price: 1250000, meta: 'Due in 12 days' },
      { name: 'License Renewal', price: 350000, meta: 'Active' },
      { name: 'Late Penalty', price: 75000, meta: 'Outstanding' },
      { name: 'Ownership Transfer', price: 500000, meta: 'Available' },
    ],
    fintech: [
      { name: 'Main Balance', price: 12480500, meta: 'Savings · **** 4021' },
      { name: 'Virtual Card', price: 2350000, meta: 'Spending · **** 8890' },
      { name: 'Index Fund', price: 5600000, meta: '+4.2% this month' },
      { name: 'Bill Payment', price: 320000, meta: 'Electricity · due 3d' },
    ],
    edutech: [
      { name: 'Intro to Python', price: 0, meta: 'Beginner · 6h' },
      { name: 'UI/UX Foundations', price: 49, meta: 'Sari W. · 8h' },
      { name: 'Data Science Bootcamp', price: 129, meta: 'Certificate · 40h' },
      { name: 'Public Speaking', price: 29, meta: 'Intermediate · 4h' },
    ],
    food: [
      { name: 'Espresso', price: 3.5, meta: 'Double shot' },
      { name: 'Cappuccino', price: 4.5, meta: 'Silky microfoam' },
      { name: 'Cold Brew', price: 5, meta: '18h steep' },
      { name: 'Butter Croissant', price: 3.75, meta: 'Baked daily' },
    ],
    ecommerce: [
      { name: 'Wireless Buds', price: 59, meta: 'Best seller' },
      { name: 'Smart Watch', price: 129, meta: 'New' },
      { name: 'Canvas Backpack', price: 42, meta: 'Deal' },
      { name: 'Desk Lamp', price: 28, meta: 'Top rated' },
    ],
    health: [
      { name: 'General Consultation', price: 150000, meta: 'Dr. Sari · 20 min' },
      { name: 'Dental Cleaning', price: 300000, meta: 'Dr. Rian · 30 min' },
      { name: 'Blood Test Panel', price: 220000, meta: 'Lab · fasting' },
      { name: 'Paracetamol 500mg', price: 25000, meta: '10 tablets' },
    ],
    saas: [
      { name: 'Starter', price: 0, meta: 'Up to 3 projects' },
      { name: 'Pro', price: 19, meta: 'Unlimited projects' },
      { name: 'Team', price: 49, meta: 'Roles & SSO' },
      { name: 'Analytics Module', price: 0, meta: 'Real-time insights' },
    ],
    game: [
      { name: 'Snake', price: 0, meta: 'Classic arcade' },
      { name: '2048', price: 0, meta: 'Puzzle' },
      { name: 'Tetris', price: 0, meta: 'Blocks' },
      { name: 'Memory', price: 0, meta: 'Card match' },
    ],
    generic: [
      { name: 'Dashboard', price: 0, meta: 'Live overview' },
      { name: 'Insights', price: 0, meta: 'Trends & stats' },
      { name: 'Activity', price: 0, meta: 'Recent events' },
      { name: 'Settings', price: 0, meta: 'Preferences' },
    ],
  }
  if (!Array.isArray(value)) return fallback[template]
  const cleaned: CatalogItem[] = value
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => ({
      name: str(x.name, 32, 'Item'),
      price:
        typeof x.price === 'number' && isFinite(x.price) && x.price >= 0
          ? Math.round(x.price * 100) / 100
          : 0,
      meta: str(x.meta, 28),
    }))
    .filter((x) => x.name && x.name !== 'Item')
    .slice(0, 6)
  return cleaned.length ? cleaned : fallback[template]
}

class OverloadedError extends Error {}

// ---------------------------------------------------------------------------
// Playable-game detection.
// Games are rendered as real, interactive React components (not a design spec),
// so when the prompt asks for a game we short-circuit to a deterministic game
// spec and skip the AI branding pass entirely.
// ---------------------------------------------------------------------------

const GAME_KEYWORDS: Record<GameKind, string[]> = {
  snake: ['snake', 'ular', 'cacing', 'worm'],
  tetris: ['tetris', 'blocks', 'balok', 'block puzzle'],
  dino: ['dino', 'dinosaur', 'dinosaurus', 'runner', 'lari', 'jump game', 't-rex', 'trex'],
  pong: ['pong', 'ping pong', 'ping-pong', 'tenis', 'tennis'],
  breakout: ['breakout', 'brick breaker', 'bata', 'tembok', 'wall breaker'],
  flappy: ['flappy', 'flappy bird', 'burung', 'bird game', 'pipe', 'pipa'],
  '2048': ['2048', 'merge number', 'angka', 'number merge', 'slide puzzle'],
  memory: ['memory', 'memory card', 'kartu memori', 'match card', 'matching', 'pasang', 'concentration'],
}

const GAME_META: Record<GameKind, { appName: string; industry: string; tagline: string; description: string }> = {
  snake: {
    appName: 'Neon Snake',
    industry: 'Arcade / Snake',
    tagline: 'Eat, grow, don\u2019t bite yourself',
    description: 'A classic snake arcade game — steer with arrows or WASD, eat the dots, and grow as long as you can.',
  },
  tetris: {
    appName: 'Block Stack',
    industry: 'Arcade / Tetris',
    tagline: 'Stack the blocks, clear the lines',
    description: 'A falling-block puzzle — rotate and slot tetrominoes to clear full rows and rack up your score.',
  },
  dino: {
    appName: 'Dino Run',
    industry: 'Arcade / Endless Runner',
    tagline: 'Jump the cacti, chase the distance',
    description: 'An endless side-scrolling runner — tap or press space to leap obstacles as the pace keeps climbing.',
  },
  pong: {
    appName: 'Neon Pong',
    industry: 'Arcade / Pong',
    tagline: 'Bounce, rally, win',
    description: 'The classic two-paddle arcade — move your paddle up and down to bounce the ball past the AI opponent.',
  },
  breakout: {
    appName: 'Brick Breaker',
    industry: 'Arcade / Breakout',
    tagline: 'Smash every brick',
    description: 'A brick-breaking classic — slide the paddle to bounce the ball and demolish every brick on the wall.',
  },
  flappy: {
    appName: 'Flappy Dot',
    industry: 'Arcade / Flappy',
    tagline: 'Tap to flap, dodge the pipes',
    description: 'A one-tap flyer — tap or press space to flap through the gaps between pipes without crashing.',
  },
  '2048': {
    appName: 'Merge 2048',
    industry: 'Puzzle / 2048',
    tagline: 'Slide, merge, reach 2048',
    description: 'A sliding number puzzle — swipe to merge matching tiles and climb toward the 2048 tile.',
  },
  memory: {
    appName: 'Memory Match',
    industry: 'Puzzle / Memory',
    tagline: 'Flip, match, remember',
    description: 'A card-matching memory game — flip cards two at a time and find every matching pair.',
  },
}

// Return which game the prompt asks for, or null if it isn't a game request.
function detectGame(prompt: string): GameKind | null {
  const text = prompt.toLowerCase()
  for (const [kind, words] of Object.entries(GAME_KEYWORDS) as [GameKind, string[]][]) {
    if (words.some((w) => text.includes(w))) return kind
  }
  // Generic "make a game" with no named game → default to Snake (the arcade
  // still lets the player switch to Tetris or Dino in-preview).
  if (/\b(game|games|arcade|permainan|main game|play)\b/.test(text)) return 'snake'
  return null
}

function gameSpec(kind: GameKind): DesignSpec {
  const meta = GAME_META[kind]
  return {
    appName: meta.appName,
    industry: meta.industry,
    template: 'game',
    palette: TEMPLATE_PALETTES.game,
    currency: '',
    tagline: meta.tagline,
    description: meta.description,
    primaryAction: 'Play',
    categories: [],
    catalog: [],
    game: kind,
    hasContent: true,
  }
}

// ---------------------------------------------------------------------------
// Local, deterministic reasoning fallback.
// When the AI Gateway is unavailable (no funded card, rate limit, network),
// we still return a coherent, industry-aware spec by classifying the prompt
// with weighted multilingual keyword matching. Nothing here is random: the
// same prompt always yields the same branded app.
// ---------------------------------------------------------------------------

// Keyword sets per template, spanning English + Indonesian so prompts like
// "aplikasi pajak kendaraan" or "toko online" classify correctly.
const TEMPLATE_KEYWORDS: Record<Exclude<Template, 'generic' | 'game'>, string[]> = {
  government: [
    'samsat', 'pajak', 'tax', 'government', 'pemerintah', 'permit', 'izin',
    'license', 'lisensi', 'sim', 'ktp', 'passport', 'paspor', 'civic',
    'public service', 'layanan publik', 'kendaraan', 'vehicle', 'denda', 'fine',
    'retribusi', 'dukcapil', 'e-gov', 'municipal', 'kota', 'dinas',
  ],
  fintech: [
    'bank', 'wallet', 'dompet', 'payment', 'pembayaran', 'invest', 'investasi',
    'crypto', 'kripto', 'finance', 'keuangan', 'fintech', 'loan', 'pinjaman',
    'saldo', 'balance', 'transfer', 'insurance', 'asuransi', 'trading', 'saham',
    'stock', 'budgeting', 'tabungan', 'savings', 'e-money', 'cashless',
  ],
  edutech: [
    'school', 'sekolah', 'university', 'universitas', 'course', 'kursus',
    'learning', 'belajar', 'edu', 'education', 'pendidikan', 'lesson', 'pelajaran',
    'tutor', 'les', 'student', 'siswa', 'mahasiswa', 'exam', 'ujian', 'quiz',
    'bootcamp', 'training', 'pelatihan', 'academy', 'akademi', 'e-learning',
  ],
  food: [
    'coffee', 'kopi', 'cafe', 'kafe', 'restaurant', 'restoran', 'food', 'makanan',
    'menu', 'delivery', 'antar', 'kitchen', 'dapur', 'bakery', 'roti', 'drink',
    'minuman', 'warung', 'catering', 'kuliner', 'snack', 'jajan', 'dessert',
    'espresso', 'latte', 'pizza', 'burger', 'nasi', 'ayam', 'bar',
  ],
  ecommerce: [
    'shop', 'toko', 'store', 'ecommerce', 'e-commerce', 'marketplace', 'retail',
    'cart', 'keranjang', 'checkout', 'product', 'produk', 'fashion', 'clothing',
    'baju', 'sepatu', 'shoes', 'gadget', 'elektronik', 'electronics', 'jual',
    'sell', 'belanja', 'shopping', 'catalog', 'katalog', 'grosir', 'olshop',
  ],
  health: [
    'clinic', 'klinik', 'hospital', 'rumah sakit', 'pharmacy', 'apotek',
    'health', 'kesehatan', 'medical', 'medis', 'doctor', 'dokter', 'telemedicine',
    'wellness', 'obat', 'medicine', 'appointment', 'janji', 'dental', 'gigi',
    'therapy', 'terapi', 'patient', 'pasien', 'lab', 'vaksin', 'vaccine',
  ],
  saas: [
    'saas', 'dashboard', 'analytics', 'productivity', 'produktivitas', 'crm',
    'platform', 'b2b', 'workflow', 'automation', 'otomatisasi', 'project management',
    'manajemen proyek', 'tool', 'software', 'aplikasi bisnis', 'team', 'tim',
    'collaboration', 'kolaborasi', 'api', 'integration', 'integrasi', 'report',
  ],
}

// Human app-name seeds and taglines per detected template.
const HEURISTIC_BRANDING: Record<
  Template,
  { appName: string; industry: string; currency: string; tagline: string; description: string; primaryAction: string }
> = {
  government: {
    appName: 'e-SAMSAT',
    industry: 'Government / Vehicle Tax',
    currency: 'Rp',
    tagline: 'Bayar pajak kendaraan tanpa antre',
    description: 'A trusted public-service portal to check and settle your vehicle tax and permits online.',
    primaryAction: 'Bayar Pajak',
  },
  fintech: {
    appName: 'Vault Pay',
    industry: 'Fintech / Digital Wallet',
    currency: 'Rp',
    tagline: 'Your money, moving at your speed',
    description: 'A secure digital wallet to hold balances, pay bills, and grow your savings in one place.',
    primaryAction: 'Send money',
  },
  edutech: {
    appName: 'LearnHub',
    industry: 'EduTech / Online Courses',
    currency: '$',
    tagline: 'Learn anything, at your own pace',
    description: 'A friendly learning platform with courses, lessons, and certificates for every level.',
    primaryAction: 'Start learning',
  },
  food: {
    appName: 'Brew & Co.',
    industry: 'Food & Beverage',
    currency: '$',
    tagline: 'Freshly brewed, made for you',
    description: 'A cozy spot to browse the menu, order ahead, and get it delivered warm to your door.',
    primaryAction: 'Order now',
  },
  ecommerce: {
    appName: 'ShopNest',
    industry: 'E-Commerce / Marketplace',
    currency: '$',
    tagline: 'Everything you love, one tap away',
    description: 'A bright online store to browse products, fill your cart, and check out in seconds.',
    primaryAction: 'Add to cart',
  },
  health: {
    appName: 'CareLink',
    industry: 'Health / Telemedicine',
    currency: 'Rp',
    tagline: 'Care that comes to you',
    description: 'Book consultations, order medicine, and manage your health from anywhere.',
    primaryAction: 'Book visit',
  },
  saas: {
    appName: 'FlowOps',
    industry: 'SaaS / Productivity',
    currency: '$',
    tagline: 'Ship faster, together',
    description: 'A modern workspace to plan projects, track work, and automate the busywork.',
    primaryAction: 'Get started',
  },
  game: {
    appName: 'SUPERINTELLIGENS Arcade',
    industry: 'Arcade / Game',
    currency: '$',
    tagline: 'Playable classics, instantly',
    description: 'A pocket arcade with real, playable classic games.',
    primaryAction: 'Play now',
  },
  generic: {
    appName: 'SUPERINTELLIGENS App',
    industry: 'Universal App',
    currency: '$',
    tagline: 'A clean, original product concept',
    description: 'A clean, original product concept generated by SUPERINTELLIGENS',
    primaryAction: 'Get started',
  },
}

// Classify the prompt into a template by counting weighted keyword hits.
function classifyTemplate(prompt: string): Template {
  const text = prompt.toLowerCase()
  let best: Template = 'generic'
  let bestScore = 0
  for (const [template, keywords] of Object.entries(TEMPLATE_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      if (text.includes(kw)) score += kw.includes(' ') ? 2 : 1
    }
    if (score > bestScore) {
      bestScore = score
      best = template as Template
    }
  }
  return best
}

// Build a complete, coherent spec locally — reuses the same template palettes,
// categories, and catalog rows the AI path validates against.
function heuristicSpec(userPrompt: string): DesignSpec {
  const template = classifyTemplate(userPrompt)
  const brand = HEURISTIC_BRANDING[template]
  return {
    appName: brand.appName,
    industry: brand.industry,
    template,
    palette: TEMPLATE_PALETTES[template],
    currency: brand.currency,
    tagline: brand.tagline,
    description: brand.description,
    primaryAction: brand.primaryAction,
    categories: toCategories(undefined, template),
    catalog: toCatalog(undefined, template),
    hasContent: true,
  }
}

// Run the reasoning core through the AI SDK + Google Gemini, falling back
// across models when the primary is overloaded/rate-limited. The system prompt
// asks for a single JSON object; the raw text is validated downstream.
async function callEngine(userPrompt: string): Promise<string> {
  let lastError: unknown = null
  for (const model of MODEL_FALLBACKS) {
    try {
      const text = await geminiGenerateText({
        // Direct Google Gemini call, authenticated with VITE_GEMINI_API_KEY.
        model,
        system: SYSTEM_INSTRUCTION,
        // Few-shot anchors are prepended to the conversation immediately before
        // the live user payload so the runtime mimics production-grade depth.
        messages: [
          ...FEW_SHOT,
          { role: 'user', content: userPrompt },
        ],
        // Low-temperature constraint: prune creative drift, force rigid, cold
        // reasoning so output stays grounded in the exact prompt.
        temperature: 0.1,
        topP: 0.95,
        maxOutputTokens: 8192,
      })
      if (text?.trim()) return text
      lastError = new Error(`Model "${model}" returned an empty response`)
    } catch (err) {
      // Advance to the next fallback model on any provider-side failure.
      lastError = err
    }
  }
  throw new OverloadedError(
    (lastError as Error)?.message ?? 'All engine models are currently overloaded.',
  )
}

async function POST(req: Request) {
  let userPrompt = ''
  try {
    const body = await req.json()
    userPrompt =
      typeof body?.userPrompt === 'string' ? body.userPrompt.trim() : ''
  } catch {
    return Response.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  if (!userPrompt) {
    return Response.json(
      { success: false, message: 'Prompt is required' },
      { status: 400 },
    )
  }

  // Game requests render real, playable arcade components — no AI branding
  // pass needed, so resolve them deterministically and return immediately.
  const game = detectGame(userPrompt)
  if (game) {
    return Response.json({
      success: true,
      company: 'SUPERINTELLIGENS',
      model: 'superintelligens/arcade',
      engine: 'arcade',
      spec: gameSpec(game),
    })
  }

  // Prefer real AI reasoning; if the Gateway is unavailable for any reason
  // (no funded card, rate limit, network, malformed output) we degrade to the
  // deterministic local engine so a generation ALWAYS succeeds.
  try {
    const text = await callEngine(userPrompt)
    const parsed = extractJson(text)
    if (!parsed) throw new Error('Model did not return a valid app spec.')

    const template = pickEnum(parsed.template, TEMPLATES, 'generic')
    const appName = str(parsed.appName, 22, 'Untitled App')

    const spec: DesignSpec = {
      appName,
      industry: str(parsed.industry, 28, 'Universal App'),
      template,
      palette: toPalette(parsed.palette, template),
      currency: str(parsed.currency, 3, '$'),
      tagline: str(parsed.tagline, 48, appName),
      description: str(
        parsed.description,
        160,
        'A clean, original product concept generated by SUPERINTELLIGENS',
      ),
      primaryAction: str(parsed.primaryAction, 18, 'Get started'),
      categories: toCategories(parsed.categories, template),
      catalog: toCatalog(parsed.catalog, template),
      hasContent: true,
    }

    return Response.json({
      success: true,
      company: 'SUPERINTELLIGENS',
      model: MODEL,
      engine: 'ai',
      spec,
    })
  } catch (error) {
    console.log('[v0] AI engine unavailable, using local fallback:', (error as Error)?.message)
    // Deterministic local classification — never fails.
    const spec = heuristicSpec(userPrompt)
    return Response.json({
      success: true,
      company: 'SUPERINTELLIGENS',
      model: 'superintelligens/local-heuristic',
      engine: 'local',
      spec,
    })
  }
}

export const Route = createFileRoute('/api/generate')({
  server: { handlers: { POST: ({ request }) => POST(request) } },
})
