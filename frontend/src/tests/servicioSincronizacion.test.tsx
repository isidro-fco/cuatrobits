/**
 * Archivo: servicioSincronizacion.test.tsx
 * Módulo: frontend / tests
 * Descripción: Pruebas del registro con el servidor y de la sincronización de partidas.
 * Requerimientos: RF54, RF55, RF56, RNF11
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
import { useSincronizacionStore } from '../stores/useSincronizacionStore'
import type { Partida } from '../types'
import { apiFalsa } from './apiFalsa'

// ---------- Pruebas ----------
beforeEach(() => {
  localStorage.clear()
  useJugadorStore.setState({ perfiles: [], idActivo: null })
  useHistorialStore.setState({ registros: [] })
  useSincronizacionStore.setState({ estado: 'idle', ultimaSincronizacion: null })
})

function renderizarEn(ruta: string) {
  const enrutador = createMemoryRouter(rutasAplicacion, { initialEntries: [ruta] })
  render(<RouterProvider router={enrutador} />)
  return enrutador
}

function registro(jugadorId: string, sobrescrituras: Partial<Partida> = {}): Partida {
  return {
    id: crypto.randomUUID(),
    jugadorId,
    juego: 'memory',
    resultado: 'completed',
    duracionMs: 30_000,
    xpObtenida: 20,
    resumen: 'Frutas · Fácil · 5 intentos',
    detalles: { categoria: 'fruits', dificultad: 'easy', parejas: 4, intentos: 5 },
    jugadaEn: new Date().toISOString(),
    estadoSincronizacion: 'pending',
    ...sobrescrituras,
  }
}

const estatuses = () =>
  useHistorialStore.getState().registros.map((registro) => registro.estadoSincronizacion)

describe('registro con el servidor (sección 4.1)', () => {
  it('el servidor asigna el identificador del perfil', async () => {
    const usuario = userEvent.setup()
    renderizarEn('/registro')
    await usuario.type(await screen.findByLabelText('¿Cómo te llamas?'), 'Luna')
    await usuario.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))
    await screen.findByRole('heading', { name: '¡Elige un minijuego!' })

    const [jugadorServidor] = apiFalsa.jugadores.values()
    const [perfil] = useJugadorStore.getState().perfiles
    expect(perfil).toMatchObject({ id: jugadorServidor.id, username: 'Luna', estaRegistrado: true })
  })

  it('rechaza un nombre que otro dispositivo ya registró', async () => {
    apiFalsa.jugadores.set('otro', { id: 'otro', username: 'luna', avatar: 'cat' })
    const usuario = userEvent.setup()
    renderizarEn('/registro')
    await usuario.type(await screen.findByLabelText('¿Cómo te llamas?'), 'LUNA')
    await usuario.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))
    expect(
      await screen.findByText('Ese nombre ya está en uso. ¡Prueba con otro!'),
    ).toBeInTheDocument()
    expect(useJugadorStore.getState().perfiles).toHaveLength(0)
  })

  it('sin conexión avisa y no crea el perfil', async () => {
    apiFalsa.estaSinConexion = true
    const usuario = userEvent.setup()
    renderizarEn('/registro')
    await usuario.type(await screen.findByLabelText('¿Cómo te llamas?'), 'Luna')
    await usuario.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))
    expect(await screen.findByText(/No pudimos conectar con el servidor/)).toBeInTheDocument()
    expect(useJugadorStore.getState().perfiles).toHaveLength(0)
    expect(screen.getByRole('button', { name: /Crear perfil y jugar/ })).toBeEnabled()
  })
})

describe('sincronización de partidas (sección 13.4)', () => {
  function jugadorRegistrado() {
    const jugador = useJugadorStore.getState().agregarPerfil('Luna', 'cat', crypto.randomUUID())
    apiFalsa.jugadores.set(jugador.id, { id: jugador.id, username: 'Luna', avatar: 'cat' })
    return jugador
  }

  it('envía las pendientes y las marca como sincronizadas', async () => {
    const jugador = jugadorRegistrado()
    useHistorialStore.setState({ registros: [registro(jugador.id), registro(jugador.id)] })
    await sincronizarPartidasPendientes()
    expect(estatuses()).toEqual(['synced', 'synced'])
    expect(apiFalsa.partidas.size).toBe(2)
    expect(useSincronizacionStore.getState()).toMatchObject({ estado: 'idle' })
  })

  it('sin conexión las partidas siguen pendientes y se envían al reconectar', async () => {
    const jugador = jugadorRegistrado()
    useHistorialStore.setState({ registros: [registro(jugador.id)] })
    apiFalsa.estaSinConexion = true
    await sincronizarPartidasPendientes()
    expect(estatuses()).toEqual(['pending'])
    expect(useSincronizacionStore.getState().estado).toBe('offline')

    apiFalsa.estaSinConexion = false
    await sincronizarPartidasPendientes()
    expect(estatuses()).toEqual(['synced'])
  })

  it('reintentar no duplica partidas en el servidor', async () => {
    const jugador = jugadorRegistrado()
    const juego = registro(jugador.id)
    useHistorialStore.setState({ registros: [juego] })
    await sincronizarPartidasPendientes()
    // Simula una respuesta perdida: el navegador cree que sigue pendiente
    useHistorialStore.setState({ registros: [{ ...juego, estadoSincronizacion: 'pending' }] })
    await sincronizarPartidasPendientes()
    expect(estatuses()).toEqual(['synced'])
    expect(apiFalsa.partidas.size).toBe(1)
  })

  it('las partidas rechazadas por el servidor quedan solo en el dispositivo', async () => {
    const jugador = jugadorRegistrado()
    useHistorialStore.setState({
      registros: [registro(jugador.id, { xpObtenida: 999 }), registro(jugador.id)],
    })
    await sincronizarPartidasPendientes()
    expect(estatuses()).toEqual(['rejected', 'synced'])
    expect(useHistorialStore.getState().registros[0].errorSincronizacion).toBe(
      'La partida no es válida.',
    )
  })

  it('registra con su mismo id los perfiles creados antes de la etapa 3', async () => {
    const heredado = useJugadorStore.getState().agregarPerfil('Sol', 'dino')
    useHistorialStore.setState({ registros: [registro(heredado.id)] })
    await sincronizarPartidasPendientes()
    expect(apiFalsa.jugadores.get(heredado.id)?.username).toBe('Sol')
    expect(useJugadorStore.getState().perfiles[0].estaRegistrado).toBe(true)
    expect(estatuses()).toEqual(['synced'])
  })

  it('si el nombre del perfil antiguo ya está tomado, conserva las partidas en local', async () => {
    apiFalsa.jugadores.set('otro', { id: 'otro', username: 'SOL', avatar: 'cat' })
    const heredado = useJugadorStore.getState().agregarPerfil('Sol', 'dino')
    useHistorialStore.setState({ registros: [registro(heredado.id)] })
    await sincronizarPartidasPendientes()
    expect(useJugadorStore.getState().perfiles[0].tieneConflictoNombre).toBe(true)
    expect(estatuses()).toEqual(['pending'])
  })

  it('envía en lotes de hasta 100 partidas', async () => {
    const jugador = jugadorRegistrado()
    useHistorialStore.setState({
      registros: Array.from({ length: 150 }, () => registro(jugador.id)),
    })
    await sincronizarPartidasPendientes()
    const lotes = apiFalsa.solicitudes.filter((solicitud) => solicitud.ruta === '/api/games/sync')
    expect(
      lotes.map((solicitud) => (solicitud.cuerpo as { partidas: unknown[] }).partidas.length),
    ).toEqual([100, 50])
    expect(estatuses().every((estatus) => estatus === 'synced')).toBe(true)
  })

  it('el historial muestra el estado de sincronización y permite reintentar', async () => {
    const jugador = jugadorRegistrado()
    useHistorialStore.setState({ registros: [registro(jugador.id)] })
    apiFalsa.estaSinConexion = true
    const usuario = userEvent.setup()
    renderizarEn('/historial')
    expect(await screen.findByText(/Sin conexión: 1 partida pendiente/)).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()

    apiFalsa.estaSinConexion = false
    await usuario.click(screen.getByRole('button', { name: 'Sincronizar ahora' }))
    await vi.waitFor(() => expect(screen.getByText('Sincronizado')).toBeInTheDocument())
    expect(
      screen.getByText('Todas tus partidas están guardadas en el servidor.'),
    ).toBeInTheDocument()
  })
})
