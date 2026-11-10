/**
 * Archivo: logicaEsferas.ts
 * Módulo: frontend / games / esferas
 * Descripción: Reglas, generador y solucionador de Ordenamiento de esferas (secciones 7.2 a 7.4).
 * Requerimientos: RF32, RF33, RF35, RF36, RE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { ESFERAS_POR_COLOR, calcularTubos } from '../../data/esferas'

// ---------- Tipos ----------
/** Cada tubo lista los colores de abajo hacia arriba */
export type Tubo = number[]
export type Tubos = Tubo[]
export type Movimiento = readonly [origen: number, destino: number]

/** Un nivel y una secuencia de movimientos legales que lo resuelve */
export interface Nivel {
  tubos: Tubos
  solucion: Movimiento[]
}

// ---------- Constantes ----------
/** Esferas que caben en un tubo (RF32) */
export const CAPACIDAD_MAXIMA = ESFERAS_POR_COLOR

// ---------- Reglas de movimiento ----------
const superior = (tubo: Tubo) => tubo[tubo.length - 1]

/**
 * Comprueba las reglas de movimiento: la esfera superior va a un tubo vacío o sobre otra del mismo
 * color, sin pasar de la capacidad.
 * @param tubos Contenido de cada tubo, de abajo hacia arriba
 * @param origen Índice del tubo de donde sale la esfera
 * @param destino Índice del tubo que recibe la esfera
 * @returns true si el movimiento es legal
 * @see RF33
 */
export function esPosibleMover(tubos: Tubos, origen: number, destino: number): boolean {
  if (origen === destino || !tubos[origen] || !tubos[destino]) {
    return false
  }
  const tuboOrigen = tubos[origen]
  const tuboDestino = tubos[destino]
  if (tuboOrigen.length === 0 || tuboDestino.length >= CAPACIDAD_MAXIMA) {
    return false
  }
  return tuboDestino.length === 0 || superior(tuboDestino) === superior(tuboOrigen)
}

/**
 * Mueve la esfera superior; lanza un error si el movimiento no es válido
 * @param tubos Contenido de cada tubo, de abajo hacia arriba
 * @param origen Índice del tubo de donde sale la esfera
 * @param destino Índice del tubo que recibe la esfera
 * @returns Tubos después del movimiento
 * @see RF33, RF34
 */
export function moverEsfera(tubos: Tubos, origen: number, destino: number): Tubos {
  if (!esPosibleMover(tubos, origen, destino)) {
    throw new Error(`Movimiento no válido: ${origen} → ${destino}`)
  }
  const siguiente = tubos.map((tubo) => tubo.slice())
  siguiente[destino].push(siguiente[origen].pop()!)
  return siguiente
}

const esTuboCompleto = (tubo: Tubo) =>
  tubo.length === CAPACIDAD_MAXIMA && tubo.every((esfera) => esfera === tubo[0])

/**
 * Resuelto: cada tubo ocupado está lleno con esferas de un solo color
 * @param tubos Contenido de cada tubo, de abajo hacia arriba
 * @returns true si el nivel está terminado
 * @see RF35
 */
export function estaResuelto(tubos: Tubos): boolean {
  return tubos.every((tubo) => tubo.length === 0 || esTuboCompleto(tubo))
}

/**
 * Cuenta los tubos llenos con un solo color.
 * @param tubos Contenido de cada tubo, de abajo hacia arriba
 * @returns Cantidad de tubos completos
 * @see RF37
 */
export function tubosCompletos(tubos: Tubos): number {
  return tubos.filter(esTuboCompleto).length
}

// ---------- Solucionador ----------

// Los tubos son intercambiables, así que el orden no importa para identificar un estado
const claveEstado = (tubos: Tubos) =>
  tubos
    .map((tubo) => tubo.join(','))
    .sort()
    .join('|')

function movimientosCandidatos(tubos: Tubos): Movimiento[] {
  const movimientos: { movimiento: Movimiento; prioridad: number }[] = []
  for (let origen = 0; origen < tubos.length; origen++) {
    const tuboOrigen = tubos[origen]
    if (tuboOrigen.length === 0 || esTuboCompleto(tuboOrigen)) {
      continue
    }
    const color = superior(tuboOrigen)
    const esMonocromo = tuboOrigen.every((esfera) => esfera === color)
    let esIntentoVacio = false
    for (let destino = 0; destino < tubos.length; destino++) {
      if (!esPosibleMover(tubos, origen, destino)) {
        continue
      }
      const tuboDestino = tubos[destino]
      if (tuboDestino.length === 0) {
        // Pasar un tubo de un solo color a uno vacío no avanza; y todos los vacíos son equivalentes
        if (esMonocromo || esIntentoVacio) {
          continue
        }
        esIntentoVacio = true
        movimientos.push({ movimiento: [origen, destino], prioridad: 0 })
      } else {
        const esMonocromoObjetivo = tuboDestino.every((esfera) => esfera === color)
        movimientos.push({
          movimiento: [origen, destino],
          prioridad: esMonocromoObjetivo ? 2 + tuboDestino.length : 1,
        })
      }
    }
  }
  return movimientos
    .sort((primero, segundo) => segundo.prioridad - primero.prioridad)
    .map((opcion) => opcion.movimiento)
}

/**
 * Busca una secuencia de movimientos legales hasta el estado resuelto (búsqueda en profundidad con
 * memoria de estados visitados). Devuelve `null` si no la encuentra dentro del límite.
 * @param tubos Contenido de cada tubo, de abajo hacia arriba
 * @param maximoEstados Estados que se exploran antes de rendirse
 * @returns Movimientos de la solución o null si no se encontró
 * @see RF36, RE02
 */
export function resolver(tubos: Tubos, maximoEstados = 50_000): Movimiento[] | null {
  const visitados = new Set<string>()
  const ruta: Movimiento[] = []

  function buscar(estado: Tubos): boolean {
    if (estaResuelto(estado)) {
      return true
    }
    const clave = claveEstado(estado)
    if (visitados.has(clave) || visitados.size >= maximoEstados) {
      return false
    }
    visitados.add(clave)
    for (const movimiento of movimientosCandidatos(estado)) {
      ruta.push(movimiento)
      if (buscar(moverEsfera(estado, movimiento[0], movimiento[1]))) {
        return true
      }
      ruta.pop()
    }
    return false
  }

  return buscar(tubos) ? ruta : null
}

// ---------- Generador ----------
/** Estado ordenado: los primeros `colores` tubos llenos de un solo color y el resto vacíos */
function tubosOrdenados(colores: number): Tubos {
  return Array.from({ length: calcularTubos(colores) }, (_, indice) =>
    indice < colores ? Array<number>(CAPACIDAD_MAXIMA).fill(indice) : [],
  )
}

/**
 * Movimientos inversos posibles: llevar la esfera de arriba de `origen` a `destino` de modo que,
 * hacia
 * delante, volver de `destino` a `origen` sea un movimiento legal. Para eso la esfera debe estar
 * sola en
 * su tubo o sobre otra de su mismo color.
 */
function movimientosInversos(tubos: Tubos): Movimiento[] {
  const movimientos: Movimiento[] = []
  tubos.forEach((tuboOrigen, origen) => {
    if (tuboOrigen.length === 0) {
      return
    }
    if (tuboOrigen.length > 1 && tuboOrigen[tuboOrigen.length - 2] !== superior(tuboOrigen)) {
      return
    }
    tubos.forEach((tuboDestino, destino) => {
      if (destino !== origen && tuboDestino.length < CAPACIDAD_MAXIMA) {
        movimientos.push([origen, destino])
      }
    })
  })
  return movimientos
}

/**
 * Qué tan revuelto está: esferas sobre otro color, tubos incompletos y, en contra, tubos ya
 * completos
 */
function desorden(tubos: Tubos): number {
  let puntaje = 0
  for (const tubo of tubos) {
    for (let i = 1; i < tubo.length; i++) {
      if (tubo[i] !== tubo[i - 1]) {
        puntaje += 3
      }
    }
    if (tubo.length > 0 && !esTuboCompleto(tubo)) {
      puntaje += 1
    }
    if (esTuboCompleto(tubo)) {
      puntaje -= 5
    }
  }
  return puntaje
}

/**
 * Comprueba que la secuencia solo use movimientos legales y termine con las esferas ordenadas
 * @param tubos Contenido de cada tubo, de abajo hacia arriba
 * @param solucion Movimientos que se comprueban
 * @returns true si la solución es válida
 * @see RF36
 */
export function validarSolucion(tubos: Tubos, solucion: readonly Movimiento[]): boolean {
  let estado = tubos
  for (const [origen, destino] of solucion) {
    if (!esPosibleMover(estado, origen, destino)) {
      return false
    }
    estado = moverEsfera(estado, origen, destino)
  }
  return estaResuelto(estado)
}

function mezclar<TipoDato>(articulos: TipoDato[], aleatorio: () => number): TipoDato[] {
  const resultado = articulos.slice()
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[resultado[i], resultado[j]] = [resultado[j], resultado[i]]
  }
  return resultado
}

/** Revuelve todas las esferas del estado ordenado y las reparte en los primeros tubos */
function tubosMezclados(colores: number, aleatorio: () => number): Tubos {
  const esferas = mezclar(tubosOrdenados(colores).flat(), aleatorio)
  return Array.from({ length: calcularTubos(colores) }, (_, indice) =>
    indice < colores
      ? esferas.slice(indice * CAPACIDAD_MAXIMA, (indice + 1) * CAPACIDAD_MAXIMA)
      : [],
  )
}

/**
 * Respaldo que siempre tiene solución: revuelve con movimientos inversos al azar, de modo que
 * recorrerlos al revés devuelve las esferas a su lugar. Queda menos revuelto que `tubosMezclados`.
 */
function mezclaInversa(colores: number, aleatorio: () => number): Nivel | null {
  let tubos = tubosOrdenados(colores)
  const revoltura: Movimiento[] = []
  let mejor: { tubos: Tubos; length: number; puntaje: number } | null = null
  for (let i = 0; i < 100 + colores * 80; i++) {
    const ultimo = revoltura.at(-1)
    // Deshacer el movimiento anterior no revuelve nada
    const opciones = movimientosInversos(tubos).filter(
      (movimiento) => !ultimo || movimiento[0] !== ultimo[1] || movimiento[1] !== ultimo[0],
    )
    if (opciones.length === 0) {
      break
    }
    const [origen, destino] = opciones[Math.floor(aleatorio() * opciones.length)]
    tubos = tubos.map((tubo) => tubo.slice())
    tubos[destino].push(tubos[origen].pop()!)
    revoltura.push([origen, destino])
    const puntaje = desorden(tubos)
    if (!estaResuelto(tubos) && (!mejor || puntaje > mejor.puntaje)) {
      mejor = { tubos, length: revoltura.length, puntaje }
    }
  }
  if (!mejor) {
    return null
  }
  const solucion = revoltura
    .slice(0, mejor.length)
    .reverse()
    .map(([origen, destino]): Movimiento => [destino, origen])
  return { tubos: mejor.tubos, solucion }
}

/**
 * Genera un nivel que siempre se puede terminar (sección 7.4). Parte de las esferas ordenadas, las
 * revuelve y busca una secuencia de movimientos legales que las vuelva a ordenar; antes de entregar
 * el nivel juega esa secuencia para verificarla. Si no la encuentra, prueba otra mezcla y, como
 * último recurso, usa `mezclaInversa`.
 * @param colores Cantidad de colores del nivel (1 a 10)
 * @param aleatorio Generador de números entre 0 y 1; las pruebas lo reemplazan para ser
 *   deterministas
 * @returns Tubos iniciales y una solución verificada
 * @see RF36, RE02
 */
export function generarNivelResoluble(
  colores: number,
  aleatorio: () => number = Math.random,
): Nivel {
  // Con un solo color, repartir las esferas al azar siempre las deja en un tubo: no hay mezcla
  // posible
  if (colores > 1) {
    for (let intento = 0; intento < 30; intento++) {
      const tubos = tubosMezclados(colores, aleatorio)
      if (estaResuelto(tubos) || tubosCompletos(tubos) > 0) {
        continue
      }
      const solucion = resolver(tubos)
      if (solucion && validarSolucion(tubos, solucion)) {
        return { tubos, solucion }
      }
    }
  }
  for (let intento = 0; intento < 10; intento++) {
    const nivel = mezclaInversa(colores, aleatorio)
    if (nivel && validarSolucion(nivel.tubos, nivel.solucion)) {
      return nivel
    }
  }
  // Con un azar que siempre devuelve lo mismo puede no haber mezcla: una esfera fuera de su tubo
  const tubos = tubosOrdenados(colores)
  tubos[colores].push(tubos[0].pop()!)
  return { tubos, solucion: [[colores, 0]] }
}

/**
 * Genera un nivel con solución verificada y que no empiece resuelto
 * @param colores Cantidad de colores del nivel (1 a 10)
 * @param aleatorio Generador de números entre 0 y 1; las pruebas lo reemplazan para ser
 *   deterministas
 * @returns Tubos iniciales del nivel
 * @see RF32, RF36
 */
export function generarNivel(colores: number, aleatorio: () => number = Math.random): Tubos {
  return generarNivelResoluble(colores, aleatorio).tubos
}
