/**
 * Archivo: logicaMemorama.ts
 * Módulo: frontend / games / memorama
 * Descripción: Reglas de Memorama (sección 8.4). Funciones puras.
 * Requerimientos: RF40, RF41, RF42, RF43
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { EntradaImagen } from '../../data/contenido'

// ---------- Tipos ----------
export interface Carta {
  /** Posición única de la carta en el tablero */
  id: number
  /** Las dos cartas de una pareja comparten `idPareja` */
  idPareja: number
  imagen: EntradaImagen
}

export interface EstadoMemorama {
  cartas: Carta[]
  /** Índices de las cartas boca arriba que aún no forman pareja (máximo dos) */
  volteadas: number[]
  idsEmparejados: Set<number>
  /** Turnos completos: cada vez que se voltean dos cartas */
  intentos: number
}

// ---------- Funciones ----------
function mezclar<TipoDato>(articulos: TipoDato[], aleatorio: () => number): TipoDato[] {
  const resultado = articulos.slice()
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[resultado[i], resultado[j]] = [resultado[j], resultado[i]]
  }
  return resultado
}

/**
 * Selecciona las imágenes, duplica cada una y mezcla las cartas. Usa primero las que no están en
 * `recientes` (emojis de las últimas partidas, del más nuevo al más viejo) y, si faltan, las más
 * viejas.
 * @param imagenes Imágenes de la categoría
 * @param parejas Cantidad de parejas del tablero
 * @param aleatorio Generador de números entre 0 y 1; las pruebas lo reemplazan para ser
 *   deterministas
 * @param recientes Emojis de las últimas partidas, del más nuevo al más viejo
 * @returns Cartas mezcladas, dos por imagen
 * @see RF41
 */
export function crearMazo(
  imagenes: EntradaImagen[],
  parejas: number,
  aleatorio: () => number = Math.random,
  recientes: string[] = [],
): Carta[] {
  if (imagenes.length < parejas) {
    throw new Error(`Se necesitan ${parejas} imágenes y solo hay ${imagenes.length}`)
  }
  const nuevos = imagenes.filter((imagen) => !recientes.includes(imagen.emoji))
  const obsoleto = imagenes
    .filter((imagen) => recientes.includes(imagen.emoji))
    .sort((primero, segundo) => recientes.indexOf(segundo.emoji) - recientes.indexOf(primero.emoji))
  const elegido = [...mezclar(nuevos, aleatorio), ...obsoleto].slice(0, parejas)
  const cartas = elegido.flatMap((imagen, idPareja) => [
    { idPareja, imagen },
    { idPareja, imagen },
  ])
  return mezclar(cartas, aleatorio).map((carta, id) => ({ ...carta, id }))
}

/**
 * Crea el estado inicial con todas las cartas boca abajo.
 * @param cartas Mazo ya mezclado
 * @returns Estado sin intentos ni parejas
 * @see RF41
 */
export function crearJuegoMemorama(cartas: Carta[]): EstadoMemorama {
  return { cartas, volteadas: [], idsEmparejados: new Set(), intentos: 0 }
}

/**
 * Hay dos cartas distintas boca arriba esperando a ocultarse
 * @param estado Estado actual de la partida
 * @returns true si no se puede voltear otra carta
 * @see RF42
 */
export function estaBloqueada(estado: EstadoMemorama): boolean {
  return estado.volteadas.length === 2
}

/**
 * Indica si una carta está boca arriba (volteada en este turno o ya emparejada).
 * @param estado Estado actual de la partida
 * @param indice Posición de la carta en el tablero
 * @returns true si la carta se ve
 * @see RF42
 */
export function estaCartaVolteada(estado: EstadoMemorama, indice: number): boolean {
  return (
    estado.volteadas.includes(indice) || estado.idsEmparejados.has(estado.cartas[indice].idPareja)
  )
}

/**
 * Voltea una carta. Si es la segunda del turno, cuenta un intento y, si coincide, la pareja queda
 * visible. Si no coinciden, ambas siguen boca arriba hasta llamar a `ocultarNoEmparejadas`.
 * @param estado Estado actual de la partida
 * @param indice Posición de la carta en el tablero
 * @returns Nuevo estado; el mismo si la carta no se puede voltear
 * @see RF42
 */
export function voltearCarta(estado: EstadoMemorama, indice: number): EstadoMemorama {
  if (
    estaBloqueada(estado) ||
    indice < 0 ||
    indice >= estado.cartas.length ||
    estaCartaVolteada(estado, indice)
  ) {
    return estado
  }
  const volteadas = [...estado.volteadas, indice]
  if (volteadas.length < 2) {
    return { ...estado, volteadas }
  }

  const [primera, segunda] = volteadas.map((i) => estado.cartas[i])
  const intentos = estado.intentos + 1
  if (primera.idPareja === segunda.idPareja) {
    return {
      ...estado,
      volteadas: [],
      idsEmparejados: new Set(estado.idsEmparejados).add(primera.idPareja),
      intentos,
    }
  }
  return { ...estado, volteadas, intentos }
}

/**
 * Vuelve a poner boca abajo las dos cartas que no coincidieron.
 * @param estado Estado actual de la partida
 * @returns Estado listo para el siguiente turno
 * @see RF42
 */
export function ocultarNoEmparejadas(estado: EstadoMemorama): EstadoMemorama {
  return estaBloqueada(estado) ? { ...estado, volteadas: [] } : estado
}

/**
 * Cuenta las parejas del tablero.
 * @param estado Estado actual de la partida
 * @returns Cantidad de parejas
 * @see RF44
 */
export function cantidadParejas(estado: EstadoMemorama): number {
  return estado.cartas.length / 2
}

/**
 * Indica si ya se encontraron todas las parejas.
 * @param estado Estado actual de la partida
 * @returns true si la partida terminó
 * @see RF43
 */
export function estaMemoramaCompleto(estado: EstadoMemorama): boolean {
  return estado.idsEmparejados.size === cantidadParejas(estado)
}
