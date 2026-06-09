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
    restart,
    undo,
    toggleAuto,
    touchHandlers,
  } = useGame()

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
        <div className="board">
          {backgroundCells}
          {allTiles.map((t) => (
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
        </div>

        {status !== 'playing' && (
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
      </div>
    </div>
  )
}
