/**
 * Archivo: PaginaRecuperar.test.tsx
 * Módulo: frontend / tests
 * Descripción: Pruebas del código secreto y de la recuperación de perfiles.
 * Requerimientos: RNF12
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

function partidaServidor(
  jugadorId: string,
  sobrescrituras: Partial<Partida> = {},
): Omit<Partida, 'estadoSincronizacion'> {
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
    jugadaEn: '2026-10-01T10:00:00.000Z',
    ...sobrescrituras,
  }
}

/** Un jugador que ya existe en el servidor con dos partidas */
function sembrarServidor() {
  const id = crypto.randomUUID()
  apiFalsa.jugadores.set(id, { id, username: 'Luna', avatar: 'fox' })
  apiFalsa.codigos.set(id, 'K7QM-4TZP')
  const partidas = [
    partidaServidor(id),
    partidaServidor(id, { jugadaEn: '2026-10-02T10:00:00.000Z' }),
  ]
  for (const partida of partidas) {
    apiFalsa.partidas.set(partida.id, partida)
  }
  return { id, partidas }
}

async function llenarRecuperacion(username: string, codigo: string) {
  const usuario = userEvent.setup()
  await usuario.type(await screen.findByLabelText('Tu nombre de jugador'), username)
  await usuario.type(screen.getByLabelText('Tu código secreto'), codigo)
  await usuario.click(screen.getByRole('button', { name: /Recuperar mi perfil/ }))
  return usuario
}

describe('código secreto al crear el perfil', () => {
  it('el lobby lo muestra una vez y después queda en el perfil', async () => {
    const usuario = userEvent.setup()
    const enrutador = renderizarEn('/registro')
    await usuario.type(await screen.findByLabelText('¿Cómo te llamas?'), 'Sol')
    await usuario.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))

    expect(
      await screen.findByRole('heading', { name: '¡Guarda tu código secreto!' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/^Código secreto:/)).toHaveTextContent('C0DE-0001')
    await usuario.click(screen.getByRole('button', { name: 'Ya lo guardé' }))
    expect(jugador()).toMatchObject({
      codigoRecuperacion: 'C0DE-0001',
      esCodigoRecuperacionVisto: true,
    })
    expect(
      screen.queryByRole('heading', { name: '¡Guarda tu código secreto!' }),
    ).not.toBeInTheDocument()

    // En el perfil está oculto hasta pedirlo
    await enrutador.navigate('/perfil')
    expect(screen.queryByText('C0DE-0001')).not.toBeInTheDocument()
    await usuario.click(await screen.findByRole('button', { name: 'Mostrar mi código secreto' }))
    expect(screen.getByText('C0DE-0001')).toBeInTheDocument()
  })

  it('los perfiles creados antes pueden pedir su código una sola vez', async () => {
    const id = crypto.randomUUID()
    apiFalsa.jugadores.set(id, { id, username: 'Mar', avatar: 'dino' })
    useJugadorStore.getState().agregarPerfil('Mar', 'dino', id)
    const usuario = userEvent.setup()
    renderizarEn('/perfil')
    await usuario.click(await screen.findByRole('button', { name: 'Crear mi código secreto' }))
    expect(await screen.findByText('NUEV-0C0D')).toBeInTheDocument()
    expect(jugador().codigoRecuperacion).toBe('NUEV-0C0D')
  })

  it('si el código ya existe en otro dispositivo, lo explica', async () => {
    const id = crypto.randomUUID()
    apiFalsa.jugadores.set(id, { id, username: 'Mar', avatar: 'dino' })
    apiFalsa.codigos.set(id, 'OTRO-C0D1')
    useJugadorStore.getState().agregarPerfil('Mar', 'dino', id)
    const usuario = userEvent.setup()
    renderizarEn('/perfil')
    await usuario.click(await screen.findByRole('button', { name: 'Crear mi código secreto' }))
    expect(await screen.findByText(/ya tiene un código/)).toBeInTheDocument()
  })

  it('un perfil antiguo recibe su código al registrarse durante la sincronización', async () => {
    useJugadorStore.getState().agregarPerfil('Rio', 'cat')
    useHistorialStore
      .getState()
      .agregarRegistro({ ...partidaServidor(jugador().id), estadoSincronizacion: 'pending' })
    await sincronizarPartidasPendientes()
    expect(jugador()).toMatchObject({ estaRegistrado: true, codigoRecuperacion: 'C0DE-0001' })
    expect(jugador().esCodigoRecuperacionVisto).toBeFalsy()
  })
})

describe('recuperar un perfil', () => {
  it('en un dispositivo nuevo trae el perfil, el progreso y el historial', async () => {
    const { id, partidas } = sembrarServidor()
    const enrutador = renderizarEn('/registro')
    const usuario = userEvent.setup()
    await usuario.click(await screen.findByRole('link', { name: /Recupéralo/ }))
    await llenarRecuperacion('luna', 'k7qm 4tzp')

    await vi.waitFor(() => expect(enrutador.state.location.pathname).toBe('/'))
    expect(jugador()).toMatchObject({
      id,
      username: 'Luna',
      avatar: 'fox',
      xp: 40,
      bits: 10,
      estaRegistrado: true,
      codigoRecuperacion: 'K7QM-4TZP',
      esCodigoRecuperacionVisto: true,
    })
    const registros = useHistorialStore.getState().registros
    expect(registros.map((registro) => registro.id)).toEqual([partidas[1].id, partidas[0].id])
    expect(registros.every((registro) => registro.estadoSincronizacion === 'synced')).toBe(true)
    // No aparece el aviso del código: el jugador ya lo conoce
    expect(
      screen.queryByRole('heading', { name: '¡Guarda tu código secreto!' }),
    ).not.toBeInTheDocument()
  })

  it('con un código incorrecto muestra el error del servidor', async () => {
    sembrarServidor()
    renderizarEn('/recuperar')
    await llenarRecuperacion('Luna', 'AAAA-BBBB')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El nombre o el código secreto no son correctos.',
    )
    expect(useJugadorStore.getState().perfiles).toEqual([])
  })

  it(
    'si el perfil ya estaba en el dispositivo no duplica partidas ni pierde lo ' + 'pendiente',
    async () => {
      const { id, partidas } = sembrarServidor()
      useJugadorStore.getState().agregarPerfil('Luna', 'fox', id)
      useJugadorStore.getState().agregarRecompensas(id, { xp: 60, bits: 15 })
      const pendientes = { ...partidaServidor(id), estadoSincronizacion: 'pending' as const }
      useHistorialStore.setState({
        registros: [{ ...partidas[0], estadoSincronizacion: 'synced' }, pendientes],
      })

      renderizarEn('/recuperar')
      await llenarRecuperacion('Luna', 'K7QM-4TZP')

      await vi.waitFor(() => expect(jugador().codigoRecuperacion).toBe('K7QM-4TZP'))
      expect(useJugadorStore.getState().perfiles).toHaveLength(1)
      expect(jugador()).toMatchObject({ xp: 60, bits: 15 })
      const ids = useHistorialStore.getState().registros.map((registro) => registro.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(ids).toEqual(expect.arrayContaining([partidas[0].id, partidas[1].id, pendientes.id]))
    },
  )
})
