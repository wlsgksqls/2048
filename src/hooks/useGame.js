import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createTiles,
  spawnRandomTile,
  moveTiles,
  canMoveTiles,
  hasWonTiles,
} from '../game/gameLogic'
import { playSound } from '../game/sound'
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

/**
 * 2048 게임 상태와 입력 처리를 담당하는 훅.
 * - 키보드(화살표/WASD) + 터치 스와이프
 * - 효과음(설정 연동)
 * - 실행취소: 설정의 간고등어 모드(undoEnabled)가 켜져 있을 때만 사용 가능
 */
export function useGame() {
  const { size, target, sound, undoEnabled, setBestScore } = useSettings()
  const [tiles, setTiles] = useState(() => createTiles(size))
  const [removed, setRemoved] = useState([]) // 머지로 사라지는 타일 (애니메이션용)
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState('playing') // 'playing' | 'won' | 'lost'
  const [canUndo, setCanUndo] = useState(false)

  const historyRef = useRef([]) // [{ tiles, score }]
  // 최신 상태를 동기적으로 읽기 위한 ref (빠른 연속 입력 대응)
  const ref = useRef({ tiles, score, status })
  ref.current = { tiles, score, status }

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

  const applyMove = useCallback(
    (direction) => {
      const cur = ref.current
      if (cur.status !== 'playing') return

      const res = moveTiles(cur.tiles, size, direction)
      if (!res.moved) return

      // 실행취소용 스냅샷 (이동 전 상태)
      historyRef.current = [
        ...historyRef.current.slice(-(HISTORY_LIMIT - 1)),
        { tiles: cur.tiles, score: cur.score },
      ]
      setCanUndo(true)

      const withNew = spawnRandomTile(res.tiles, size)
      const newScore = cur.score + res.gained
      let newStatus = 'playing'
      if (hasWonTiles(withNew, target)) newStatus = 'won'
      else if (!canMoveTiles(withNew, size)) newStatus = 'lost'

      setTiles(withNew)
      setRemoved(res.removed)
      setScore(newScore)
      setStatus(newStatus)
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
    if (!undoEnabled) return
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
    restart,
    undo,
    move: applyMove,
    touchHandlers: { onTouchStart, onTouchEnd },
  }
}
