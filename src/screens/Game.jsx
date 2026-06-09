import { useEffect, useState } from 'react'
import { useSettings } from '../context/SettingsContext'
import { useGame } from '../hooks/useGame'

const GAP = 2.5 // 보드 너비 대비 칸 간격(%)

// 보드 너비를 100%로 보고 각 칸의 크기/위치를 백분율로 계산 → 반응형 유지.
function cellSize(size) {
  return (100 - (size + 1) * GAP) / size
}
function pos(index, size) {
  return GAP + index * (cellSize(size) + GAP)
}
function tileStyle(row, col, size) {
  const s = cellSize(size)
  return {
    left: `${pos(col, size)}%`,
    top: `${pos(row, size)}%`,
    width: `${s}%`,
    height: `${s}%`,
  }
}

function tileValueClass(value) {
  if (value > 2048) return 'tile-super'
  return `tile-${value}`
}

export default function Game({ onNavigate }) {
  const { bestScore } = useSettings()
  const {
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
    touchHandlers,
  } = useGame()

  // 폭발 연출: 보드의 숫자들이 물리(초기 속도 + 중력 + 회전)로 날아간다.
  const [flyers, setFlyers] = useState([])
  useEffect(() => {
    if (easterEgg !== 'boom') return
    const cell = cellSize(size)
    let parts = tiles.map((t) => ({
      id: t.id,
      value: t.value,
      x: pos(t.col, size),
      y: pos(t.row, size),
      vx: (Math.random() * 2 - 1) * 3.4, // 좌우 초기 속도
      vy: -(3 + Math.random() * 5), // 위로 솟구침
      rot: 0,
      vrot: (Math.random() * 2 - 1) * 26, // 회전 속도
      cell,
    }))
    setFlyers(parts)
    let raf
    const GRAVITY = 0.5
    const tick = () => {
      parts = parts.map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + GRAVITY,
        rot: p.rot + p.vrot,
      }))
      setFlyers(parts)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      setFlyers([])
    }
  }, [easterEgg, size, tiles])

  const backgroundCells = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      backgroundCells.push(
        <div key={`bg-${r}-${c}`} className="grid-cell" style={tileStyle(r, c, size)} />
      )
    }
  }

  // 사라지는 타일도 같은 key(id)로 렌더 → 목적지로 슬라이드한 뒤 제거된다.
  const allTiles = [...tiles, ...removed]

  return (
    <div className="screen game">
      <header className="game-header">
        <button className="btn btn-ghost" onClick={() => onNavigate('lobby')}>
          ← 로비
        </button>
        <div className="scores">
          <div className="score-box">
            <span className="label">점수</span>
            <span className="value">{score}</span>
          </div>
          <div className="score-box">
            <span className="label">최고</span>
            <span className="value">{bestScore}</span>
          </div>
        </div>
        <span className="spacer" />
      </header>

      <div className="game-controls">
        <button
          className={`btn btn-auto ${auto ? 'on' : ''}`}
          onClick={toggleAuto}
          aria-pressed={auto}
        >
          🤖 자동: {auto ? '켜짐' : '꺼짐'}
        </button>
        {undoEnabled && (
          <button className="btn btn-ghost" onClick={undo} disabled={!canUndo}>
            ↩ 실행취소
          </button>
        )}
        <button className="btn btn-ghost" onClick={restart}>
          ⟳ 다시하기
        </button>
      </div>

      <div className="board-wrap" {...touchHandlers}>
        <div className={`board${easterEgg === 'running' ? ' board-egg' : ''}`}>
          {backgroundCells}
          {easterEgg !== 'boom' &&
            allTiles.map((t) => (
              <div
                key={t.id}
                className={`tile ${tileValueClass(t.value)}${t.isNew ? ' is-new' : ''}${
                  t.justMerged ? ' is-merged' : ''
                }`}
                style={tileStyle(t.row, t.col, size)}
              >
                {t.value}
              </div>
            ))}
          {easterEgg === 'boom' &&
            flyers.map((f) => (
              <div
                key={f.id}
                className={`tile flyer ${tileValueClass(f.value)}`}
                style={{
                  left: `${f.x}%`,
                  top: `${f.y}%`,
                  width: `${f.cell}%`,
                  height: `${f.cell}%`,
                  transform: `rotate(${f.rot}deg)`,
                }}
              >
                {f.value}
              </div>
            ))}
          {easterEgg === 'boom' && <div className="egg-flash" />}
        </div>

        {status !== 'playing' && easterEgg === 'idle' && (
          <div className="overlay">
            <div className="overlay-card">
              <h2>{status === 'won' ? '🎉 승리!' : '게임 오버'}</h2>
              <p>점수: {score}</p>
              <div className="overlay-actions">
                {status === 'lost' && undoEnabled && canUndo && (
                  <button className="btn" onClick={undo}>
                    ↩ 실행취소
                  </button>
                )}
                <button className="btn btn-primary" onClick={restart}>
                  다시하기
                </button>
                <button className="btn" onClick={() => onNavigate('lobby')}>
                  로비로
                </button>
              </div>
            </div>
          </div>
        )}

        {easterEgg === 'prompt' && (
          <div className="overlay">
            <div className="overlay-card">
              <h2>🥚 이스터에그 발견!</h2>
              <p>
                한 줄이 같은 숫자로 맞춰졌어요.
                <br />
                발동하면 10초간 숫자들이 미쳐 날뛰다가
                <br />
                💥 펑! 터지고 처음부터 다시 시작해요.
              </p>
              <div className="overlay-actions">
                <button className="btn btn-primary" onClick={runEasterEgg}>
                  발동!
                </button>
                <button className="btn" onClick={cancelEasterEgg}>
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {easterEgg === 'running' && (
          <div className="egg-banner">
            🥚 이스터에그 발동!! 숫자들이 미쳐 날뛴다… 💥 곧 펑!
          </div>
        )}
      </div>
    </div>
  )
}
