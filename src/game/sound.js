// Web Audio API로 간단한 효과음을 생성한다 (음원 파일 없이).
// AudioContext는 첫 사용자 입력(키/터치) 시점에 lazy 생성되어 자동재생 정책을 만족한다.

let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    try {
      ctx = new AudioCtx()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function beep({ freq = 440, dur = 0.08, type = 'sine', gain = 0.06, slideTo = null, when = 0 }) {
  const c = getCtx()
  if (!c) return
  const t0 = c.currentTime + when
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function arpeggio(notes) {
  notes.forEach((f, i) =>
    beep({ freq: f, dur: 0.16, type: 'sine', gain: 0.06, when: i * 0.1 })
  )
}

/** 이름으로 효과음을 재생한다. 호출 측에서 사운드 on/off를 판단한다. */
export function playSound(name) {
  switch (name) {
    case 'move':
      return beep({ freq: 200, dur: 0.05, type: 'triangle', gain: 0.03 })
    case 'merge':
      return beep({ freq: 380, slideTo: 620, dur: 0.12, type: 'sine', gain: 0.06 })
    case 'undo':
      return beep({ freq: 500, slideTo: 300, dur: 0.12, type: 'triangle', gain: 0.05 })
    case 'win':
      return arpeggio([523, 659, 784, 1047])
    case 'lose':
      return beep({ freq: 320, slideTo: 110, dur: 0.45, type: 'sawtooth', gain: 0.05 })
    default:
      return undefined
  }
}
