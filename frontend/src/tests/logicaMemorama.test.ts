/**
 * Archivo: logicaMemorama.test.ts
 * Módulo: frontend / tests
 * Descripción: Pruebas de las reglas de Memorama.
 * Requerimientos: RF40, RF41, RF42, RF43, RNF15
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import { CATEGORIAS, DIFICULTADES_MEMORAMA } from '../data/categorias'
import { CONTENIDO } from '../data/contenido'
import { ICONOS_PIXEL } from '../data/artePixel'
import { leerConfiguracionMemorama } from '../games/memorama/configuracionMemorama'
import {
  crearMazo,
  crearJuegoMemorama,
  voltearCarta,
  ocultarNoEmparejadas,
  estaCartaVolteada,
  estaMemoramaCompleto,
  type Carta,
  type EstadoMemorama,
} from '../games/memorama/logicaMemorama'

// ---------- Pruebas ----------
const imagenes = CONTENIDO.animals.imagenes

/** Índices de las dos cartas de cada pareja */
function parejasDe(cartas: Carta[]): [number, number][] {
  const porPareja = new Map<number, number[]>()
  cartas.forEach((carta, i) =>
    porPareja.set(carta.idPareja, [...(porPareja.get(carta.idPareja) ?? []), i]),
  )
  return [...porPareja.values()] as [number, number][]
}

function buscarNoPareja(estado: EstadoMemorama): [number, number] {
  const [[primera], [segunda]] = parejasDe(estado.cartas)
  return [primera, segunda]
}

describe('mazo de Memorama (sección 16.5)', () => {
  it.each(DIFICULTADES_MEMORAMA)(
    'en $name cada carta tiene exactamente una pareja',
    ({ columnas, filas }) => {
      const parejas = (columnas * filas) / 2
      const cartas = crearMazo(imagenes, parejas)
      expect(cartas).toHaveLength(columnas * filas)
      const grupos = parejasDe(cartas)
      expect(grupos).toHaveLength(parejas)
      for (const [primero, segundo] of grupos) {
        expect(cartas[primero].imagen).toEqual(cartas[segundo].imagen)
      }
      expect(new Set(grupos.map(([primera]) => cartas[primera].imagen.emoji)).size).toBe(parejas)
    },
  )

  it('usa primero las imágenes que no salieron en las últimas partidas', () => {
    const primero = crearMazo(imagenes, 8)
    const usadas = [...new Set(primero.map((carta) => carta.imagen.emoji))]
    const siguiente = crearMazo(imagenes, 8, Math.random, usadas)
    expect(siguiente.some((carta) => usadas.includes(carta.imagen.emoji))).toBe(false)

    // En Experto no alcanzan las nuevas: se completan con las que salieron hace más tiempo
    const recientes = imagenes.map((i) => i.emoji).slice(0, imagenes.length - 4)
    const expert = new Set(
      crearMazo(imagenes, 18, Math.random, recientes).map((carta) => carta.imagen.emoji),
    )
    for (const emoji of imagenes.map((i) => i.emoji).slice(imagenes.length - 4)) {
      expect(expert).toContain(emoji)
    }
    for (const emoji of recientes.slice(-14)) {
      expect(expert).toContain(emoji)
    }
    expect(expert.has(recientes[0])).toBe(false)
  })

  it('todas las categorías tienen imágenes suficientes para Experto', () => {
    for (const categoria of CATEGORIAS) {
      const lista = CONTENIDO[categoria.id].imagenes
      expect(lista.length).toBeGreaterThanOrEqual(18)
      expect(new Set(lista.map((i) => i.emoji)).size).toBe(lista.length)
    }
  })

  it('cada imagen y cada categoría tiene su sprite de pixel art (data/artePixel.ts)', () => {
    const emojis = [
      ...CATEGORIAS.map((opcion) => opcion.emoji),
      ...CATEGORIAS.flatMap((opcion) => CONTENIDO[opcion.id].imagenes.map((i) => i.emoji)),
    ]
    expect(emojis.filter((emoji) => ICONOS_PIXEL[emoji] === undefined)).toEqual([])
  })
})

describe('reglas de Memorama (sección 16.5)', () => {
  it('las cartas comienzan boca abajo', () => {
    const estado = crearJuegoMemorama(crearMazo(imagenes, 4))
    expect(estado.cartas.every((_, i) => !estaCartaVolteada(estado, i))).toBe(true)
  })

  it('no se seleccionan más de dos cartas al mismo tiempo', () => {
    let estado = crearJuegoMemorama(crearMazo(imagenes, 4))
    const [primero, segundo] = buscarNoPareja(estado)
    estado = voltearCarta(voltearCarta(estado, primero), segundo)
    const tercero = estado.cartas.findIndex((_, i) => i !== primero && i !== segundo)
    expect(voltearCarta(estado, tercero)).toBe(estado)
    expect(estado.volteadas).toHaveLength(2)
  })

  it('no cuenta dos veces la misma carta', () => {
    const estado = voltearCarta(crearJuegoMemorama(crearMazo(imagenes, 4)), 0)
    expect(voltearCarta(estado, 0)).toBe(estado)
  })

  it('las parejas encontradas permanecen visibles', () => {
    let estado = crearJuegoMemorama(crearMazo(imagenes, 4))
    const [primero, segundo] = parejasDe(estado.cartas)[0]
    estado = voltearCarta(voltearCarta(estado, primero), segundo)
    expect(estado.volteadas).toHaveLength(0)
    expect(estaCartaVolteada(estado, primero) && estaCartaVolteada(estado, segundo)).toBe(true)
    expect(voltearCarta(estado, primero)).toBe(estado)
    estado = ocultarNoEmparejadas(estado)
    expect(estaCartaVolteada(estado, primero)).toBe(true)
  })

  it('las cartas distintas se ocultan y cuentan un intento', () => {
    let estado = crearJuegoMemorama(crearMazo(imagenes, 4))
    const [primero, segundo] = buscarNoPareja(estado)
    estado = voltearCarta(voltearCarta(estado, primero), segundo)
    expect(estado.intentos).toBe(1)
    estado = ocultarNoEmparejadas(estado)
    expect(estaCartaVolteada(estado, primero) || estaCartaVolteada(estado, segundo)).toBe(false)
  })

  it('termina al encontrar todas las parejas', () => {
    let estado = crearJuegoMemorama(crearMazo(imagenes, 8))
    const grupos = parejasDe(estado.cartas)
    grupos.forEach(([primero, segundo], i) => {
      expect(estaMemoramaCompleto(estado)).toBe(false)
      estado = voltearCarta(voltearCarta(estado, primero), segundo)
      expect(estado.idsEmparejados.size).toBe(i + 1)
    })
    expect(estaMemoramaCompleto(estado)).toBe(true)
    expect(estado.intentos).toBe(8)
  })
})

describe('configuración de Memorama', () => {
  it('valida la categoría y la dificultad', () => {
    expect(
      leerConfiguracionMemorama(new URLSearchParams('categoria=fruits&dificultad=expert')),
    ).toEqual({
      categoria: 'fruits',
      dificultad: 'expert',
    })
    expect(
      leerConfiguracionMemorama(new URLSearchParams('categoria=fruits&dificultad=medium')),
    ).toBeNull()
    expect(leerConfiguracionMemorama(new URLSearchParams('dificultad=easy'))).toBeNull()
  })
})
