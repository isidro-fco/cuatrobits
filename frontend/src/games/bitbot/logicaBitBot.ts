/**
 * Archivo: logicaBitBot.ts
 * Módulo: frontend / games / bitbot
 * Descripción: Reglas de Arma a BitBot (secciones 6.3 y 6.4). Funciones puras.
 * Requerimientos: RF25, RF26, RF27, RF28, RF29
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Tipos ----------
export interface EstadoBitBot {
  palabra: string
  /** Letras ya elegidas, normalizadas, en el orden en que se eligieron */
  adivinadas: string[]
}

export type SituacionBitBot = 'playing' | 'won' | 'lost'

// ---------- Constantes ----------
/** Piezas de BitBot (RF28) */
export const TOTAL_PIEZAS = 8
/** Piezas que ya están ensambladas al empezar (RF28) */
export const PIEZAS_INICIALES = 3
/** Errores permitidos antes de perder (RF27) */
export const MAX_ERRORES_BITBOT = 5

/** Teclado en pantalla: alfabeto español */
export const FILAS_TECLADO = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM']

// ---------- Funciones ----------
/**
 * Normaliza una letra para compararla: mayúsculas y sin tildes ni diéresis. La Ñ se conserva porque
 * es una letra distinta de la N.
 * @param letra Letra elegida por el jugador
 * @returns Letra en mayúscula sin tildes
 * @see RF25
 */
export function normalizarLetra(letra: string): string {
  const mayusculas = letra.toLocaleUpperCase('es')
  if (mayusculas === 'Ñ') {
    return 'Ñ'
  }
  return mayusculas.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

/**
 * Indica si un carácter de la palabra debe adivinarse (letras) o se muestra siempre (espacios y
 * signos).
 * @param caracter Carácter de la palabra
 * @returns true si es una letra
 * @see RF26
 */
export function esAdivinable(caracter: string): boolean {
  return /^\p{L}$/u.test(caracter)
}

/**
 * Crea el estado inicial de una partida.
 * @param palabra Palabra que hay que adivinar
 * @returns Estado sin letras adivinadas
 * @see RF26
 */
export function crearJuegoBitBot(palabra: string): EstadoBitBot {
  return { palabra: palabra.toLocaleUpperCase('es'), adivinadas: [] }
}

/**
 * Letras distintas (normalizadas) que hay que descubrir
 * @param palabra Palabra que hay que adivinar
 * @returns Conjunto de letras normalizadas
 * @see RF26
 */
export function letrasPorEncontrar(palabra: string): Set<string> {
  return new Set([...palabra].filter(esAdivinable).map(normalizarLetra))
}

/**
 * Letras elegidas que sí están en la palabra.
 * @param estado Estado actual de la partida
 * @returns Letras en el orden en que se eligieron
 * @see RF27, RF30
 */
export function letrasCorrectas(estado: EstadoBitBot): string[] {
  const letrasObjetivo = letrasPorEncontrar(estado.palabra)
  return estado.adivinadas.filter((letra) => letrasObjetivo.has(letra))
}

/**
 * Letras elegidas que no están en la palabra.
 * @param estado Estado actual de la partida
 * @returns Letras en el orden en que se eligieron
 * @see RF27, RF30
 */
export function letrasIncorrectas(estado: EstadoBitBot): string[] {
  const letrasObjetivo = letrasPorEncontrar(estado.palabra)
  return estado.adivinadas.filter((letra) => !letrasObjetivo.has(letra))
}

/**
 * Cuenta los errores cometidos.
 * @param estado Estado actual de la partida
 * @returns Cantidad de letras incorrectas
 * @see RF27
 */
export function cantidadErrores(estado: EstadoBitBot): number {
  return letrasIncorrectas(estado).length
}

/**
 * Errores que todavía se pueden cometer antes de perder.
 * @param estado Estado actual de la partida
 * @returns Intentos restantes (0 a 5)
 * @see RF27
 */
export function intentosRestantes(estado: EstadoBitBot): number {
  return MAX_ERRORES_BITBOT - cantidadErrores(estado)
}

/**
 * Indica si la partida sigue, se ganó o se perdió.
 * @param estado Estado actual de la partida
 * @returns 'playing', 'won' o 'lost'
 * @see RF28, RF29
 */
export function obtenerSituacionBitBot(estado: EstadoBitBot): SituacionBitBot {
  if (letrasCorrectas(estado).length === letrasPorEncontrar(estado.palabra).size) {
    return 'won'
  }
  if (cantidadErrores(estado) >= MAX_ERRORES_BITBOT) {
    return 'lost'
  }
  return 'playing'
}

/**
 * Elige una letra. Las repetidas o elegidas tras terminar la partida no cambian nada.
 * @param estado Estado actual de la partida
 * @param letra Letra elegida por el jugador
 * @returns Nuevo estado; el mismo si la jugada no cambia nada
 * @see RF26, RF27
 */
export function adivinarLetra(estado: EstadoBitBot, letra: string): EstadoBitBot {
  const normalizado = normalizarLetra(letra)
  if (!esAdivinable(normalizado) || estado.adivinadas.includes(normalizado)) {
    return estado
  }
  if (obtenerSituacionBitBot(estado) !== 'playing') {
    return estado
  }
  return { ...estado, adivinadas: [...estado.adivinadas, normalizado] }
}

/**
 * Palabra con las letras sin descubrir como `null`; los espacios y signos se muestran siempre
 * @param estado Estado actual de la partida
 * @returns Un elemento por carácter de la palabra
 * @see RF26
 */
export function palabraOculta(estado: EstadoBitBot): (string | null)[] {
  const adivinadas = new Set(estado.adivinadas)
  return [...estado.palabra].map((caracter) =>
    !esAdivinable(caracter) || adivinadas.has(normalizarLetra(caracter)) ? caracter : null,
  )
}

/**
 * Piezas ensambladas: empiezan en tres y crecen con las letras acertadas. Son independientes de los
 * intentos (sección 6.4).
 * @param estado Estado actual de la partida
 * @returns Cantidad de piezas (3 a 8)
 * @see RF28
 */
export function piezasEnsambladas(estado: EstadoBitBot): number {
  const estatus = obtenerSituacionBitBot(estado)
  if (estatus === 'won') {
    return TOTAL_PIEZAS
  }
  const total = letrasPorEncontrar(estado.palabra).size
  const encontrado = letrasCorrectas(estado).length
  // Mientras falte alguna letra, BitBot no se completa
  return Math.min(
    TOTAL_PIEZAS - 1,
    PIEZAS_INICIALES + Math.floor(((TOTAL_PIEZAS - PIEZAS_INICIALES) * encontrado) / total),
  )
}

/**
 * Elige una palabra al azar entre las que no salieron hace poco; si ya salieron todas, entre
 * cualquiera
 * @param palabras Palabras de la categoría
 * @param recientes Palabras de las últimas partidas
 * @param aleatorio Generador de números entre 0 y 1; las pruebas lo reemplazan para ser
 *   deterministas
 * @returns La palabra elegida
 * @see RF23
 */
export function seleccionarPalabra<TipoDato extends { palabra: string }>(
  palabras: TipoDato[],
  recientes: string[],
  aleatorio: () => number = Math.random,
): TipoDato {
  const nuevos = palabras.filter((entrada) => !recientes.includes(entrada.palabra))
  const grupoConexiones = nuevos.length > 0 ? nuevos : palabras
  return grupoConexiones[Math.floor(aleatorio() * grupoConexiones.length)]
}

/**
 * Cuántas palabras recientes se evitan: la mitad de la categoría
 * @param total Cantidad de palabras de la categoría
 * @returns Cantidad de palabras recientes
 * @see RF23
 */
export const palabrasRecientesAEvitar = (total: number) => Math.floor(total / 2)
