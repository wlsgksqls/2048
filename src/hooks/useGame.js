import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createTiles,
  spawnRandomTile,
  moveTiles,
  canMoveTiles,
  hasWonTiles,
  hasEasterEggLine,
} from '../game/gameLogic'
import { playSound } from '../game/sound'
import { chooseBestMove } from '../game/ai'
import { useSettings } from '../context/SettingsContext'

const KEY_TO_DIR = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  a: 'left',
  d: 'right',
  w: 'up',
  s: 'down',
}

const MOVE_ANIM_MS = 160 // 슬라이드 애니메이션 시간 (CSS와 동일)
const HISTORY_LIMIT = 50
const AUTO_INTERVAL_MS = 250 // Auto(AI) 한 수 간격 — 보통 속도
const EGG_CHAOS_MS = 140 // 이스터에그 카오스 한 틱 간격
const EGG_DURATION_MS = 10000 // 이스터에그 지속 시간(10초)
const EGG_BOOM_MS = 1400 // 폭발 연출 시간

/**
 * 2048 게임 상태와 입력 처리를 담당하는 훅.
 * - 키보드(화살표/WASD) + 터치 스와이프
 * - 효과음(설정 연동)
 * - 실행취소: 간고등어 모드(undoEnabled)가 켜져 있을 때만 사용 가능
 * - Auto: AI 자동 풀이
 * - 게임 오버: 더 이상 이동할 수 없으면 'lost'
 * - 이스터에그: 한 줄(가로/세로/대각선)이 같은 값으로 채워지면 발동
 */
export function useGame() {
  const { size, target, sound, undoEnabled, setBestScore } = useSettings()
  const [tiles, setTiles] = useState(() => createTiles(size))
  const [removed, setRemoved] = useState([]) // 머지로 사라지는 타일 (애니메이션용)
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState('playing') // 'playing' | 'won' | 'lost'
  const [canUndo, setCanUndo] = useState(false)
  const [auto, setAuto] = useState(false) // Auto: AI 자동 풀이 on/off
  const [easterEgg, setEasterEgg] = useState('idle') // 'idle' | 'running' | 'boom'

  const historyRef = useRef([]) // [{ tiles, score }]
  // 최신 상태를 동기적으로 읽기 위한 ref (빠른 연속 입력 대응)
  const ref = useRef({ tiles, score, status })
  ref.current = { tiles, score, status }
  // 이스터에그 진행 중에는 일반 입력을 막기 위한 ref
  const eggRef = useRef('idle')
  eggRef.current = easterEgg

  const restart = useCallback(() => {
    const t = createTiles(size)
    setTiles(t)
    setRemoved([])
    setScore(0)
    setStatus('playing')
    historyRef.current = []
    setCanUndo(false)
    ref.current = { tiles: t, score: 0, status: 'playing' }
  }, [size])

  // 보드 크기가 바뀌면 새 게임을 시작한다.
  useEffect(() => {
    restart()
  }, [size, restart])

  // 안전망: 어떤 경로로 보드가 채워졌든, 더 이상 이동할 수 없으면 게임 오버로 판정한다.
  // (입력 경로에 의존하지 않으므로 꽉 막힌 상태가 절대 누락되지 않는다.)
  useEffect(() => {
    if (status !== 'playing' || easterEgg !== 'idle') return
    if (!canMoveTiles(tiles, size)) {
      setStatus('lost')
      setAuto(false)
      ref.current = { ...ref.current, status: 'lost' }
      if (sound) playSound('lose')
    }
  }, [tiles, status, size, easterEgg, sound])

  const applyMove = useCallback(
    (direction) => {
      if (eggRef.current !== 'idle') return // 이스터에그 중에는 입력 무시
      const cur = ref.current
      if (cur.status !== 'playing') return

      const res = moveTiles(cur.tiles, size, direction)
      if (!res.moved) {
        // 이동이 없었더라도 보드가 막혀 있으면 게임 오버로 처리한다.
        // (꽉 찬 채로 더 이상 못 움직이는 상태에서 키를 눌렀을 때)
        if (!canMoveTiles(cur.tiles, size)) {
          setStatus('lost')
          setAuto(false)
          ref.current = { ...cur, status: 'lost' }
          if (sound) playSound('lose')
        }
        return
      }

      // 실행취소용 스냅샷 (이동 전 상태)
      historyRef.current = [
        ...historyRef.current.slice(-(HISTORY_LIMIT - 1)),
        { tiles: cur.tiles, score: cur.score },
      ]
      setCanUndo(true)

      const withNew = spawnRandomTile(res.tiles, size)
      const newScore = cur.score + res.gained

      // 이스터에그 우선 판정: 한 줄이 같은 값으로 채워지면, 사용자에게 발동 여부를 묻는다.
      // (이 동안에는 승리 목표값 판정도 하지 않는다.)
      if (hasEasterEggLine(withNew, size)) {
        setTiles(withNew)
        setRemoved(res.removed)
        setScore(newScore)
        if (newScore > 0) setBestScore(newScore)
        setStatus('playing')
        setAuto(false)
        ref.current = { tiles: withNew, score: newScore, status: 'playing' }
        setEasterEgg('prompt') // 확인 창 표시 (running은 사용자가 '발동'을 눌러야 시작)
        window.setTimeout(() => setRemoved([]), MOVE_ANIM_MS)
        return
      }

      let newStatus = 'playing'
      if (hasWonTiles(withNew, target)) newStatus = 'won'
      else if (!canMoveTiles(withNew, size)) newStatus = 'lost'

      setTiles(withNew)
      setRemoved(res.removed)
      setScore(newScore)
      setStatus(newStatus)
      if (newStatus !== 'playing') setAuto(false) // 게임오버/승리 시 Auto 정지
      if (newScore > 0) setBestScore(newScore)
      ref.current = { tiles: withNew, score: newScore, status: newStatus }

      if (sound) {
        if (res.gained > 0) playSound('merge')
        else playSound('move')
        if (newStatus === 'won') playSound('win')
        else if (newStatus === 'lost') playSound('lose')
      }

      // 애니메이션이 끝나면 사라진 타일을 제거한다.
      window.setTimeout(() => setRemoved([]), MOVE_ANIM_MS)
    },
    [size, target, sound, setBestScore]
  )

  const undo = useCallback(() => {
    if (!undoEnabled || eggRef.current !== 'idle') return
    const hist = historyRef.current
    if (hist.length === 0) return
    const prev = hist[hist.length - 1]
    historyRef.current = hist.slice(0, -1)
    setCanUndo(historyRef.current.length > 0)

    const restored = prev.tiles.map((t) => ({ ...t, isNew: false, justMerged: false }))
    setTiles(restored)
    setRemoved([])
    setScore(prev.score)
    setStatus('playing')
    ref.current = { tiles: restored, score: prev.score, status: 'playing' }
    if (sound) playSound('undo')
  }, [undoEnabled, sound])

  // 키보드 입력 처리
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.key === 'z' || e.key === 'Z') && undoEnabled) {
        e.preventDefault()
        undo()
        return
      }
      const dir = KEY_TO_DIR[e.key]
      if (!dir) return
      e.preventDefault()
      applyMove(dir)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [applyMove, undo, undoEnabled])

  const toggleAuto = useCallback(() => setAuto((a) => !a), [])

  // 이스터에그 확인 창에서 '발동' / '취소'
  const runEasterEgg = useCallback(() => {
    setEasterEgg((e) => (e === 'prompt' ? 'running' : e))
    if (sound) playSound('egg')
  }, [sound])
  const cancelEasterEgg = useCallback(() => {
    setEasterEgg((e) => (e === 'prompt' ? 'idle' : e))
  }, [])

  // Auto(AI) 자동 풀이 루프: 켜져 있고 진행 중일 때만 일정 간격으로 최선의 수를 둔다.
  useEffect(() => {
    if (!auto || status !== 'playing' || easterEgg !== 'idle') return
    const id = window.setInterval(() => {
      const cur = ref.current
      if (cur.status !== 'playing') return
      const dir = chooseBestMove(cur.tiles, size)
      if (dir) {
        applyMove(dir)
      } else {
        // 더 둘 수 없으면 Auto 정지 + 게임 오버 처리
        setAuto(false)
        if (!canMoveTiles(cur.tiles, size)) {
          setStatus('lost')
          ref.current = { ...cur, status: 'lost' }
          if (sound) playSound('lose')
        }
      }
    }, AUTO_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [auto, status, size, easterEgg, applyMove, sound])

  // 이스터에그 카오스: 10초 동안 숫자들이 제멋대로 합쳐진다.
  useEffect(() => {
    if (easterEgg !== 'running') return
    const dirs = ['up', 'down', 'left', 'right']
    const chaos = window.setInterval(() => {
      const curTiles = ref.current.tiles
      const dir = dirs[Math.floor(Math.random() * dirs.length)]
      // wild=true: 값과 무관하게 막 합쳐지고, 큰 값을 기준으로 한다.
      const res = moveTiles(curTiles, size, dir, true)
      const next = spawnRandomTile(res.moved ? res.tiles : curTiles, size)
      setTiles(next)
      setRemoved(res.moved ? res.removed : [])
      ref.current = { ...ref.current, tiles: next }
      if (sound && res.gained > 0) playSound('merge')
      window.setTimeout(() => setRemoved([]), MOVE_ANIM_MS)
    }, EGG_CHAOS_MS)

    const boom = window.setTimeout(() => {
      window.clearInterval(chaos)
      setEasterEgg('boom')
      if (sound) playSound('boom')
    }, EGG_DURATION_MS)

    return () => {
      window.clearInterval(chaos)
      window.clearTimeout(boom)
    }
  }, [easterEgg, size, sound])

  // 폭발(펑) 연출 후 처음부터 다시 시작.
  useEffect(() => {
    if (easterEgg !== 'boom') return
    const t = window.setTimeout(() => {
      restart()
      setEasterEgg('idle')
    }, EGG_BOOM_MS)
    return () => window.clearTimeout(t)
  }, [easterEgg, restart])

  // 터치 스와이프 처리
  const touchStart = useRef(null)
  const onTouchStart = useCallback((e) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onTouchEnd = useCallback(
    (e) => {
      if (!touchStart.current) return
      const t = e.changedTouches[0]
      const dx = t.clientX - touchStart.current.x
      const dy = t.clientY - touchStart.current.y
      touchStart.current = null
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      const THRESHOLD = 30
      if (Math.max(absX, absY) < THRESHOLD) return
      if (absX > absY) applyMove(dx > 0 ? 'right' : 'left')
      else applyMove(dy > 0 ? 'down' : 'up')
    },
    [applyMove]
  )

  return {
    tiles,
    removed,
    score,
    status,
    size,
    undoEnabled,
    canUndo,
    auto,
    easterEgg,
    restart,
    undo,
    toggleAuto,
    runEasterEgg,
    cancelEasterEgg,
    move: applyMove,
    touchHandlers: { onTouchStart, onTouchEnd },
  }
}
