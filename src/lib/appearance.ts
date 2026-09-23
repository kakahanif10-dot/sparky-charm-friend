export type Appearance = 'dark' | 'light'

const KEY = 'superintelligens.appearance'

export function applyAppearance(appearance: Appearance) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('theme-white', appearance === 'light')
  try {
    localStorage.setItem(KEY, appearance)
  } catch {
    /* storage unavailable — appearance stays for this session only */
  }
}

export function storedAppearance(): Appearance {
  if (typeof localStorage === 'undefined') return 'dark'
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}
