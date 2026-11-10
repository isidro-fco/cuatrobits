/**
 * Archivo: useJugadorStore.ts
 * Módulo: frontend / stores
 * Descripción: Store de perfiles y jugador activo (progreso, logros y artículos) guardado en
 *              localStorage.
 * Requerimientos: RF01, RF03, RF04, RF47, RF49, RDC03, RIE03
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------- Módulos internos ----------
import { BITBOT_PREDETERMINADO, buscarCosmetico, ARTICULOS_GRATIS } from '../data/cosmeticos'
import type { IdAvatar, Jugador } from '../types'
import { normalizarUsername } from '../utils/username'
import { traducirClaves } from '../utils/clavesAnteriores'

// ---------- Tipos ----------
interface EstadoJugadores {
  /** Perfiles creados en este dispositivo */
  perfiles: Jugador[]
  idActivo: string | null
  /**
   * `id` es el identificador asignado por el servidor y `tokenAutenticacion` el token con que se
   * registró
   */
  agregarPerfil: (
    username: string,
    avatar: IdAvatar,
    id?: string,
    tokenAutenticacion?: string,
  ) => Jugador
  cambiarA: (id: string) => void
  /** Suma la experiencia y los Bits de una partida; nunca resta */
  agregarRecompensas: (id: string, recompensas: { xp: number; bits: number }) => void
  /** Agrega los logros que aún no tenía y devuelve solo los nuevos */
  desbloquearLogros: (id: string, idsLogros: string[]) => string[]
  /** Compra un artículo de BitBot; devuelve `false` si no alcanzan los Bits o ya lo tenía */
  comprarArticulo: (id: string, idArticulo: string) => boolean
  /** Usa un artículo comprado */
  equiparArticulo: (id: string, idArticulo: string) => void
  /** El servidor ya registró (o descartó) estas compras */
  limpiarArticulosPendientes: (id: string, idsArticulos: string[]) => void
  actualizarPerfil: (
    id: string,
    cambios: Partial<
      Pick<
        Jugador,
        | 'estaRegistrado'
        | 'tieneConflictoNombre'
        | 'codigoRecuperacion'
        | 'esCodigoRecuperacionVisto'
        | 'tokenAutenticacion'
        | 'esRecuperacionNecesaria'
      >
    >,
  ) => void
  /** Agrega un perfil recuperado del servidor, o actualiza el que ya estaba, y lo activa */
  restaurarPerfil: (jugador: Jugador) => void
  estaUsernameOcupadoLocalmente: (username: string) => boolean
}

// ---------- Store useJugadorStore ----------
const actualizarJugador = (
  perfiles: Jugador[],
  id: string,
  cambio: (jugador: Jugador) => Jugador,
) => perfiles.map((jugador) => (jugador.id === id ? cambio(jugador) : jugador))

/** Store de los perfiles del dispositivo, guardado en localStorage (RF03) */
export const useJugadorStore = create<EstadoJugadores>()(
  persist(
    (set, get) => ({
      perfiles: [],
      idActivo: null,
      agregarPerfil: (username, avatar, id, tokenAutenticacion) => {
        const jugador: Jugador = {
          id: id ?? crypto.randomUUID(),
          username: username.trim(),
          avatar,
          xp: 0,
          bits: 0,
          logros: [],
          articulos: [...ARTICULOS_GRATIS],
          articulosPendientes: [],
          bitbot: { ...BITBOT_PREDETERMINADO },
          creadoEn: new Date().toISOString(),
          estaRegistrado: id !== undefined,
          ...(tokenAutenticacion && { tokenAutenticacion }),
        }
        set((estado) => ({ perfiles: [...estado.perfiles, jugador], idActivo: jugador.id }))
        return jugador
      },
      cambiarA: (id) => set({ idActivo: id }),
      agregarRecompensas: (id, { xp, bits }) =>
        set((estado) => ({
          perfiles: actualizarJugador(estado.perfiles, id, (jugador) => ({
            ...jugador,
            xp: jugador.xp + Math.max(0, xp),
            bits: jugador.bits + Math.max(0, bits),
          })),
        })),
      desbloquearLogros: (id, idsLogros) => {
        const jugador = get().perfiles.find((jugador) => jugador.id === id)
        if (!jugador) {
          return []
        }
        const nuevos = idsLogros.filter((logro) => !jugador.logros.includes(logro))
        if (nuevos.length > 0) {
          set((estado) => ({
            perfiles: actualizarJugador(estado.perfiles, id, (jugador) => ({
              ...jugador,
              logros: [...jugador.logros, ...nuevos],
            })),
          }))
        }
        return nuevos
      },
      comprarArticulo: (id, idArticulo) => {
        const jugador = get().perfiles.find((jugador) => jugador.id === id)
        const articulo = buscarCosmetico(idArticulo)
        if (
          !jugador ||
          !articulo ||
          jugador.articulos.includes(idArticulo) ||
          jugador.bits < articulo.precio
        ) {
          return false
        }
        set((estado) => ({
          perfiles: actualizarJugador(estado.perfiles, id, (jugador) => ({
            ...jugador,
            bits: jugador.bits - articulo.precio,
            articulos: [...jugador.articulos, idArticulo],
            articulosPendientes: [...jugador.articulosPendientes, idArticulo],
          })),
        }))
        return true
      },
      equiparArticulo: (id, idArticulo) => {
        const articulo = buscarCosmetico(idArticulo)
        if (!articulo) {
          return
        }
        set((estado) => ({
          perfiles: actualizarJugador(estado.perfiles, id, (jugador) =>
            jugador.articulos.includes(idArticulo)
              ? { ...jugador, bitbot: { ...jugador.bitbot, [articulo.tipo]: idArticulo } }
              : jugador,
          ),
        }))
      },
      limpiarArticulosPendientes: (id, idsArticulos) =>
        set((estado) => ({
          perfiles: actualizarJugador(estado.perfiles, id, (jugador) => ({
            ...jugador,
            articulosPendientes: jugador.articulosPendientes.filter(
              (articulo) => !idsArticulos.includes(articulo),
            ),
          })),
        })),
      restaurarPerfil: (restaurado) =>
        set((estado) => {
          const local = estado.perfiles.find((jugador) => jugador.id === restaurado.id)
          if (!local) {
            return { perfiles: [...estado.perfiles, restaurado], idActivo: restaurado.id }
          }
          // Ya estaba en este dispositivo: se conserva su progreso local, que puede tener partidas
          // pendientes
          const combinados: Jugador = {
            ...local,
            estaRegistrado: true,
            tieneConflictoNombre: false,
            esRecuperacionNecesaria: false,
            tokenAutenticacion: restaurado.tokenAutenticacion,
            codigoRecuperacion: restaurado.codigoRecuperacion,
            esCodigoRecuperacionVisto: true,
            logros: [...new Set([...local.logros, ...restaurado.logros])],
            articulos: [...new Set([...local.articulos, ...restaurado.articulos])],
          }
          return {
            perfiles: actualizarJugador(estado.perfiles, restaurado.id, () => combinados),
            idActivo: restaurado.id,
          }
        }),
      actualizarPerfil: (id, cambios) =>
        set((estado) => ({
          perfiles: actualizarJugador(estado.perfiles, id, (jugador) => ({
            ...jugador,
            ...cambios,
          })),
        })),
      estaUsernameOcupadoLocalmente: (username) => {
        const normalizado = normalizarUsername(username)
        return get().perfiles.some(
          (jugador) => normalizarUsername(jugador.username) === normalizado,
        )
      },
    }),
    {
      name: 'cuatrobits-players',
      version: 3,
      // Versión 2 (etapa 4): artículos y apariencia de BitBot.
      // Versión 3 (estándar de codificación): las claves guardadas pasan al español.
      migrate: (persistido, version) => {
        const estado = (version < 3 ? traducirClaves(persistido) : persistido) as {
          perfiles: Jugador[]
          idActivo: string | null
        }
        if (version < 2) {
          estado.perfiles = estado.perfiles.map((jugador) => ({
            ...jugador,
            articulos: jugador.articulos ?? [...ARTICULOS_GRATIS],
            articulosPendientes: jugador.articulosPendientes ?? [],
            bitbot: jugador.bitbot ?? { ...BITBOT_PREDETERMINADO },
          }))
        }
        return estado as EstadoJugadores
      },
    },
  ),
)

/**
 * Hook con el jugador activo.
 * @returns Jugador activo o null si no hay ninguno
 * @see RF03, RF04
 */
export function useJugadorActivo(): Jugador | null {
  return useJugadorStore(
    (estado) => estado.perfiles.find((jugador) => jugador.id === estado.idActivo) ?? null,
  )
}
