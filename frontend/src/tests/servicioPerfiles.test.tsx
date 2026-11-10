/**
 * Archivo: servicioPerfiles.test.tsx
 * Módulo: frontend / tests
 * Descripción: Pruebas del token del dispositivo y del registro con el servidor.
 * Requerimientos: RNF12, RLYE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'

// ---------- Módulos internos ----------
import { rutasAplicacion } from '../rutas'
import { sincronizarPartidasPendientes } from '../services/servicioSincronizacion'
import { useHistorialStore } from '../stores/useHistorialStore'
import { useJugadorStore } from '../stores/useJugadorStore'
import type { Partida } from '../types'
import { generarToken } from '../utils/token'
import { apiFalsa } from './apiFalsa'

// ---------- Pruebas ----------
beforeEach(() => {
  localStorage.clear()
  useJugadorStore.setState({ perfiles: [], idActivo: null })
  useHistorialStore.setState({ registros: [] })
})

function renderizarEn(ruta: string) {
  const enrutador = createMemoryRouter(rutasAplicacion, { initialEntries: [ruta] })
  render(<RouterProvider router={enrutador} />)
  return enrutador
}

const jugador = () => useJugadorStore.getState().perfiles[0]
const estatuses = () =>
  useHistorialStore.getState().registros.map((registro) => registro.estadoSincronizacion)

function partidaPendiente(jugadorId: string): Partida {
  return {
    id: crypto.randomUUID(),
    jugadorId,
    juego: 'memory',
    resultado: 'completed',
    duracionMs: 30_000,
    xpObtenida: 20,
    bitsObtenidos: 5,
    resumen: 'Frutas · Fácil · 5 intentos',
    detalles: { categoria: 'fruits', dificultad: 'easy', parejas: 4, intentos: 5 },
    jugadaEn: new Date().toISOString(),
    estadoSincronizacion: 'pending',
  }
}

describe('token del dispositivo (sección 4.3)', () => {
  it('es aleatorio y tiene 43 caracteres en base64url', () => {
    const token = generarToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(generarToken()).not.toBe(token)
  })

  it('se crea al registrarse y acompaña cada envío de partidas', async () => {
    const usuario = userEvent.setup()
    renderizarEn('/registro')
    await usuario.type(await screen.findByLabelText('¿Cómo te llamas?'), 'Sol')
    await usuario.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))
    await vi.waitFor(() => expect(jugador()?.tokenAutenticacion).toMatch(/^[A-Za-z0-9_-]{43}$/))

    const token = jugador().tokenAutenticacion
    expect(
      apiFalsa.solicitudes.find((solicitud) => solicitud.ruta === '/api/players')?.cuerpo,
    ).toMatchObject({ token })
    useHistorialStore.getState().agregarRegistro(partidaPendiente(jugador().id))
    await sincronizarPartidasPendientes()
    expect(
      apiFalsa.solicitudes.find((solicitud) => solicitud.ruta === '/api/games/sync')?.token,
    ).toBe(token)
    expect(estatuses()).toEqual(['synced'])
  })

  it(
    'los perfiles registrados antes de la autenticación obtienen su token al ' + 'sincronizar',
    async () => {
      const id = crypto.randomUUID()
      apiFalsa.jugadores.set(id, { id, username: 'Mar', avatar: 'dino' })
      useJugadorStore.getState().agregarPerfil('Mar', 'dino', id)
      useHistorialStore.getState().agregarRegistro(partidaPendiente(id))
      await sincronizarPartidasPendientes()
      expect(jugador().tokenAutenticacion).toBeDefined()
      expect(apiFalsa.tokens.get(id)).toEqual(new Set([jugador().tokenAutenticacion]))
      expect(estatuses()).toEqual(['synced'])
    },
  )

  it(
    'si otro dispositivo ya protegió el perfil, pide recuperarlo y conserva las ' + 'partidas',
    async () => {
      const id = crypto.randomUUID()
      apiFalsa.jugadores.set(id, { id, username: 'Mar', avatar: 'dino' })
      apiFalsa.tokens.set(id, new Set([generarToken()]))
      apiFalsa.codigos.set(id, 'K7QM-4TZP')
      useJugadorStore.getState().agregarPerfil('Mar', 'dino', id)
      useHistorialStore.getState().agregarRegistro(partidaPendiente(id))
      await sincronizarPartidasPendientes()
      expect(jugador().esRecuperacionNecesaria).toBe(true)
      expect(estatuses()).toEqual(['pending'])

      renderizarEn('/historial')
      expect(await screen.findByText(/protegido en otro dispositivo/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Sincronizar ahora' })).not.toBeInTheDocument()

      // Al recuperarlo con el código, este dispositivo queda autorizado y envía lo pendiente
      const usuario = userEvent.setup()
      renderizarEn('/recuperar')
      await usuario.type(await screen.findByLabelText('Tu nombre de jugador'), 'Mar')
      await usuario.type(screen.getByLabelText('Tu código secreto'), 'K7QM-4TZP')
      await usuario.click(screen.getByRole('button', { name: /Recuperar mi perfil/ }))
      await vi.waitFor(() => expect(jugador().esRecuperacionNecesaria).toBe(false))
      expect(apiFalsa.tokens.get(id)?.has(jugador().tokenAutenticacion!)).toBe(true)
      await sincronizarPartidasPendientes()
      expect(estatuses()).toEqual(['synced'])
    },
  )

  it('si el servidor olvidó el token, el perfil se registra de nuevo una sola vez', async () => {
    const id = crypto.randomUUID()
    const token = generarToken()
    useJugadorStore.getState().agregarPerfil('Rio', 'cat', id, token)
    useHistorialStore.getState().agregarRegistro(partidaPendiente(id))
    // El servidor no conoce ni al jugador ni al token, como si su base de datos se hubiera
    // reiniciado
    await sincronizarPartidasPendientes()
    expect(apiFalsa.jugadores.get(id)?.username).toBe('Rio')
    expect(apiFalsa.tokens.get(id)).toEqual(new Set([token]))
    expect(estatuses()).toEqual(['synced'])
    expect(
      apiFalsa.solicitudes.filter((solicitud) => solicitud.ruta === '/api/players'),
    ).toHaveLength(1)
  })

  it('las compras sin permiso no se descartan', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const id = crypto.randomUUID()
    const token = generarToken()
    apiFalsa.jugadores.set(id, { id, username: 'Rio', avatar: 'cat' })
    apiFalsa.tokens.set(id, new Set([token]))
    useJugadorStore.getState().agregarPerfil('Rio', 'cat', id, token)
    useJugadorStore.getState().agregarRecompensas(id, { xp: 0, bits: 40 })
    useJugadorStore.getState().comprarArticulo(id, 'accessory-cap')
    // Otro dispositivo protegió el perfil y el servidor ya no acepta este token
    apiFalsa.tokens.set(id, new Set([generarToken()]))
    await sincronizarPartidasPendientes()
    expect(jugador()).toMatchObject({
      articulosPendientes: ['accessory-cap'],
      esRecuperacionNecesaria: true,
    })
    vi.restoreAllMocks()
  })
})
