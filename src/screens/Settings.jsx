import { useSettings } from '../context/SettingsContext'

const SIZES = [3, 4, 5]
const THEMES = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
]
const TARGETS = [256, 512, 1024, 2048, 4096]

export default function Settings({ onNavigate }) {
  const { size, theme, target, update, resetBestScore, bestScore } = useSettings()

  return (
    <div className="screen settings">
      <header className="settings-header">
        <button className="btn btn-ghost" onClick={() => onNavigate('lobby')}>
          ← 로비
        </button>
        <h1>설정</h1>
        <span className="spacer" />
      </header>

      <div className="setting-group">
        <label className="setting-label">보드 크기</label>
        <div className="option-row">
          {SIZES.map((s) => (
            <button
              key={s}
              className={`chip ${size === s ? 'chip-active' : ''}`}
              onClick={() => update({ size: s })}
            >
              {s}×{s}
            </button>
          ))}
        </div>
        <p className="setting-hint">크기를 바꾸면 새 게임이 시작됩니다.</p>
      </div>

      <div className="setting-group">
        <label className="setting-label">테마</label>
        <div className="option-row">
          {THEMES.map((t) => (
            <button
              key={t.value}
              className={`chip ${theme === t.value ? 'chip-active' : ''}`}
              onClick={() => update({ theme: t.value })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">승리 목표값</label>
        <div className="option-row">
          {TARGETS.map((t) => (
            <button
              key={t}
              className={`chip ${target === t ? 'chip-active' : ''}`}
              onClick={() => update({ target: t })}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">최고 점수</label>
        <div className="option-row best-reset">
          <span className="best-value">{bestScore}</span>
          <button className="btn btn-danger" onClick={resetBestScore}>
            초기화
          </button>
        </div>
      </div>
    </div>
  )
}
