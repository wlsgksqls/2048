import { useSettings } from '../context/SettingsContext'

export default function Lobby({ onNavigate }) {
  const { bestScore } = useSettings()

  return (
    <div className="screen lobby">
      <div className="logo">2048</div>
      <p className="tagline">타일을 합쳐 2048을 만들어 보세요!</p>

      <div className="best-badge">
        <span className="label">최고 점수</span>
        <span className="value">{bestScore}</span>
      </div>

      <div className="menu">
        <button className="btn btn-primary" onClick={() => onNavigate('game')}>
          게임 시작
        </button>
        <button className="btn" onClick={() => onNavigate('settings')}>
          설정
        </button>
      </div>

      <p className="hint">화살표 키 또는 WASD · 모바일은 스와이프</p>
    </div>
  )
}
