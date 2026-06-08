import { useSettings } from '../context/SettingsContext'
import { useGame } from '../hooks/useGame'

function tileClass(value) {
  // 값별 색상 클래스. 2048 초과는 동일 클래스로 묶는다.
  if (value > 2048) return 'tile tile-super'
  return `tile tile-${value}`
}

export default function Game({ onNavigate }) {
  const { size } = useSettings()
  const { board, score, bestScore, status, restart, touchHandlers } = useGame()

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
        <button className="btn btn-ghost" onClick={restart}>
          다시하기
        </button>
      </header>

      <div className="board-wrap" {...touchHandlers}>
        <div
          className="board"
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {board.flatMap((row, r) =>
            row.map((value, c) => (
              <div key={`${r}-${c}`} className={value === 0 ? 'tile tile-empty' : tileClass(value)}>
                {value !== 0 ? value : ''}
              </div>
            ))
          )}
        </div>

        {status !== 'playing' && (
          <div className="overlay">
            <div className="overlay-card">
              <h2>{status === 'won' ? '🎉 승리!' : '게임 오버'}</h2>
              <p>점수: {score}</p>
              <div className="overlay-actions">
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
