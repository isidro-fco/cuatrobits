// Sonido de la aplicación (sección 12.2). Los efectos y la música se sintetizan con Web Audio
// con ondas cuadradas y triangulares, al estilo de las consolas de 8 bits; no hay archivos de audio.
import { useSettingsStore } from '../stores/settingsStore'

export type SfxName =
  | 'select'
  | 'drop'
  | 'correct'
  | 'wrong'
  | 'flip'
  | 'match'
  | 'invalid'
  | 'win'
  | 'lose'
  | 'draw'
  | 'unlock'
  | 'levelUp'
  | 'buy'

interface Tone {
  /** Nota MIDI (60 = do central) */
  note: number
  /** Inicio y duración en segundos */
  at: number
  dur: number
  wave?: OscillatorType
  volume?: number
  /** Nota final de un deslizamiento */
  slideTo?: number
}

const seq = (notes: number[], step: number, wave: OscillatorType = 'square'): Tone[] =>
  notes.map((note, i) => ({ note, at: i * step, dur: step * 0.9, wave }))

const SFX: Record<SfxName, Tone[]> = {
  select: [{ note: 84, at: 0, dur: 0.05 }],
  drop: [{ note: 67, at: 0, dur: 0.12, wave: 'triangle', slideTo: 55, volume: 0.5 }],
  correct: seq([79, 84], 0.07),
  wrong: [{ note: 50, at: 0, dur: 0.2, slideTo: 45, volume: 0.6 }],
  flip: [{ note: 76, at: 0, dur: 0.04, wave: 'triangle' }],
  match: seq([76, 79, 84], 0.06),
  invalid: [{ note: 40, at: 0, dur: 0.12, volume: 0.5 }],
  win: seq([72, 76, 79, 84, 79, 84], 0.1),
  lose: seq([67, 64, 60, 55], 0.14, 'triangle'),
  draw: seq([72, 74, 72], 0.12, 'triangle'),
  unlock: seq([84, 88, 91, 96], 0.07),
  levelUp: [{ note: 60, at: 0, dur: 0.3, slideTo: 84 }, ...seq([84, 91], 0.1).map((t) => ({ ...t, at: t.at + 0.3 }))],
  buy: seq([88, 84, 91], 0.06),
}

const SFX_VOLUME = 0.12
const MUSIC_VOLUME = 0.05

const frequency = (note: number) => 440 * 2 ** ((note - 69) / 12)

let context: AudioContext | null = null
let output: GainNode | null = null

function getContext(): AudioContext | null {
  if (context) return context
  const Ctor =
    typeof window === 'undefined'
      ? undefined
      : (window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
  if (!Ctor) return null
  context = new Ctor()
  output = context.createGain()
  output.connect(context.destination)
  return context
}

function playTone(ctx: AudioContext, tone: Tone, start: number, volume: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const begin = start + tone.at
  const end = begin + tone.dur
  osc.type = tone.wave ?? 'square'
  osc.frequency.setValueAtTime(frequency(tone.note), begin)
  if (tone.slideTo !== undefined) osc.frequency.linearRampToValueAtTime(frequency(tone.slideTo), end)
  // Envolvente corta para evitar chasquidos
  const peak = volume * (tone.volume ?? 1)
  gain.gain.setValueAtTime(0, begin)
  gain.gain.linearRampToValueAtTime(peak, begin + 0.005)
  gain.gain.setValueAtTime(peak, Math.max(begin + 0.005, end - 0.02))
  gain.gain.linearRampToValueAtTime(0, end)
  osc.connect(gain).connect(output!)
  osc.start(begin)
  osc.stop(end + 0.01)
}

/** Reproduce un efecto si están activados en la configuración */
export function playSfx(name: SfxName, delayMs = 0) {
  if (!useSettingsStore.getState().sfx) return
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const start = ctx.currentTime + delayMs / 1000
  for (const tone of SFX[name]) playTone(ctx, tone, start, SFX_VOLUME)
}

// Música de fondo: una melodía alegre en do mayor que se repite (corcheas a 132 pulsos por minuto)
const STEP = 60 / 132 / 2
const MELODY: (number | null)[] = [
  72, 76, 79, 76, 81, 79, 76, 72, 74, 77, 81, 77, 79, 77, 74, 71,
  72, 76, 79, 84, 83, 79, 76, 74, 72, 74, 76, 79, 77, 74, 72, null,
]
const BASS: (number | null)[] = [48, 48, 53, 53, 50, 50, 55, 55, 48, 48, 52, 52, 53, 55, 48, null]
const LOOKAHEAD_S = 0.3

let musicWanted = false
let timer: number | null = null
let nextStep = 0
let nextTime = 0

function scheduleMusic() {
  const ctx = context!
  while (nextTime < ctx.currentTime + LOOKAHEAD_S) {
    const lead = MELODY[nextStep % MELODY.length]
    if (lead !== null) playTone(ctx, { note: lead, at: 0, dur: STEP * 0.8 }, nextTime, MUSIC_VOLUME)
    const bass = nextStep % 2 === 0 ? BASS[(nextStep / 2) % BASS.length] : null
    if (bass !== null) playTone(ctx, { note: bass, at: 0, dur: STEP * 1.8, wave: 'triangle' }, nextTime, MUSIC_VOLUME * 1.6)
    nextStep++
    nextTime += STEP
  }
}

function startMusic() {
  const ctx = getContext()
  if (!ctx || timer !== null || ctx.state !== 'running' || document.hidden) return
  nextStep = 0
  nextTime = ctx.currentTime + 0.05
  scheduleMusic()
  timer = window.setInterval(scheduleMusic, 100)
}

function stopMusic() {
  if (timer !== null) window.clearInterval(timer)
  timer = null
}

/** Enciende o apaga la música según la configuración */
export function setMusicEnabled(enabled: boolean) {
  musicWanted = enabled
  if (enabled) startMusic()
  else stopMusic()
}

/**
 * Los navegadores solo permiten sonar después de una interacción del usuario: el primer toque o
 * tecla activa el audio y, si corresponde, la música. La música se detiene con la pestaña oculta.
 */
export function installAudioUnlock(): () => void {
  const unlock = () => {
    const ctx = getContext()
    if (!ctx) return
    void ctx.resume().then(() => {
      if (musicWanted) startMusic()
    })
  }
  const onVisibility = () => {
    if (document.hidden) stopMusic()
    else if (musicWanted) startMusic()
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
  document.addEventListener('visibilitychange', onVisibility)
  return () => {
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}
