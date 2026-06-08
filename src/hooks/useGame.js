import { useCallback, useEffect, useRef, useState } from 'react'
import { createBoard, move, spawnTile, canMove, hasWon } from '../game/gameLogic'
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

/**
 * 2048 게임 상태와 입력 처리를 담당하는 훅.
 * 키보드(화살표/WASD)와 터치 스와이프를 모두 지원한다.
 */
export function useGame() {
  const { size, target, bestScore, setBestScore } = useSettings()
  const [board, setBoard] = useState(() => createBoard(size))
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState('playing') // 'playing' | 'won' | 'lost'

  const restart = useCallback(() => {
    setBoard(createBoard(size))
    setScore(0)
    setStatus('playing')
  }, [size])

  // 보드 크기가 바뀌면 새 게임을 시작한다.
  useEffect(() => {
    restart()
  }, [size, restart])

  const applyMove = useCallback(
    (direction) => {
      if (status !== 'playing') return
      setBoard((prev) => {
        const { board: moved, gained, moved: didMove } = move(prev, direction)
        if (!didMove) return prev

        const next = spawnTile(moved)
        if (gained > 0) {
          setScore((s) => {
            const ns = s + gained
            setBestScore(ns)
            return ns
          })
        }

        if (hasWon(next, target)) {
          setStatus('won')
        } else if (!canMove(next)) {
          setStatus('lost')
        }
        return next
      })
    },
    [status, target, setBestScore]
  )

  // 키보드 입력 처리
  useEffect(() => {
    const onKeyDown = (e) => {
      const dir = KEY_TO_DIR[e.key]
      if (!dir) return
      e.preventDefault()
      applyMove(dir)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [applyMove])

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
      if (absX > absY) {
        applyMove(dx > 0 ? 'right' : 'left')
      } else {
        applyMove(dy > 0 ? 'down' : 'up')
      }
    },
    [applyMove]
  )

  return {
    board,
    score,
    bestScore,
    status,
    restart,
    move: applyMove,
    touchHandlers: { onTouchStart, onTouchEnd },
  }
}
