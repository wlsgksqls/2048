import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'testq-2048-settings'

const DEFAULT_SETTINGS = {
  size: 4, // 보드 크기 (3 | 4 | 5)
  theme: 'light', // 'light' | 'dark'
  target: 2048, // 승리 목표값
  sound: true, // 효과음 on/off
  undoEnabled: false, // 간고등어 모드: 실행취소(되돌리기) 허용 여부
  bestScore: 0,
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings)

  // 설정 변경 시 localStorage에 영속한다.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // 저장 실패는 무시 (프라이빗 모드 등)
    }
  }, [settings])

  // 테마를 루트 엘리먼트에 반영한다.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  const update = (patch) => setSettings((prev) => ({ ...prev, ...patch }))

  const setBestScore = (score) =>
    setSettings((prev) =>
      score > prev.bestScore ? { ...prev, bestScore: score } : prev
    )

  const resetBestScore = () => update({ bestScore: 0 })

  const value = { ...settings, update, setBestScore, resetBestScore }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
