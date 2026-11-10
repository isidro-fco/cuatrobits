/**
 * Archivo: audio.ts
 * Módulo: frontend / services
 * Descripción: Música y efectos sintetizados con Web Audio al estilo de las consolas de 8 bits; no
 *              hay archivos de audio.
 * Requerimientos: RF08, RF44, RNF05
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { useAjustesStore } from '../stores/useAjustesStore'

// ---------- Tipos ----------
export type NombreEfecto =
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

interface Tono {
  /** Nota MIDI (60 = do central) */
  nota: number
  /** Inicio y duración en segundos */
  momento: number
  duracionTono: number
  onda?: OscillatorType
  volumen?: number
  /** Nota final de un deslizamiento */
  deslizarA?: number
}

// ---------- Constantes ----------
/** Volumen de los efectos de sonido */
const VOLUMEN_EFECTOS = 0.12
/** Volumen de la música, bajo para no tapar los efectos */
const VOLUMEN_MUSICA = 0.05

// Música de fondo: una melodía alegre en do mayor que se repite (corcheas a 132 pulsos por minuto)
const PASO = 60 / 132 / 2
/** Melodía de la música en notas MIDI; null es un silencio */
const MELODIA: (number | null)[] = [
  72,
  76,
  79,
  76,
  81,
  79,
  76,
  72,
  74,
  77,
  81,
  77,
  79,
  77,
  74,
  71,
  72,
  76,
  79,
  84,
  83,
  79,
  76,
  74,
  72,
  74,
  76,
  79,
  77,
  74,
  72,
  null,
]
/** Línea del bajo en notas MIDI; null es un silencio */
const BAJO: (number | null)[] = [48, 48, 53, 53, 50, 50, 55, 55, 48, 48, 52, 52, 53, 55, 48, null]
/** Segundos que se programan por adelantado para que la música no se corte */
const ANTICIPACION_S = 0.3

// ---------- Servicio ----------
const secuencia = (notas: number[], paso: number, onda: OscillatorType = 'square'): Tono[] =>
  notas.map((nota, i) => ({ nota, momento: i * paso, duracionTono: paso * 0.9, onda }))

/** Tonos de cada efecto de sonido */
const EFECTOS: Record<NombreEfecto, Tono[]> = {
  select: [{ nota: 84, momento: 0, duracionTono: 0.05 }],
  drop: [
    { nota: 67, momento: 0, duracionTono: 0.12, onda: 'triangle', deslizarA: 55, volumen: 0.5 },
  ],
  correct: secuencia([79, 84], 0.07),
  wrong: [{ nota: 50, momento: 0, duracionTono: 0.2, deslizarA: 45, volumen: 0.6 }],
  flip: [{ nota: 76, momento: 0, duracionTono: 0.04, onda: 'triangle' }],
  match: secuencia([76, 79, 84], 0.06),
  invalid: [{ nota: 40, momento: 0, duracionTono: 0.12, volumen: 0.5 }],
  win: secuencia([72, 76, 79, 84, 79, 84], 0.1),
  lose: secuencia([67, 64, 60, 55], 0.14, 'triangle'),
  draw: secuencia([72, 74, 72], 0.12, 'triangle'),
  unlock: secuencia([84, 88, 91, 96], 0.07),
  levelUp: [
    { nota: 60, momento: 0, duracionTono: 0.3, deslizarA: 84 },
    ...secuencia([84, 91], 0.1).map((tono) => ({ ...tono, momento: tono.momento + 0.3 })),
  ],
  buy: secuencia([88, 84, 91], 0.06),
}

/** Frecuencia en Hz de una nota MIDI (69 = La de 440 Hz) */
const frecuencia = (nota: number) => 440 * 2 ** ((nota - 69) / 12)

/** Contexto de Web Audio; se crea al primer sonido */
let contextoCompartido: AudioContext | null = null
/** Nodo final por el que pasan todos los sonidos */
let salida: GainNode | null = null

function obtenerContexto(): AudioContext | null {
  if (contextoCompartido) {
    return contextoCompartido
  }
  const ConstructorAudio =
    typeof window === 'undefined'
      ? undefined
      : (window.AudioContext ??
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
  if (!ConstructorAudio) {
    return null
  }
  contextoCompartido = new ConstructorAudio()
  salida = contextoCompartido.createGain()
  salida.connect(contextoCompartido.destination)
  return contextoCompartido
}

function reproducirTono(contextoAudio: AudioContext, tono: Tono, inicio: number, volumen: number) {
  const oscilador = contextoAudio.createOscillator()
  const ganancia = contextoAudio.createGain()
  const comienzo = inicio + tono.momento
  const fin = comienzo + tono.duracionTono
  oscilador.type = tono.onda ?? 'square'
  oscilador.frequency.setValueAtTime(frecuencia(tono.nota), comienzo)
  if (tono.deslizarA !== undefined) {
    oscilador.frequency.linearRampToValueAtTime(frecuencia(tono.deslizarA), fin)
  }
  // Envolvente corta para evitar chasquidos
  const pico = volumen * (tono.volumen ?? 1)
  ganancia.gain.setValueAtTime(0, comienzo)
  ganancia.gain.linearRampToValueAtTime(pico, comienzo + 0.005)
  ganancia.gain.setValueAtTime(pico, Math.max(comienzo + 0.005, fin - 0.02))
  ganancia.gain.linearRampToValueAtTime(0, fin)
  oscilador.connect(ganancia).connect(salida!)
  oscilador.start(comienzo)
  oscilador.stop(fin + 0.01)
}

/**
 * Reproduce un efecto si están activados en la configuración
 * @param nombre Efecto que se reproduce
 * @param retrasoMs Espera antes de sonar, en milisegundos
 * @see RF44, RNF05
 */
export function reproducirEfecto(nombre: NombreEfecto, retrasoMs = 0) {
  if (!useAjustesStore.getState().estaSonidoActivo) {
    return
  }
  const contextoAudio = obtenerContexto()
  if (!contextoAudio) {
    return
  }
  if (contextoAudio.state === 'suspended') {
    void contextoAudio.resume()
  }
  const inicio = contextoAudio.currentTime + retrasoMs / 1000
  for (const tono of EFECTOS[nombre]) {
    reproducirTono(contextoAudio, tono, inicio, VOLUMEN_EFECTOS)
  }
}

/** Verdadero si la configuración pide música, aunque el audio aún no esté desbloqueado */
let esMusicaDeseada = false
/** Intervalo que programa las siguientes notas, o null si la música está detenida */
let temporizador: number | null = null
/** Paso de la melodía que sigue */
let siguientePaso = 0
/** Momento (en segundos del contexto) en que suena el paso siguiente */
let siguienteTiempo = 0

function programarMusica() {
  const contextoAudio = contextoCompartido!
  while (siguienteTiempo < contextoAudio.currentTime + ANTICIPACION_S) {
    const notaMelodia = MELODIA[siguientePaso % MELODIA.length]
    if (notaMelodia !== null) {
      reproducirTono(
        contextoAudio,
        { nota: notaMelodia, momento: 0, duracionTono: PASO * 0.8 },
        siguienteTiempo,
        VOLUMEN_MUSICA,
      )
    }
    const notaBajo = siguientePaso % 2 === 0 ? BAJO[(siguientePaso / 2) % BAJO.length] : null
    if (notaBajo !== null) {
      reproducirTono(
        contextoAudio,
        { nota: notaBajo, momento: 0, duracionTono: PASO * 1.8, onda: 'triangle' },
        siguienteTiempo,
        VOLUMEN_MUSICA * 1.6,
      )
    }
    siguientePaso++
    siguienteTiempo += PASO
  }
}

function iniciarMusica() {
  const contextoAudio = obtenerContexto()
  if (
    !contextoAudio ||
    temporizador !== null ||
    contextoAudio.state !== 'running' ||
    document.hidden
  ) {
    return
  }
  siguientePaso = 0
  siguienteTiempo = contextoAudio.currentTime + 0.05
  programarMusica()
  temporizador = window.setInterval(programarMusica, 100)
}

function detenerMusica() {
  if (temporizador !== null) {
    window.clearInterval(temporizador)
  }
  temporizador = null
}

/**
 * Enciende o apaga la música según la configuración
 * @param estaHabilitado Verdadero para que suene la música
 * @see RF08, RNF05
 */
export function asignarMusicaActiva(estaHabilitado: boolean) {
  esMusicaDeseada = estaHabilitado
  if (estaHabilitado) {
    iniciarMusica()
  } else {
    detenerMusica()
  }
}

/**
 * Los navegadores solo permiten sonar después de una interacción del usuario: el primer toque o
 * tecla activa el audio y, si corresponde, la música. La música se detiene con la pestaña oculta.
 * @returns Función que quita los escuchadores
 * @see RF08
 */
export function instalarDesbloqueoAudio(): () => void {
  const desbloquear = () => {
    const contextoAudio = obtenerContexto()
    if (!contextoAudio) {
      return
    }
    void contextoAudio.resume().then(() => {
      if (esMusicaDeseada) {
        iniciarMusica()
      }
    })
  }
  const alCambiarVisibilidad = () => {
    if (document.hidden) {
      detenerMusica()
    } else if (esMusicaDeseada) {
      iniciarMusica()
    }
  }
  window.addEventListener('pointerdown', desbloquear)
  window.addEventListener('keydown', desbloquear)
  document.addEventListener('visibilitychange', alCambiarVisibilidad)
  return () => {
    window.removeEventListener('pointerdown', desbloquear)
    window.removeEventListener('keydown', desbloquear)
    document.removeEventListener('visibilitychange', alCambiarVisibilidad)
  }
}
