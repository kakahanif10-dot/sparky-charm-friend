// SUPERINTELLIGENS — Autonomous AI Consultant runtime helpers.
// Drives the chat-driven consultant: the streaming compile log, the industry
// aware proactive recommendation engine, the local gallery dataset, and an
// HONEST source-code export (a real Expo/React Native project ZIP built in the
// browser — no fake .apk URL). The ZIP can be turned into an installable .apk
// with `eas build -p android`.

import { TEMPLATE_LABELS, type DesignSpec, type Template } from '@/lib/design'

/* ------------------------------------------------------------------ */
/* Streaming compile log                                               */
/* ------------------------------------------------------------------ */

// The analytical "thoughts" the consultant streams while compiling. Advancing
// through all of these takes ~3.6s, matching the render budget in the brief.
export const COMPILE_STEPS = [
  'Analyzing prompt semantics & industry vertical…',
  'Selecting corporate palette & typography tokens…',
  'Compiling React Native component tree…',
  'Wiring stateful navigation & data layer…',
  'Optimizing layout for the target viewport…',
  'Finalizing signed build snapshot…',
] as const

export const COMPILE_DURATION_MS = 3600

/* ------------------------------------------------------------------ */
/* Proactive recommendation engine                                     */
/* ------------------------------------------------------------------ */

export type Recommendation = {
  label: string // shown on the interactive chip
  append: string // appended to the prompt to stream the next code override
}

export type ConsultantMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  image?: string
  recommendations?: Recommendation[]
}

const RECOMMENDATIONS: Record<Template, Recommendation[]> = {
  government: [
    { label: 'Digital e-payment gateway controller', append: 'add a stateful digital payment gateway with a checkout flow for tax bills' },
    { label: 'Automated KTP/STNK document OCR upload', append: 'add automated document upload with OCR verification for KTP and STNK' },
    { label: 'Real-time queue & appointment scheduler', append: 'add a real-time service queue and appointment scheduler' },
  ],
  fintech: [
    { label: 'Stateful peer-to-peer transfer sheet', append: 'add a stateful peer-to-peer money transfer flow' },
    { label: 'Automated bill-split & budget matrix', append: 'add automated bill splitting and budgeting tools' },
    { label: 'Live investment portfolio tracker', append: 'add a live investment portfolio tracking dashboard' },
  ],
  edutech: [
    { label: 'Interactive quiz & progress tracker', append: 'add interactive quizzes and a learning progress tracker' },
    { label: 'Live student discount voucher matrix', append: 'add a student discount voucher system' },
    { label: 'Certificate & badge issuance layout', append: 'add certificate and achievement badge issuance' },
  ],
  food: [
    { label: 'Stateful digital cart checkout controller', append: 'add a stateful digital cart with a checkout controller' },
    { label: 'Live loyalty & discount voucher matrix', append: 'add loyalty points and discount vouchers' },
    { label: 'Integrated geolocation courier tracking', append: 'add live geolocation courier order tracking' },
  ],
  ecommerce: [
    { label: 'Stateful cart & one-tap checkout controller', append: 'add a stateful cart and one-tap checkout' },
    { label: 'Flash-sale & voucher discount matrix', append: 'add flash sales and discount vouchers' },
    { label: 'Order tracking & courier layout', append: 'add order tracking with live courier updates' },
  ],
  health: [
    { label: 'Tele-consultation booking controller', append: 'add a telemedicine consultation booking flow' },
    { label: 'Prescription & pharmacy delivery matrix', append: 'add prescription management and pharmacy delivery' },
    { label: 'Appointment & reminder scheduler', append: 'add appointment scheduling with reminders' },
  ],
  saas: [
    { label: 'Stateful subscription & billing controller', append: 'add a subscription billing and plan-upgrade flow' },
    { label: 'Team roles & permissions matrix', append: 'add team roles and permission management' },
    { label: 'Live analytics & usage dashboard', append: 'add a live analytics and usage dashboard' },
  ],
  game: [
    { label: 'Play Snake', append: 'make a snake game' },
    { label: 'Play Tetris', append: 'make a tetris game' },
    { label: 'Play Dino Run', append: 'make a dino runner game' },
    { label: 'Play Pong', append: 'make a pong game' },
    { label: 'Play Breakout', append: 'make a breakout game' },
    { label: 'Play Flappy', append: 'make a flappy bird game' },
    { label: 'Play 2048', append: 'make a 2048 game' },
    { label: 'Play Memory', append: 'make a memory card game' },
  ],
  generic: [
    { label: 'Stateful onboarding flow controller', append: 'add a stateful multi-step onboarding flow' },
    { label: 'Notifications & activity feed matrix', append: 'add a notifications and activity feed' },
    { label: 'Account & settings management layout', append: 'add account and settings management' },
  ],
}

export function recommendationsFor(spec: DesignSpec): Recommendation[] {
  return RECOMMENDATIONS[spec.template] ?? RECOMMENDATIONS.generic
}

// The proactive message the consultant speaks once the frame renders. It names
// the detected vertical and offers exactly three algorithmic suggestions.
export function introMessage(spec: DesignSpec): string {
  const recs = recommendationsFor(spec)
  const label = (spec.industry || TEMPLATE_LABELS[spec.template]).toLowerCase()
  const name = spec.appName ? `“${spec.appName}”` : `your ${label} app`
  // Games are actually playable in the preview, not editable text mockups.
  if (spec.template === 'game') {
    return (
      `${name} is live and fully playable right in the preview — hit Play and use the arrow keys, WASD, or the on-screen buttons (tap works too). ` +
      `There are eight games in the cabinet: Snake, Tetris, Dino Run, Pong, Breakout, Flappy, 2048, and Memory — switch between them with the tabs up top. ` +
      `Want a different game or a tweak? Just tell me.`
    )
  }
  return (
    `Alright, ${name} is live in the preview — go ahead and click around, it's fully interactive. ` +
    `Oh, and every piece of text is editable: just click any label, price, or button in the preview to rename it on the spot. ` +
    `Want to take it further? I could wire up ${recs[0].label.toLowerCase()}, ${recs[1].label.toLowerCase()}, or ${recs[2].label.toLowerCase()} — or just tell me what's on your mind.`
  )
}

/* ------------------------------------------------------------------ */
/* Local gallery dataset                                               */
/* ------------------------------------------------------------------ */

export type GalleryImage = { src: string; label: string }

export const GALLERY_IMAGES: GalleryImage[] = [
  { src: '/gallery/cafe.png', label: 'Cafe & Food' },
  { src: '/gallery/retail.png', label: 'Retail Product' },
  { src: '/gallery/finance.png', label: 'Finance & City' },
  { src: '/gallery/health.png', label: 'Health & Clinic' },
  { src: '/gallery/education.png', label: 'Education' },
  { src: '/gallery/tech.png', label: 'Abstract Tech' },
]

/* ------------------------------------------------------------------ */
/* Honest source export — a real Expo project ZIP, built in-browser     */
/* ------------------------------------------------------------------ */

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'superintelligens-app'
  )
}

// Build a small but genuine Expo / React Native project from the design spec.
function buildProjectFiles(spec: DesignSpec): { name: string; content: string }[] {
  const slug = slugify(spec.appName)
  const p = spec.palette

  const theme =
    `// Generated design tokens for ${spec.appName}.\n` +
    `export const theme = ${JSON.stringify(p, null, 2)} as const;\n`

  const catalog =
    `// Industry catalog generated by the SUPERINTELLIGENS Context-Aware Engine.\n` +
    `export const categories = ${JSON.stringify(spec.categories, null, 2)} as const;\n\n` +
    `export type CatalogItem = { name: string; price: number; meta: string };\n\n` +
    `export const catalog: CatalogItem[] = ${JSON.stringify(spec.catalog, null, 2)};\n`

  const appTsx = [
    `import React from 'react';`,
    `import { SafeAreaView, ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';`,
    `import { theme } from './theme';`,
    `import { catalog, categories } from './catalog';`,
    ``,
    `const APP_NAME = ${JSON.stringify(spec.appName)};`,
    `const INDUSTRY = ${JSON.stringify(spec.industry)};`,
    `const TAGLINE = ${JSON.stringify(spec.tagline)};`,
    `const DESCRIPTION = ${JSON.stringify(spec.description)};`,
    `const PRIMARY_ACTION = ${JSON.stringify(spec.primaryAction)};`,
    `const CURRENCY = ${JSON.stringify(spec.currency)};`,
    ``,
    `function formatPrice(price: number) {`,
    `  return CURRENCY + price.toLocaleString('en-US');`,
    `}`,
    ``,
    `export default function App() {`,
    `  return (`,
    `    <SafeAreaView style={styles.root}>`,
    `      <View style={styles.header}>`,
    `        <View>`,
    `          <Text style={styles.brand}>{APP_NAME}</Text>`,
    `          <Text style={styles.industry}>{INDUSTRY}</Text>`,
    `        </View>`,
    `      </View>`,
    `      <ScrollView contentContainerStyle={styles.body}>`,
    `        <Text style={styles.tagline}>{TAGLINE}</Text>`,
    `        <Text style={styles.desc}>{DESCRIPTION}</Text>`,
    `        <View style={styles.chips}>`,
    `          {categories.map((c) => (`,
    `            <View key={c} style={styles.chip}>`,
    `              <Text style={styles.chipText}>{c}</Text>`,
    `            </View>`,
    `          ))}`,
    `        </View>`,
    `        {catalog.map((item) => (`,
    `          <View key={item.name} style={styles.card}>`,
    `            <View style={{ flex: 1 }}>`,
    `              <Text style={styles.name}>{item.name}</Text>`,
    `              {item.meta ? <Text style={styles.meta}>{item.meta}</Text> : null}`,
    `            </View>`,
    `            <Text style={styles.price}>`,
    `              {item.price > 0 ? formatPrice(item.price) : 'Included'}`,
    `            </Text>`,
    `          </View>`,
    `        ))}`,
    `        <Pressable style={styles.cta}>`,
    `          <Text style={styles.ctaText}>{PRIMARY_ACTION}</Text>`,
    `        </Pressable>`,
    `      </ScrollView>`,
    `    </SafeAreaView>`,
    `  );`,
    `}`,
    ``,
    `const styles = StyleSheet.create({`,
    `  root: { flex: 1, backgroundColor: theme.bg },`,
    `  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border },`,
    `  brand: { color: theme.text, fontSize: 18, fontWeight: '700' },`,
    `  industry: { color: theme.muted, fontSize: 11, marginTop: 2 },`,
    `  body: { padding: 20, gap: 12 },`,
    `  tagline: { color: theme.text, fontSize: 22, fontWeight: '800' },`,
    `  desc: { color: theme.muted, fontSize: 13, marginBottom: 8 },`,
    `  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },`,
    `  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },`,
    `  chipText: { color: theme.muted, fontSize: 11, fontWeight: '600' },`,
    `  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },`,
    `  name: { color: theme.text, fontSize: 14, fontWeight: '600' },`,
    `  meta: { color: theme.muted, fontSize: 11, marginTop: 2 },`,
    `  price: { color: theme.accent, fontSize: 14, fontWeight: '700' },`,
    `  cta: { marginTop: 8, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: theme.accent },`,
    `  ctaText: { color: theme.accentText, fontSize: 14, fontWeight: '700' },`,
    `});`,
    ``,
  ].join('\n')

  const appJson = JSON.stringify(
    {
      expo: {
        name: spec.appName,
        slug,
        version: '1.0.0',
        orientation: 'portrait',
        userInterfaceStyle: 'automatic',
        splash: { backgroundColor: p.bg },
        android: { package: `build.superintelligens.${slug.replace(/-/g, '')}` },
      },
    },
    null,
    2,
  )

  const packageJson = JSON.stringify(
    {
      name: slug,
      version: '1.0.0',
      main: 'node_modules/expo/AppEntry.js',
      scripts: { start: 'expo start', android: 'expo run:android' },
      dependencies: {
        expo: '~51.0.0',
        react: '18.2.0',
        'react-native': '0.74.5',
      },
      private: true,
    },
    null,
    2,
  )

  const readme = [
    `# ${spec.appName}`,
    ``,
    `${spec.description}`,
    ``,
    `Generated by the **SUPERINTELLIGENS Context-Aware Engine** as a real Expo /`,
    `React Native source project — not a pre-built binary.`,
    ``,
    `## Turn this into an installable .apk`,
    ``,
    '```bash',
    '# 1. Scaffold a fresh Expo app and drop these files in',
    'npx create-expo-app ' + slug,
    '# copy App.tsx, theme.ts and catalog.ts into the project root',
    '',
    '# 2. Install the EAS CLI and log in',
    'npm install -g eas-cli',
    'eas login',
    '',
    '# 3. Build a real, installable Android .apk',
    'eas build -p android --profile preview',
    '```',
    '',
    'The `preview` profile produces an `.apk` you can sideload onto any',
    'Android device. For a Play Store release, use `--profile production`',
    'to produce an `.aab`.',
    ``,
    `> An APK is a compiled, signed Android binary. It can only be produced by`,
    `> a real build pipeline (Gradle / the Android SDK, which EAS runs for you),`,
    `> so SUPERINTELLIGENS exports the honest, buildable source instead of a broken link.`,
    ``,
  ].join('\n')

  return [
    { name: `${slug}/App.tsx`, content: appTsx },
    { name: `${slug}/theme.ts`, content: theme },
    { name: `${slug}/catalog.ts`, content: catalog },
    { name: `${slug}/app.json`, content: appJson },
    { name: `${slug}/package.json`, content: packageJson },
    { name: `${slug}/README.md`, content: readme },
  ]
}

/* --- Minimal STORE-method ZIP writer (valid .zip, no dependencies) --- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function pushU16(arr: number[], n: number) {
  arr.push(n & 0xff, (n >>> 8) & 0xff)
}
function pushU32(arr: number[], n: number) {
  arr.push(n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff)
}

function createZip(files: { name: string; content: string }[]): Blob {
  const enc = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  for (const f of files) {
    const nameBytes = enc.encode(f.name)
    const dataBytes = enc.encode(f.content)
    const crc = crc32(dataBytes)

    const local: number[] = []
    pushU32(local, 0x04034b50) // local file header signature
    pushU16(local, 20) // version needed
    pushU16(local, 0) // flags
    pushU16(local, 0) // method: store
    pushU16(local, 0) // mod time
    pushU16(local, 0x21) // mod date (fixed)
    pushU32(local, crc)
    pushU32(local, dataBytes.length) // compressed size
    pushU32(local, dataBytes.length) // uncompressed size
    pushU16(local, nameBytes.length)
    pushU16(local, 0) // extra length
    for (const b of nameBytes) local.push(b)
    for (const b of dataBytes) local.push(b)
    localParts.push(Uint8Array.from(local))

    const central: number[] = []
    pushU32(central, 0x02014b50) // central dir signature
    pushU16(central, 20) // version made by
    pushU16(central, 20) // version needed
    pushU16(central, 0) // flags
    pushU16(central, 0) // method
    pushU16(central, 0) // mod time
    pushU16(central, 0x21) // mod date
    pushU32(central, crc)
    pushU32(central, dataBytes.length)
    pushU32(central, dataBytes.length)
    pushU16(central, nameBytes.length)
    pushU16(central, 0) // extra length
    pushU16(central, 0) // comment length
    pushU16(central, 0) // disk number
    pushU16(central, 0) // internal attrs
    pushU32(central, 0) // external attrs
    pushU32(central, offset) // local header offset
    for (const b of nameBytes) central.push(b)
    centralParts.push(Uint8Array.from(central))

    offset += local.length
  }

  const centralStart = offset
  const centralSize = centralParts.reduce((sum, c) => sum + c.length, 0)

  const eocd: number[] = []
  pushU32(eocd, 0x06054b50) // end of central dir signature
  pushU16(eocd, 0) // disk number
  pushU16(eocd, 0) // disk with central dir
  pushU16(eocd, files.length)
  pushU16(eocd, files.length)
  pushU32(eocd, centralSize)
  pushU32(eocd, centralStart)
  pushU16(eocd, 0) // comment length

  return new Blob([...localParts, ...centralParts, Uint8Array.from(eocd)] as BlobPart[], {
    type: 'application/zip',
  })
}

// Serialize the active design spec to a real Expo project ZIP and trigger a
// browser download. Honest replacement for the fake .apk URL.
export function downloadSourceZip(spec: DesignSpec) {
  const blob = createZip(buildProjectFiles(spec))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(spec.appName)}-expo-source.zip`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
