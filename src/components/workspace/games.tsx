
/* ------------------------------------------------------------------ */
/* SUPERINTELLIGENS Arcade — real, playable games rendered live in the preview  */
/* Snake · Tetris · Dino. Each is a self-contained React component with  */
/* keyboard + on-screen touch controls, scoring, pause and restart.     */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DesignSpec, GameKind } from '@/lib/design'
import { cn } from '@/lib/utils'

const GAMES: { key: GameKind; label: string }[] = [
  { key: 'snake', label: 'Snake' },
  { key: 'tetris', label: 'Tetris' },
  { key: 'dino', label: 'Dino' },
  { key: 'pong', label: 'Pong' },
  { key: 'breakout', label: 'Breakout' },
  { key: 'flappy', label: 'Flappy' },
  { key: '2048', label: '2048' },
  { key: 'memory', label: 'Memory' },
]

export function GameArcade({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [active, setActive] = useState<GameKind>(spec.game ?? 'snake')

  useEffect(() => {
    if (spec.game) setActive(spec.game)
  }, [spec.game])

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ backgroundColor: p.bg, color: p.text }}
    >
      {/* Cabinet header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${p.border}` }}
      >
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold leading-tight tracking-wide">
            {spec.appName}
          </p>
          <p className="truncate text-[9px] leading-tight" style={{ color: p.muted }}>
            {spec.industry || 'Arcade / Game'}
          </p>
        </div>
        <span
          className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
          style={{ backgroundColor: p.accent, color: p.accentText }}
        >
          Insert Coin
        </span>
      </div>

      {/* Game selector */}
      <div className="flex shrink-0 gap-1.5 px-3 py-2" style={{ borderBottom: `1px solid ${p.border}` }}>
        {GAMES.map((g) => {
          const on = g.key === active
          return (
            <button
              key={g.key}
              onClick={() => setActive(g.key)}
              className="flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors"
              style={{
                backgroundColor: on ? p.accent : p.surface,
                color: on ? p.accentText : p.muted,
                border: `1px solid ${p.border}`,
              }}
            >
              {g.label}
            </button>
          )
        })}
      </div>

      {/* Active game */}
      <div className="thin-scroll flex min-h-0 flex-1 items-start justify-center overflow-y-auto p-3">
        {active === 'snake' && <SnakeGame spec={spec} />}
        {active === 'tetris' && <TetrisGame spec={spec} />}
        {active === 'dino' && <DinoGame spec={spec} />}
        {active === 'pong' && <PongGame spec={spec} />}
        {active === 'breakout' && <BreakoutGame spec={spec} />}
        {active === 'flappy' && <FlappyGame spec={spec} />}
        {active === '2048' && <Game2048 spec={spec} />}
        {active === 'memory' && <MemoryGame spec={spec} />}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Shared UI bits                                                       */
/* ------------------------------------------------------------------ */

function ScoreBar({
  spec,
  items,
}: {
  spec: DesignSpec
  items: { label: string; value: string | number }[]
}) {
  const p = spec.palette
  return (
    <div className="flex w-full items-center justify-between gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex-1 rounded-lg px-2 py-1 text-center"
          style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
        >
          <p className="text-[8px] uppercase tracking-wide" style={{ color: p.muted }}>
            {it.label}
          </p>
          <p className="font-mono text-sm font-bold" style={{ color: p.accent }}>
            {it.value}
          </p>
        </div>
      ))}
    </div>
  )
}

function ControlButton({
  spec,
  onClick,
  children,
  ariaLabel,
  className,
}: {
  spec: DesignSpec
  onClick: () => void
  children: React.ReactNode
  ariaLabel: string
  className?: string
}) {
  const p = spec.palette
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={cn(
        'flex items-center justify-center rounded-lg transition-transform active:scale-90',
        className,
      )}
      style={{ backgroundColor: p.surface, color: p.text, border: `1px solid ${p.border}` }}
    >
      {children}
    </button>
  )
}

function Overlay({
  spec,
  title,
  hint,
  onAction,
  actionLabel,
}: {
  spec: DesignSpec
  title: string
  hint: string
  onAction: () => void
  actionLabel: string
}) {
  const p = spec.palette
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.62)' }}>
      <p className="text-lg font-black uppercase tracking-widest" style={{ color: p.accent }}>
        {title}
      </p>
      <p className="px-6 text-center text-[11px]" style={{ color: p.text }}>
        {hint}
      </p>
      <button
        onClick={onAction}
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-opacity active:opacity-80"
        style={{ backgroundColor: p.accent, color: p.accentText }}
      >
        <Play className="h-3.5 w-3.5" /> {actionLabel}
      </button>
    </div>
  )
}

// Small helper — subscribe to arrow/WASD/space with preventDefault scroll.
function useGameKeys(handler: (key: string) => void, enabled = true) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const k = e.key
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(k)
      ) {
        e.preventDefault()
        ref.current(k)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

/* ------------------------------------------------------------------ */
/* SNAKE                                                                */
/* ------------------------------------------------------------------ */

const SNAKE_COLS = 17
const SNAKE_ROWS = 17

type Cell = { x: number; y: number }
type Dir = 'up' | 'down' | 'left' | 'right'

function SnakeGame({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [snake, setSnake] = useState<Cell[]>([{ x: 8, y: 8 }])
  const [food, setFood] = useState<Cell>({ x: 4, y: 4 })
  const [dir, setDir] = useState<Dir>('right')
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)

  const dirRef = useRef(dir)
  const nextDirRef = useRef(dir)
  dirRef.current = dir

  const randFood = useCallback((body: Cell[]): Cell => {
    let c: Cell
    do {
      c = { x: Math.floor(Math.random() * SNAKE_COLS), y: Math.floor(Math.random() * SNAKE_ROWS) }
    } while (body.some((s) => s.x === c.x && s.y === c.y))
    return c
  }, [])

  const reset = useCallback(() => {
    const start = [{ x: 8, y: 8 }]
    setSnake(start)
    setDir('right')
    nextDirRef.current = 'right'
    setFood(randFood(start))
    setScore(0)
    setOver(false)
    setRunning(true)
  }, [randFood])

  const turn = useCallback((d: Dir) => {
    const cur = dirRef.current
    const opposite =
      (cur === 'up' && d === 'down') ||
      (cur === 'down' && d === 'up') ||
      (cur === 'left' && d === 'right') ||
      (cur === 'right' && d === 'left')
    if (!opposite) nextDirRef.current = d
  }, [])

  useGameKeys((k) => {
    if (k === 'ArrowUp' || k === 'w' || k === 'W') turn('up')
    else if (k === 'ArrowDown' || k === 's' || k === 'S') turn('down')
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') turn('left')
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') turn('right')
    else if (k === ' ') {
      if (over) reset()
      else setRunning((r) => !r)
    }
  })

  useEffect(() => {
    if (!running || over) return
    const speed = Math.max(75, 140 - score * 3)
    const id = setInterval(() => {
      setSnake((prev) => {
        const d = nextDirRef.current
        setDir(d)
        const head = { ...prev[0] }
        if (d === 'up') head.y -= 1
        if (d === 'down') head.y += 1
        if (d === 'left') head.x -= 1
        if (d === 'right') head.x += 1

        // Wall or self collision → game over.
        if (
          head.x < 0 || head.x >= SNAKE_COLS ||
          head.y < 0 || head.y >= SNAKE_ROWS ||
          prev.some((s) => s.x === head.x && s.y === head.y)
        ) {
          setOver(true)
          setRunning(false)
          setBest((b) => Math.max(b, score))
          return prev
        }

        const ate = head.x === food.x && head.y === food.y
        const next = [head, ...prev]
        if (ate) {
          setScore((s) => s + 1)
          setFood(randFood(next))
        } else {
          next.pop()
        }
        return next
      })
    }, speed)
    return () => clearInterval(id)
  }, [running, over, score, food, randFood])

  return (
    <div className="flex w-full max-w-[300px] flex-col gap-2.5">
      <ScoreBar spec={spec} items={[{ label: 'Score', value: score }, { label: 'Best', value: best }]} />

      <div className="relative">
        <div
          className="grid aspect-square w-full overflow-hidden rounded-xl"
          style={{
            gridTemplateColumns: `repeat(${SNAKE_COLS}, 1fr)`,
            backgroundColor: p.surface,
            border: `1px solid ${p.border}`,
          }}
        >
          {Array.from({ length: SNAKE_COLS * SNAKE_ROWS }).map((_, i) => {
            const x = i % SNAKE_COLS
            const y = Math.floor(i / SNAKE_COLS)
            const isHead = snake[0]?.x === x && snake[0]?.y === y
            const isBody = !isHead && snake.some((s) => s.x === x && s.y === y)
            const isFood = food.x === x && food.y === y
            return (
              <div
                key={i}
                style={{
                  backgroundColor: isHead
                    ? p.accent
                    : isBody
                      ? `${p.accent}aa`
                      : isFood
                        ? '#f43f5e'
                        : 'transparent',
                  borderRadius: isFood ? '50%' : isHead || isBody ? '2px' : 0,
                }}
              />
            )
          })}
        </div>

        {!running && !over && (
          <Overlay spec={spec} title="Snake" hint="Arrows / WASD to move · eat the dots · avoid the walls and yourself." onAction={reset} actionLabel="Play" />
        )}
        {over && (
          <Overlay spec={spec} title="Game Over" hint={`You scored ${score}. Press play or Space to try again.`} onAction={reset} actionLabel="Retry" />
        )}
      </div>

      <SnakePad spec={spec} onTurn={turn} onToggle={() => (over ? reset() : setRunning((r) => !r))} running={running} over={over} />
    </div>
  )
}

function SnakePad({
  spec,
  onTurn,
  onToggle,
  running,
  over,
}: {
  spec: DesignSpec
  onTurn: (d: Dir) => void
  onToggle: () => void
  running: boolean
  over: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="grid grid-cols-3 grid-rows-3 gap-1" style={{ width: 116 }}>
        <span />
        <ControlButton spec={spec} ariaLabel="Up" onClick={() => onTurn('up')} className="h-9"><ChevronUp className="h-4 w-4" /></ControlButton>
        <span />
        <ControlButton spec={spec} ariaLabel="Left" onClick={() => onTurn('left')} className="h-9"><ChevronLeft className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Down" onClick={() => onTurn('down')} className="h-9"><ChevronDown className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Right" onClick={() => onTurn('right')} className="h-9"><ChevronRight className="h-4 w-4" /></ControlButton>
      </div>
      <ControlButton spec={spec} ariaLabel={over ? 'Restart' : running ? 'Pause' : 'Play'} onClick={onToggle} className="h-11 w-11">
        {over ? <RotateCcw className="h-4 w-4" /> : running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </ControlButton>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* TETRIS                                                               */
/* ------------------------------------------------------------------ */

const T_COLS = 10
const T_ROWS = 18

type Shape = number[][]
const TETROMINOES: { shape: Shape; color: string }[] = [
  { shape: [[1, 1, 1, 1]], color: '#22d3ee' }, // I
  { shape: [[1, 1], [1, 1]], color: '#facc15' }, // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' }, // T
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#4ade80' }, // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#f43f5e' }, // Z
  { shape: [[1, 0, 0], [1, 1, 1]], color: '#3b82f6' }, // J
  { shape: [[0, 0, 1], [1, 1, 1]], color: '#fb923c' }, // L
]

type Piece = { shape: Shape; color: string; x: number; y: number }

const emptyBoard = (): (string | null)[][] =>
  Array.from({ length: T_ROWS }, () => Array<string | null>(T_COLS).fill(null))

function randomPiece(): Piece {
  const t = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)]
  return { shape: t.shape, color: t.color, x: Math.floor((T_COLS - t.shape[0].length) / 2), y: 0 }
}

function rotate(shape: Shape): Shape {
  const rows = shape.length
  const cols = shape[0].length
  const out: Shape = Array.from({ length: cols }, () => Array<number>(rows).fill(0))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out[c][rows - 1 - r] = shape[r][c]
    }
  }
  return out
}

function collides(board: (string | null)[][], piece: Piece, nx: number, ny: number, shape?: Shape): boolean {
  const s = shape ?? piece.shape
  for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < s[r].length; c++) {
      if (!s[r][c]) continue
      const x = nx + c
      const y = ny + r
      if (x < 0 || x >= T_COLS || y >= T_ROWS) return true
      if (y >= 0 && board[y][x]) return true
    }
  }
  return false
}

function TetrisGame({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [board, setBoard] = useState<(string | null)[][]>(emptyBoard)
  const [piece, setPiece] = useState<Piece>(randomPiece)
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)

  const boardRef = useRef(board)
  const pieceRef = useRef(piece)
  boardRef.current = board
  pieceRef.current = piece

  const lockAndSpawn = useCallback((b: (string | null)[][], pc: Piece) => {
    const nb = b.map((row) => [...row])
    pc.shape.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v) {
          const y = pc.y + r
          const x = pc.x + c
          if (y >= 0) nb[y][x] = pc.color
        }
      }),
    )
    // Clear full lines.
    let cleared = 0
    for (let r = T_ROWS - 1; r >= 0; r--) {
      if (nb[r].every((cell) => cell)) {
        nb.splice(r, 1)
        nb.unshift(Array<string | null>(T_COLS).fill(null))
        cleared++
        r++
      }
    }
    if (cleared) {
      setLines((l) => l + cleared)
      setScore((s) => s + [0, 40, 100, 300, 1200][cleared])
    }
    const next = randomPiece()
    if (collides(nb, next, next.x, next.y)) {
      setBoard(nb)
      setOver(true)
      setRunning(false)
      return
    }
    setBoard(nb)
    setPiece(next)
  }, [])

  const step = useCallback(() => {
    const b = boardRef.current
    const pc = pieceRef.current
    if (!collides(b, pc, pc.x, pc.y + 1)) {
      setPiece({ ...pc, y: pc.y + 1 })
    } else {
      lockAndSpawn(b, pc)
    }
  }, [lockAndSpawn])

  const move = useCallback((dx: number) => {
    const b = boardRef.current
    const pc = pieceRef.current
    if (!collides(b, pc, pc.x + dx, pc.y)) setPiece({ ...pc, x: pc.x + dx })
  }, [])

  const rotatePiece = useCallback(() => {
    const b = boardRef.current
    const pc = pieceRef.current
    const r = rotate(pc.shape)
    // Basic wall kick.
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collides(b, pc, pc.x + kick, pc.y, r)) {
        setPiece({ ...pc, x: pc.x + kick, shape: r })
        return
      }
    }
  }, [])

  const drop = useCallback(() => {
    const b = boardRef.current
    const pc = pieceRef.current
    let y = pc.y
    while (!collides(b, pc, pc.x, y + 1)) y++
    lockAndSpawn(b, { ...pc, y })
  }, [lockAndSpawn])

  const reset = useCallback(() => {
    setBoard(emptyBoard())
    setPiece(randomPiece())
    setScore(0)
    setLines(0)
    setOver(false)
    setRunning(true)
  }, [])

  useGameKeys((k) => {
    if (over) {
      if (k === ' ') reset()
      return
    }
    if (!running) {
      if (k === ' ') setRunning(true)
      return
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') move(-1)
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') move(1)
    else if (k === 'ArrowDown' || k === 's' || k === 'S') step()
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') rotatePiece()
    else if (k === ' ') drop()
  })

  useEffect(() => {
    if (!running || over) return
    const speed = Math.max(140, 520 - lines * 24)
    const id = setInterval(step, speed)
    return () => clearInterval(id)
  }, [running, over, lines, step])

  // Compose board + active piece for rendering.
  const view = board.map((row) => [...row])
  piece.shape.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v) {
        const y = piece.y + r
        const x = piece.x + c
        if (y >= 0 && y < T_ROWS && x >= 0 && x < T_COLS) view[y][x] = piece.color
      }
    }),
  )

  return (
    <div className="flex w-full max-w-[280px] flex-col gap-2.5">
      <ScoreBar spec={spec} items={[{ label: 'Score', value: score }, { label: 'Lines', value: lines }]} />

      <div className="relative mx-auto">
        <div
          className="grid overflow-hidden rounded-xl"
          style={{
            gridTemplateColumns: `repeat(${T_COLS}, 1fr)`,
            width: 'min(56vw, 200px)',
            aspectRatio: `${T_COLS} / ${T_ROWS}`,
            backgroundColor: p.surface,
            border: `1px solid ${p.border}`,
          }}
        >
          {view.flatMap((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                style={{
                  backgroundColor: cell ?? 'transparent',
                  outline: cell ? '1px solid rgba(0,0,0,0.25)' : 'none',
                  outlineOffset: -1,
                }}
              />
            )),
          )}
        </div>

        {!running && !over && (
          <Overlay spec={spec} title="Tetris" hint="← → move · ↑ rotate · ↓ soft drop · Space hard drop." onAction={reset} actionLabel="Play" />
        )}
        {over && (
          <Overlay spec={spec} title="Game Over" hint={`Score ${score} · ${lines} lines cleared.`} onAction={reset} actionLabel="Retry" />
        )}
      </div>

      <div className="flex items-center justify-between gap-1.5">
        <ControlButton spec={spec} ariaLabel="Left" onClick={() => move(-1)} className="h-10 flex-1"><ChevronLeft className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Rotate" onClick={rotatePiece} className="h-10 flex-1"><RotateCcw className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Right" onClick={() => move(1)} className="h-10 flex-1"><ChevronRight className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Drop" onClick={drop} className="h-10 flex-1"><ChevronDown className="h-4 w-4" /></ControlButton>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* DINO RUN                                                             */
/* ------------------------------------------------------------------ */

function DinoGame({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [tick, setTick] = useState(0) // forces re-render each frame

  // Physics kept in refs so the RAF loop reads fresh values without re-subscribing.
  const groundY = 0
  const dinoY = useRef(groundY) // height above ground (px)
  const vel = useRef(0)
  const obstacles = useRef<{ x: number; h: number; w: number }[]>([])
  const speed = useRef(3.4)
  const distance = useRef(0)
  const raf = useRef<number | null>(null)
  const last = useRef(0)
  const runningRef = useRef(false)
  const overRef = useRef(false)
  runningRef.current = running
  overRef.current = over

  const FIELD_W = 300
  const FIELD_H = 120
  const DINO_X = 30
  const DINO_SIZE = 22
  const GRAVITY = 0.75
  const JUMP_V = 12.5

  const jump = useCallback(() => {
    if (overRef.current) return
    if (!runningRef.current) {
      setRunning(true)
      return
    }
    if (dinoY.current <= 0.5) vel.current = JUMP_V
  }, [])

  const reset = useCallback(() => {
    dinoY.current = 0
    vel.current = 0
    obstacles.current = []
    speed.current = 3.4
    distance.current = 0
    setScore(0)
    setOver(false)
    setRunning(true)
  }, [])

  useGameKeys((k) => {
    if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
      if (overRef.current) reset()
      else jump()
    }
  })

  useEffect(() => {
    if (!running || over) return
    const loop = (t: number) => {
      if (!last.current) last.current = t
      const dt = Math.min(2.5, (t - last.current) / 16.67)
      last.current = t

      // Dino vertical motion.
      vel.current -= GRAVITY * dt
      dinoY.current = Math.max(0, dinoY.current + vel.current * dt)
      if (dinoY.current === 0) vel.current = 0

      // Move + spawn obstacles.
      speed.current += 0.0015 * dt
      distance.current += speed.current * dt
      obstacles.current = obstacles.current
        .map((o) => ({ ...o, x: o.x - speed.current * dt }))
        .filter((o) => o.x + o.w > -5)

      const lastObs = obstacles.current[obstacles.current.length - 1]
      if (!lastObs || lastObs.x < FIELD_W - (120 + Math.random() * 120)) {
        obstacles.current.push({ x: FIELD_W, h: 18 + Math.random() * 20, w: 12 + Math.random() * 10 })
      }

      // Collision test (AABB).
      const dinoTop = FIELD_H - DINO_SIZE - dinoY.current
      const dinoBottom = FIELD_H - dinoY.current
      for (const o of obstacles.current) {
        const oLeft = o.x
        const oRight = o.x + o.w
        const oTop = FIELD_H - o.h
        if (DINO_X + DINO_SIZE > oLeft && DINO_X < oRight && dinoBottom > oTop && dinoTop < FIELD_H) {
          setOver(true)
          setRunning(false)
          setBest((b) => Math.max(b, Math.floor(distance.current / 10)))
          return
        }
      }

      setScore(Math.floor(distance.current / 10))
      setTick((n) => (n + 1) % 1000000)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      last.current = 0
    }
  }, [running, over])

  // Read refs during render (tick forces this to re-run each frame).
  void tick
  const dinoBottomPx = dinoY.current

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-2.5">
      <ScoreBar spec={spec} items={[{ label: 'Score', value: score }, { label: 'Best', value: best }]} />

      <div
        className="relative w-full cursor-pointer select-none overflow-hidden rounded-xl"
        style={{ aspectRatio: `${FIELD_W} / ${FIELD_H}`, backgroundColor: p.surface, border: `1px solid ${p.border}` }}
        onPointerDown={(e) => {
          e.preventDefault()
          if (over) reset()
          else jump()
        }}
      >
        {/* Scaled play-field: internal px mapped to the responsive box. */}
        <div className="absolute inset-0" style={{ transformOrigin: 'top left' }}>
          <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} className="h-full w-full" preserveAspectRatio="none">
            {/* Ground line */}
            <line x1="0" y1={FIELD_H - 1} x2={FIELD_W} y2={FIELD_H - 1} stroke={p.border} strokeWidth="2" />
            {/* Dino */}
            <rect
              x={DINO_X}
              y={FIELD_H - DINO_SIZE - dinoBottomPx}
              width={DINO_SIZE}
              height={DINO_SIZE}
              rx="4"
              fill={p.accent}
            />
            <rect x={DINO_X + DINO_SIZE - 7} y={FIELD_H - DINO_SIZE - dinoBottomPx + 4} width="3" height="3" fill={p.accentText} />
            {/* Obstacles (cacti) */}
            {obstacles.current.map((o, i) => (
              <rect key={i} x={o.x} y={FIELD_H - o.h} width={o.w} height={o.h} rx="2" fill="#f43f5e" />
            ))}
          </svg>
        </div>

        {!running && !over && (
          <Overlay spec={spec} title="Dino Run" hint="Space / ↑ / tap to jump the cacti. It only gets faster." onAction={reset} actionLabel="Play" />
        )}
        {over && (
          <Overlay spec={spec} title="Crashed" hint={`You ran ${score}m. Tap or Space to run again.`} onAction={reset} actionLabel="Retry" />
        )}
      </div>

      <ControlButton spec={spec} ariaLabel="Jump" onClick={() => (over ? reset() : jump())} className="h-11 w-full">
        <ChevronUp className="mr-1 h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wide">Jump</span>
      </ControlButton>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* PONG                                                                 */
/* ------------------------------------------------------------------ */

const PONG_W = 300
const PONG_H = 180
const PADDLE_H = 36
const PADDLE_W = 7
const BALL_R = 5

function PongGame({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [scoreP, setScoreP] = useState(0)
  const [scoreAI, setScoreAI] = useState(0)
  const [tick, setTick] = useState(0)

  const ballX = useRef(PONG_W / 2)
  const ballY = useRef(PONG_H / 2)
  const ballVX = useRef(3)
  const ballVY = useRef(2)
  const playerY = useRef(PONG_H / 2 - PADDLE_H / 2)
  const aiY = useRef(PONG_H / 2 - PADDLE_H / 2)
  const raf = useRef<number | null>(null)
  const last = useRef(0)
  const runningRef = useRef(false)
  runningRef.current = running

  const WIN_SCORE = 5

  const reset = useCallback(() => {
    ballX.current = PONG_W / 2
    ballY.current = PONG_H / 2
    ballVX.current = Math.random() > 0.5 ? 3 : -3
    ballVY.current = (Math.random() - 0.5) * 4
    playerY.current = PONG_H / 2 - PADDLE_H / 2
    aiY.current = PONG_H / 2 - PADDLE_H / 2
    setScoreP(0)
    setScoreAI(0)
    setOver(false)
    setRunning(true)
  }, [])

  const movePaddle = useCallback((dy: number) => {
    playerY.current = Math.max(0, Math.min(PONG_H - PADDLE_H, playerY.current + dy * 7))
  }, [])

  useGameKeys((k) => {
    if (k === 'ArrowUp' || k === 'w' || k === 'W') movePaddle(-1)
    else if (k === 'ArrowDown' || k === 's' || k === 'S') movePaddle(1)
    else if (k === ' ') {
      if (over) reset()
      else setRunning((r) => !r)
    }
  })

  useEffect(() => {
    if (!running || over) return
    const loop = (t: number) => {
      if (!last.current) last.current = t
      const dt = Math.min(2.5, (t - last.current) / 16.67)
      last.current = t

      ballX.current += ballVX.current * dt
      ballY.current += ballVY.current * dt

      if (ballY.current < BALL_R) { ballY.current = BALL_R; ballVY.current *= -1 }
      if (ballY.current > PONG_H - BALL_R) { ballY.current = PONG_H - BALL_R; ballVY.current *= -1 }

      // Player paddle (left)
      const px = 8
      if (ballX.current - BALL_R < px + PADDLE_W && ballX.current > px &&
          ballY.current > playerY.current - BALL_R && ballY.current < playerY.current + PADDLE_H + BALL_R && ballVX.current < 0) {
        ballVX.current = Math.abs(ballVX.current) * 1.05
        ballVY.current += (ballY.current - (playerY.current + PADDLE_H / 2)) * 0.15
      }

      // AI paddle (right)
      const ax = PONG_W - 8 - PADDLE_W
      if (ballX.current + BALL_R > ax && ballX.current < ax + PADDLE_W &&
          ballY.current > aiY.current - BALL_R && ballY.current < aiY.current + PADDLE_H + BALL_R && ballVX.current > 0) {
        ballVX.current = -Math.abs(ballVX.current) * 1.05
        ballVY.current += (ballY.current - (aiY.current + PADDLE_H / 2)) * 0.15
      }

      // AI follows ball
      const target = ballY.current - PADDLE_H / 2
      const diff = target - aiY.current
      aiY.current = Math.max(0, Math.min(PONG_H - PADDLE_H, aiY.current + Math.sign(diff) * Math.min(Math.abs(diff), 2.8 * dt)))

      // Score
      if (ballX.current < 0) {
        setScoreAI((s) => {
          const ns = s + 1
          if (ns >= WIN_SCORE) { setOver(true); setRunning(false) }
          return ns
        })
        ballX.current = PONG_W / 2
        ballY.current = PONG_H / 2
        ballVX.current = 3
        ballVY.current = (Math.random() - 0.5) * 4
      } else if (ballX.current > PONG_W) {
        setScoreP((s) => {
          const ns = s + 1
          if (ns >= WIN_SCORE) { setOver(true); setRunning(false) }
          return ns
        })
        ballX.current = PONG_W / 2
        ballY.current = PONG_H / 2
        ballVX.current = -3
        ballVY.current = (Math.random() - 0.5) * 4
      }

      setTick((n) => (n + 1) % 1000000)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      last.current = 0
    }
  }, [running, over])

  void tick

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-2.5">
      <ScoreBar spec={spec} items={[{ label: 'You', value: scoreP }, { label: 'AI', value: scoreAI }]} />

      <div
        className="relative w-full cursor-pointer select-none overflow-hidden rounded-xl"
        style={{ aspectRatio: `${PONG_W} / ${PONG_H}`, backgroundColor: p.surface, border: `1px solid ${p.border}` }}
      >
        <svg viewBox={`0 0 ${PONG_W} ${PONG_H}`} className="h-full w-full" preserveAspectRatio="none">
          <line x1={PONG_W / 2} y1="0" x2={PONG_W / 2} y2={PONG_H} stroke={p.border} strokeWidth="2" strokeDasharray="6 6" />
          <rect x={8} y={playerY.current} width={PADDLE_W} height={PADDLE_H} rx="3" fill={p.accent} />
          <rect x={PONG_W - 8 - PADDLE_W} y={aiY.current} width={PADDLE_W} height={PADDLE_H} rx="3" fill="#f43f5e" />
          <circle cx={ballX.current} cy={ballY.current} r={BALL_R} fill={p.text} />
        </svg>

        {!running && !over && (
          <Overlay spec={spec} title="Pong" hint="↑ ↓ or W/S to move your paddle (left). First to 5 wins." onAction={reset} actionLabel="Play" />
        )}
        {over && (
          <Overlay spec={spec} title={scoreP > scoreAI ? 'You Win!' : 'AI Wins'} hint={`${scoreP} – ${scoreAI}. Play again?`} onAction={reset} actionLabel="Retry" />
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <ControlButton spec={spec} ariaLabel="Up" onClick={() => movePaddle(-1)} className="h-10 flex-1"><ChevronUp className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Down" onClick={() => movePaddle(1)} className="h-10 flex-1"><ChevronDown className="h-4 w-4" /></ControlButton>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* BREAKOUT                                                             */
/* ------------------------------------------------------------------ */

const BR_W = 300
const BR_H = 200
const BR_PADDLE_W = 50
const BR_PADDLE_H = 7
const BR_BALL_R = 5
const BR_COLS = 7
const BR_ROWS = 4

function BreakoutGame({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [won, setWon] = useState(false)
  const [score, setScore] = useState(0)
  const [tick, setTick] = useState(0)

  const ballX = useRef(BR_W / 2)
  const ballY = useRef(BR_H - 30)
  const ballVX = useRef(2.5)
  const ballVY = useRef(-2.5)
  const paddleX = useRef(BR_W / 2 - BR_PADDLE_W / 2)
  const bricks = useRef<{ x: number; y: number; alive: boolean; hue: number }[]>([])
  const raf = useRef<number | null>(null)
  const last = useRef(0)
  const runningRef = useRef(false)
  runningRef.current = running

  const BRICK_W = (BR_W - 20) / BR_COLS
  const BRICK_H = 12
  const BRICK_TOP = 16

  const initBricks = () => {
    const arr: { x: number; y: number; alive: boolean; hue: number }[] = []
    for (let r = 0; r < BR_ROWS; r++) {
      for (let c = 0; c < BR_COLS; c++) {
        arr.push({ x: 10 + c * BRICK_W, y: BRICK_TOP + r * (BRICK_H + 3), alive: true, hue: (r * 60 + c * 30) % 360 })
      }
    }
    return arr
  }

  const reset = useCallback(() => {
    bricks.current = initBricks()
    ballX.current = BR_W / 2
    ballY.current = BR_H - 30
    ballVX.current = 2.5 * (Math.random() > 0.5 ? 1 : -1)
    ballVY.current = -2.5
    paddleX.current = BR_W / 2 - BR_PADDLE_W / 2
    setScore(0)
    setOver(false)
    setWon(false)
    setRunning(true)
  }, [])

  useGameKeys((k) => {
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') paddleX.current = Math.max(0, paddleX.current - 16)
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') paddleX.current = Math.min(BR_W - BR_PADDLE_W, paddleX.current + 16)
    else if (k === ' ') {
      if (over) reset()
      else setRunning((r) => !r)
    }
  })

  useEffect(() => {
    if (!running || over) return
    const loop = (t: number) => {
      if (!last.current) last.current = t
      const dt = Math.min(2.5, (t - last.current) / 16.67)
      last.current = t

      ballX.current += ballVX.current * dt
      ballY.current += ballVY.current * dt

      if (ballX.current < BR_BALL_R) { ballX.current = BR_BALL_R; ballVX.current *= -1 }
      if (ballX.current > BR_W - BR_BALL_R) { ballX.current = BR_W - BR_BALL_R; ballVX.current *= -1 }
      if (ballY.current < BR_BALL_R) { ballY.current = BR_BALL_R; ballVY.current *= -1 }

      // Paddle collision
      if (ballY.current + BR_BALL_R > BR_H - BR_PADDLE_H - 2 &&
          ballX.current > paddleX.current && ballX.current < paddleX.current + BR_PADDLE_W && ballVY.current > 0) {
        ballVY.current = -Math.abs(ballVY.current)
        ballVX.current += (ballX.current - (paddleX.current + BR_PADDLE_W / 2)) * 0.1
      }

      // Brick collision
      for (const b of bricks.current) {
        if (!b.alive) continue
        if (ballX.current > b.x && ballX.current < b.x + BRICK_W &&
            ballY.current > b.y && ballY.current < b.y + BRICK_H) {
          b.alive = false
          ballVY.current *= -1
          setScore((s) => s + 10)
          break
        }
      }

      // Ball falls below
      if (ballY.current > BR_H) {
        setOver(true)
        setRunning(false)
      }

      // All bricks cleared
      if (bricks.current.every((b) => !b.alive)) {
        setWon(true)
        setOver(true)
        setRunning(false)
      }

      setTick((n) => (n + 1) % 1000000)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      last.current = 0
    }
  }, [running, over])

  void tick

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-2.5">
      <ScoreBar spec={spec} items={[{ label: 'Score', value: score }, { label: 'Bricks', value: bricks.current.filter((b) => b.alive).length }]} />

      <div
        className="relative w-full cursor-pointer select-none overflow-hidden rounded-xl"
        style={{ aspectRatio: `${BR_W} / ${BR_H}`, backgroundColor: p.surface, border: `1px solid ${p.border}` }}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          paddleX.current = Math.max(0, Math.min(BR_W - BR_PADDLE_W, ratio * BR_W - BR_PADDLE_W / 2))
        }}
      >
        <svg viewBox={`0 0 ${BR_W} ${BR_H}`} className="h-full w-full" preserveAspectRatio="none">
          {bricks.current.map((b, i) =>
            b.alive ? (
              <rect key={i} x={b.x} y={b.y} width={BRICK_W - 2} height={BRICK_H} rx="2" fill={`hsl(${b.hue} 60% 55%)`} />
            ) : null,
          )}
          <rect x={paddleX.current} y={BR_H - BR_PADDLE_H - 2} width={BR_PADDLE_W} height={BR_PADDLE_H} rx="3" fill={p.accent} />
          <circle cx={ballX.current} cy={ballY.current} r={BR_BALL_R} fill={p.text} />
        </svg>

        {!running && !over && (
          <Overlay spec={spec} title="Breakout" hint="← → or move mouse to slide the paddle. Break all the bricks." onAction={reset} actionLabel="Play" />
        )}
        {over && (
          <Overlay spec={spec} title={won ? 'Cleared!' : 'Game Over'} hint={won ? `Perfect — ${score} points!` : `You scored ${score}. Try again?`} onAction={reset} actionLabel="Retry" />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* FLAPPY                                                               */
/* ------------------------------------------------------------------ */

const FL_W = 300
const FL_H = 200
const FL_PIPE_W = 36
const FL_GAP = 60
const FL_BIRD_X = 60
const FL_BIRD_R = 9

function FlappyGame({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [tick, setTick] = useState(0)

  const birdY = useRef(FL_H / 2)
  const vel = useRef(0)
  const pipes = useRef<{ x: number; gapY: number; passed: boolean }[]>([])
  const speed = useRef(2)
  const raf = useRef<number | null>(null)
  const last = useRef(0)
  const runningRef = useRef(false)
  const overRef = useRef(false)
  runningRef.current = running
  overRef.current = over

  const GRAVITY = 0.35
  const FLAP_V = 6

  const flap = useCallback(() => {
    if (overRef.current) return
    if (!runningRef.current) { setRunning(true); return }
    vel.current = FLAP_V
  }, [])

  const reset = useCallback(() => {
    birdY.current = FL_H / 2
    vel.current = 0
    pipes.current = [{ x: FL_W + 20, gapY: 40 + Math.random() * (FL_H - FL_GAP - 80), passed: false }]
    speed.current = 2
    setScore(0)
    setOver(false)
    setRunning(true)
  }, [])

  useGameKeys((k) => {
    if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
      if (overRef.current) reset()
      else flap()
    }
  })

  useEffect(() => {
    if (!running || over) return
    const loop = (t: number) => {
      if (!last.current) last.current = t
      const dt = Math.min(2.5, (t - last.current) / 16.67)
      last.current = t

      vel.current -= GRAVITY * dt
      birdY.current += vel.current * dt

      // Move pipes
      pipes.current = pipes.current
        .map((pp) => ({ ...pp, x: pp.x - speed.current * dt }))
      // Spawn
      const lastPipe = pipes.current[pipes.current.length - 1]
      if (!lastPipe || lastPipe.x < FL_W - 140) {
        pipes.current.push({ x: FL_W, gapY: 40 + Math.random() * (FL_H - FL_GAP - 80), passed: false })
      }
      // Score + cleanup
      pipes.current = pipes.current.filter((pp) => {
        if (!pp.passed && pp.x + FL_PIPE_W < FL_BIRD_X) {
          pp.passed = true
          setScore((s) => s + 1)
        }
        return pp.x + FL_PIPE_W > -5
      })

      speed.current += 0.002 * dt

      // Collision
      if (birdY.current < FL_BIRD_R || birdY.current > FL_H - FL_BIRD_R) {
        setOver(true)
        setRunning(false)
        setBest((b) => Math.max(b, score))
        return
      }
      for (const pp of pipes.current) {
        if (FL_BIRD_X + FL_BIRD_R > pp.x && FL_BIRD_X - FL_BIRD_R < pp.x + FL_PIPE_W) {
          if (birdY.current - FL_BIRD_R < pp.gapY || birdY.current + FL_BIRD_R > pp.gapY + FL_GAP) {
            setOver(true)
            setRunning(false)
            setBest((b) => Math.max(b, score))
            return
          }
        }
      }

      setTick((n) => (n + 1) % 1000000)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      last.current = 0
    }
  }, [running, over, score])

  void tick

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-2.5">
      <ScoreBar spec={spec} items={[{ label: 'Score', value: score }, { label: 'Best', value: best }]} />

      <div
        className="relative w-full cursor-pointer select-none overflow-hidden rounded-xl"
        style={{ aspectRatio: `${FL_W} / ${FL_H}`, backgroundColor: p.surface, border: `1px solid ${p.border}` }}
        onPointerDown={(e) => { e.preventDefault(); if (over) reset(); else flap() }}
      >
        <svg viewBox={`0 0 ${FL_W} ${FL_H}`} className="h-full w-full" preserveAspectRatio="none">
          {pipes.current.map((pp, i) => (
            <g key={i}>
              <rect x={pp.x} y={0} width={FL_PIPE_W} height={pp.gapY} rx="3" fill={p.accent} />
              <rect x={pp.x} y={pp.gapY + FL_GAP} width={FL_PIPE_W} height={FL_H - pp.gapY - FL_GAP} rx="3" fill={p.accent} />
            </g>
          ))}
          <circle cx={FL_BIRD_X} cy={birdY.current} r={FL_BIRD_R} fill="#facc15" stroke="#1a1a2e" strokeWidth="1.5" />
          <circle cx={FL_BIRD_X + 3} cy={birdY.current - 2} r="2" fill="#1a1a2e" />
        </svg>

        {!running && !over && (
          <Overlay spec={spec} title="Flappy Dot" hint="Space / ↑ / tap to flap. Dodge the pipes." onAction={reset} actionLabel="Play" />
        )}
        {over && (
          <Overlay spec={spec} title="Crashed" hint={`Score ${score} · Best ${best}. Tap to retry.`} onAction={reset} actionLabel="Retry" />
        )}
      </div>

      <ControlButton spec={spec} ariaLabel="Flap" onClick={() => (over ? reset() : flap())} className="h-11 w-full">
        <ChevronUp className="mr-1 h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wide">Flap</span>
      </ControlButton>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2048                                                                 */
/* ------------------------------------------------------------------ */

const G2048_SIZE = 4

type Tile = { value: number; id: number; row: number; col: number; merged?: boolean }

function Game2048({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [tiles, setTiles] = useState<Tile[]>([])
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [over, setOver] = useState(false)
  const [won, setWon] = useState(false)
  const idRef = useRef(0)

  const newId = () => ++idRef.current

  const addRandom = useCallback((board: Tile[]): Tile[] => {
    const occupied = new Set(board.map((t) => `${t.row},${t.col}`))
    const empty: { row: number; col: number }[] = []
    for (let r = 0; r < G2048_SIZE; r++) {
      for (let c = 0; c < G2048_SIZE; c++) {
        if (!occupied.has(`${r},${c}`)) empty.push({ row: r, col: c })
      }
    }
    if (empty.length === 0) return board
    const spot = empty[Math.floor(Math.random() * empty.length)]
    return [...board, { value: Math.random() < 0.9 ? 2 : 4, id: newId(), row: spot.row, col: spot.col }]
  }, [])

  const reset = useCallback(() => {
    idRef.current = 0
    let b: Tile[] = []
    b = addRandom(b)
    b = addRandom(b)
    setTiles(b)
    setScore(0)
    setOver(false)
    setWon(false)
  }, [addRandom])

  useEffect(() => { reset() }, [reset])

  const getGrid = (board: Tile[]): (Tile | null)[][] => {
    const g: (Tile | null)[][] = Array.from({ length: G2048_SIZE }, () => Array(G2048_SIZE).fill(null))
    for (const t of board) g[t.row][t.col] = t
    return g
  }

  const slide = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (over) return
    setTiles((board) => {
      const grid = getGrid(board)
      let moved = false
      let gained = 0
      let hit2048 = false

      const newGrid: (Tile | null)[][] = Array.from({ length: G2048_SIZE }, () => Array(G2048_SIZE).fill(null))

      const lines: Tile[][] = []
      for (let i = 0; i < G2048_SIZE; i++) {
        const line: Tile[] = []
        for (let j = 0; j < G2048_SIZE; j++) {
          let r: number, c: number
          if (dir === 'left') { r = i; c = j }
          else if (dir === 'right') { r = i; c = G2048_SIZE - 1 - j }
          else if (dir === 'up') { r = j; c = i }
          else { r = G2048_SIZE - 1 - j; c = i }
          if (grid[r][c]) line.push(grid[r][c]!)
        }
        lines.push(line)
      }

      for (let i = 0; i < G2048_SIZE; i++) {
        const line = lines[i]
        const merged: (Tile | null)[] = []
        let k = 0
        while (k < line.length) {
          if (k + 1 < line.length && line[k].value === line[k + 1].value) {
            const nv = line[k].value * 2
            if (nv === 2048) hit2048 = true
            gained += nv
            merged.push({ value: nv, id: newId(), row: 0, col: 0, merged: true })
            k += 2
          } else {
            merged.push({ ...line[k], merged: false })
            k++
          }
        }
        for (let j = 0; j < merged.length; j++) {
          let r: number, c: number
          if (dir === 'left') { r = i; c = j }
          else if (dir === 'right') { r = i; c = G2048_SIZE - 1 - j }
          else if (dir === 'up') { r = j; c = i }
          else { r = G2048_SIZE - 1 - j; c = i }
          const oldTile = grid[dir === 'left' || dir === 'right' ? i : dir === 'up' ? j : G2048_SIZE - 1 - j]?.[dir === 'left' ? j : dir === 'right' ? G2048_SIZE - 1 - j : i]
          if (oldTile !== merged[j] && (oldTile?.row !== r || oldTile?.col !== c)) moved = true
          newGrid[r][c] = { ...merged[j]!, row: r, col: c }
        }
      }

      // Check if anything moved
      const oldPositions = new Set(board.map((t) => `${t.row},${t.col},${t.value}`))
      const newTiles: Tile[] = []
      for (let r = 0; r < G2048_SIZE; r++) {
        for (let c = 0; c < G2048_SIZE; c++) {
          if (newGrid[r][c]) newTiles.push(newGrid[r][c]!)
        }
      }
      const newPositions = new Set(newTiles.map((t) => `${t.row},${t.col},${t.value}`))
      if (oldPositions.size === newPositions.size) {
        let same = true
        for (const k of oldPositions) { if (!newPositions.has(k)) { same = false; break } }
        if (same && !hit2048) return board
      }

      moved = true
      if (gained > 0) {
        setScore((s) => { const ns = s + gained; setBest((b) => Math.max(b, ns)); return ns })
      }
      if (hit2048) setWon(true)

      let result = addRandom(newTiles)

      // Check game over
      const checkGrid = getGrid(result)
      let canMove = false
      for (let r = 0; r < G2048_SIZE && !canMove; r++) {
        for (let c = 0; c < G2048_SIZE && !canMove; c++) {
          if (!checkGrid[r][c]) canMove = true
          else {
            if (c + 1 < G2048_SIZE && checkGrid[r][c + 1] && checkGrid[r][c]!.value === checkGrid[r][c + 1]!.value) canMove = true
            if (r + 1 < G2048_SIZE && checkGrid[r + 1][c] && checkGrid[r][c]!.value === checkGrid[r + 1][c]!.value) canMove = true
          }
        }
      }
      if (!canMove) setOver(true)

      return result
    })
  }, [addRandom, over])

  useGameKeys((k) => {
    if (k === 'ArrowUp' || k === 'w' || k === 'W') slide('up')
    else if (k === 'ArrowDown' || k === 's' || k === 'S') slide('down')
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') slide('left')
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') slide('right')
  })

  const TILE_COLORS: Record<number, string> = {
    2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563',
    32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61',
    512: '#edc850', 1024: '#edc53f', 2048: '#edc22e',
  }

  return (
    <div className="flex w-full max-w-[280px] flex-col gap-2.5">
      <ScoreBar spec={spec} items={[{ label: 'Score', value: score }, { label: 'Best', value: best }]} />

      <div className="relative">
        <div
          className="grid gap-1.5 rounded-xl p-2"
          style={{
            gridTemplateColumns: `repeat(${G2048_SIZE}, 1fr)`,
            backgroundColor: p.surface,
            border: `1px solid ${p.border}`,
            aspectRatio: '1',
          }}
        >
          {Array.from({ length: G2048_SIZE * G2048_SIZE }).map((_, i) => {
            const r = Math.floor(i / G2048_SIZE)
            const c = i % G2048_SIZE
            const tile = tiles.find((t) => t.row === r && t.col === c)
            const bg = tile ? TILE_COLORS[tile.value] || '#edc22e' : 'rgba(255,255,255,0.05)'
            const tc = tile && tile.value <= 4 ? '#776e65' : '#fff'
            return (
              <div
                key={i}
                className="flex items-center justify-center rounded-lg text-[11px] font-black"
                style={{ backgroundColor: bg, color: tc, fontSize: tile && tile.value >= 1024 ? '13px' : '15px' }}
              >
                {tile ? tile.value : ''}
              </div>
            )
          })}
        </div>

        {over && (
          <Overlay spec={spec} title="Game Over" hint={`Score ${score}. Swipe or arrows to play again.`} onAction={reset} actionLabel="Retry" />
        )}
        {won && !over && (
          <Overlay spec={spec} title="2048!" hint={`You reached 2048! Keep going or reset.`} onAction={() => setWon(false)} actionLabel="Continue" />
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <ControlButton spec={spec} ariaLabel="Left" onClick={() => slide('left')} className="h-10 flex-1"><ChevronLeft className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Up" onClick={() => slide('up')} className="h-10 flex-1"><ChevronUp className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Down" onClick={() => slide('down')} className="h-10 flex-1"><ChevronDown className="h-4 w-4" /></ControlButton>
        <ControlButton spec={spec} ariaLabel="Right" onClick={() => slide('right')} className="h-10 flex-1"><ChevronRight className="h-4 w-4" /></ControlButton>
      </div>
      <button
        onClick={reset}
        className="rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wide"
        style={{ backgroundColor: p.surface, color: p.muted, border: `1px solid ${p.border}` }}
      >
        New Game
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* MEMORY                                                               */
/* ------------------------------------------------------------------ */

const MEM_EMOJIS = ['🎮', '🚀', '⭐', '🎯', '🔥', '💡', '🎨', '⚡']

function MemoryGame({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)

  const reset = useCallback(() => {
    const deck = [...MEM_EMOJIS, ...MEM_EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
    setCards(deck)
    setFlipped([])
    setMoves(0)
    setOver(false)
    setBusy(false)
  }, [])

  useEffect(() => { reset() }, [reset])

  const flip = (id: number) => {
    if (busy || over) return
    const card = cards.find((c) => c.id === id)
    if (!card || card.flipped || card.matched) return

    const newFlipped = [...flipped, id]
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, flipped: true } : c)))
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setBusy(true)
      setMoves((m) => m + 1)
      const [a, b] = newFlipped
      const ca = cards.find((c) => c.id === a)
      const cb = cards.find((c) => c.id === b)
      if (ca && cb && ca.emoji === cb.emoji) {
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c)))
          setFlipped([])
          setBusy(false)
          setCards((cs) => {
            if (cs.every((c) => c.matched)) setOver(true)
            return cs
          })
        }, 400)
      } else {
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c)))
          setFlipped([])
          setBusy(false)
        }, 800)
      }
    }
  }

  const matchedCount = cards.filter((c) => c.matched).length / 2

  return (
    <div className="flex w-full max-w-[300px] flex-col gap-2.5">
      <ScoreBar spec={spec} items={[{ label: 'Moves', value: moves }, { label: 'Pairs', value: `${matchedCount}/${MEM_EMOJIS.length}` }]} />

      <div className="relative">
        <div
          className="grid grid-cols-4 gap-1.5 rounded-xl p-2"
          style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
        >
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              disabled={card.matched || card.flipped || busy}
              className="flex aspect-square items-center justify-center rounded-lg text-xl transition-all"
              style={{
                backgroundColor: card.matched ? p.accent : card.flipped ? p.bg : p.surface,
                border: `1px solid ${p.border}`,
                opacity: card.matched ? 0.7 : 1,
              }}
            >
              {card.flipped || card.matched ? card.emoji : ''}
            </button>
          ))}
        </div>

        {over && (
          <Overlay spec={spec} title="Perfect!" hint={`All pairs found in ${moves} moves.`} onAction={reset} actionLabel="Play Again" />
        )}
      </div>

      <button
        onClick={reset}
        className="rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wide"
        style={{ backgroundColor: p.surface, color: p.muted, border: `1px solid ${p.border}` }}
      >
        New Game
      </button>
    </div>
  )
}
