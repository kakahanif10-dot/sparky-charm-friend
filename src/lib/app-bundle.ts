// Runs the generated source files for real inside a sandboxed iframe.
// Files are compiled in the browser (Babel standalone) against a React + Tailwind
// runtime, with a tiny CommonJS module registry so relative imports work.

import type { AppFile } from '@/lib/builder.functions'

const RUNTIME = String.raw`
const FILES = window.__APP_FILES__;
const cache = {};

function dirname(p) {
  const i = p.lastIndexOf('/');
  return i === -1 ? '' : p.slice(0, i);
}

function normalize(p) {
  const out = [];
  for (const part of p.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/');
}

function resolve(from, spec) {
  const base = spec.startsWith('.') ? normalize(dirname(from) + '/' + spec) : normalize(spec);
  const candidates = [
    base,
    base + '.jsx',
    base + '.js',
    base + '.tsx',
    base + '.ts',
    base + '/index.jsx',
    base + '/index.js',
  ];
  for (const c of candidates) if (FILES[c] != null) return c;
  return base;
}

function requireFrom(from, spec) {
  if (spec === 'react') return window.React;
  if (spec === 'react-dom' || spec === 'react-dom/client') return window.ReactDOM;
  if (/\.(css|scss|svg|png|jpe?g)$/.test(spec)) return {};
  const path = resolve(from, spec);
  if (cache[path]) return cache[path].exports;
  const code = FILES[path];
  if (code == null) throw new Error('Module not found: ' + spec + ' (from ' + from + ')');
  const mod = { exports: {} };
  cache[path] = mod;
  const compiled = window.Babel.transform(code, {
    presets: [['react'], ['env', { modules: 'commonjs', targets: { chrome: '100' } }]],
    filename: path,
  }).code;
  const fn = new Function('module', 'exports', 'require', 'React', 'ReactDOM', compiled);
  fn(mod, mod.exports, (s) => requireFrom(path, s), window.React, window.ReactDOM);
  return mod.exports;
}

function showError(err) {
  const root = document.getElementById('root');
  root.innerHTML =
    '<div style="font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;padding:20px;color:#fca5a5;background:#18181b;white-space:pre-wrap">' +
    'This build failed to run:\n\n' + String(err && err.stack ? err.stack : err) + '</div>';
}

window.addEventListener('error', (e) => showError(e.error || e.message));

try {
  const entry = FILES['src/main.jsx'] ? 'src/main.jsx' : 'src/App.jsx';
  const mod = requireFrom('', entry);
  const App = mod && (mod.default || mod.App);
  if (typeof App === 'function') {
    const root = window.ReactDOM.createRoot(document.getElementById('root'));
    root.render(window.React.createElement(App));
  } else if (!document.getElementById('root').hasChildNodes()) {
    throw new Error('No default-exported App component was found.');
  }
} catch (err) {
  showError(err);
}
`

/** Builds the full HTML document that runs the generated app in an iframe. */
export function bundleToHtml(files: AppFile[]): string {
  const map: Record<string, string> = {}
  for (const f of files) map[f.path] = f.content

  const css = files
    .filter((f) => f.path.endsWith('.css'))
    .map((f) => f.content)
    .join('\n')

  const payload = JSON.stringify(map).replace(/</g, '\\u003c')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"></script>
<style>html,body,#root{min-height:100%}body{margin:0}${css}</style>
</head>
<body>
<div id="root"></div>
<script>window.__APP_FILES__ = ${payload};</script>
<script>${RUNTIME}</script>
</body>
</html>`
}

/** Exports every generated file as a zip download. */
export async function downloadAppZip(name: string, files: AppFile[]) {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const f of files) zip.file(f.path, f.content)
  zip.file(
    'README.md',
    `# ${name}\n\nGenerated with SUPERINTELLIGENS.\n\nRun locally:\n\n1. \`npm create vite@latest . -- --template react\`\n2. Copy these \`src/\` files over the generated ones.\n3. \`npm install && npm run dev\`\n`,
  )
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'app'}.zip`
  a.click()
  URL.revokeObjectURL(url)
}
