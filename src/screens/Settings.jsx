import { useSettings } from '../context/SettingsContext'

const SIZES = [3, 4, 5]
const THEMES = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
]
const TARGETS = [256, 512, 1024, 2048, 4096]

function Toggle({ on, onChange }) {
  return (
    <button
      className={`switch ${on ? 'on' : ''}`}
      onClick={onChange}
      aria-pressed={on}
      type="button"
    >
      <span className="knob" />
    </button>
  )
}

export default function Settings({ onNavigate }) {
  const { size, theme, target, sound, undoEnabled, update, resetBestScore, bestScore } =
    useSettings()

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
        <div className="toggle-row">
          <span className="setting-label inline">효과음</span>
          <Toggle on={sound} onChange={() => update({ sound: !sound })} />
        </div>
      </div>

      <div className="setting-group">
        <div className="toggle-row">
          <span className="setting-label inline">간고등어 모드 🐟</span>
          <Toggle on={undoEnabled} onChange={() => update({ undoEnabled: !undoEnabled })} />
        </div>
        <p className="setting-hint">
          켜면 게임에서 실행취소(되돌리기)를 쓸 수 있어요. (단축키 Z)
        </p>
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
