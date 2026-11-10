/**
 * Archivo: PaginaJuego.tsx
 * Módulo: frontend / pages
 * Descripción: Pantalla que aloja cada minijuego: pausa, cronómetro, registro de la partida y
 *              resultados.
 * Requerimientos: RF09, RF21, RF46, RF53, RF54, RF63, RIU07, RIU09
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'

// ---------- Módulos internos ----------
import { CronometroJuego } from '../components/CronometroJuego'
import { IconoFlechaDerecha, IconoInicio, IconoPausa } from '../components/iconos'
import { Modal } from '../components/Modal'
import { MarcoPagina } from '../components/MarcoPagina'
import { MenuPausa } from '../components/MenuPausa'
import { JUEGOS, esIdJuego } from '../data/juegos'
import { TableroEsferas } from '../games/esferas/TableroEsferas'
import { leerConfiguracionEsferas } from '../games/esferas/configuracionEsferas'
import { JuegoBitBot } from '../games/bitbot/JuegoBitBot'
import { leerConfiguracionBitBot } from '../games/bitbot/configuracionBitBot'
import { leerConfiguracionConecta4 } from '../games/conecta4/configuracionConecta4'
import { TableroConecta4 } from '../games/conecta4/TableroConecta4'
import { leerConfiguracionMemorama } from '../games/memorama/configuracionMemorama'
import { TableroMemorama } from '../games/memorama/TableroMemorama'
import type { DesenlacePartida } from '../games/tipos'
import { verificarLogros } from '../services/servicioLogros'
import { reproducirEfecto, type NombreEfecto } from '../services/audio'
import { useHistorialStore } from '../stores/useHistorialStore'
import { useJugadorActivo, useJugadorStore } from '../stores/useJugadorStore'
import { useAjustesStore } from '../stores/useAjustesStore'
import type { IdJuego, Partida } from '../types'
import { calcularNivel } from '../utils/progresion'
import { bitsPorPartida, xpPorPartida } from '../utils/recompensas'
import { Cronometro } from '../utils/cronometro'
import type { EstadoResultados } from './PaginaResultados'

// ---------- Tipos ----------
interface PropsTablero {
  estaPausado: boolean
  alFinalizar: (desenlace: DesenlacePartida) => void
}

// ---------- Constantes ----------
/** Efecto de sonido de cada resultado */
const SONIDOS_DESENLACE: Record<Partida['resultado'], NombreEfecto> = {
  win: 'win',
  completed: 'win',
  draw: 'draw',
  loss: 'lose',
}

// ---------- Componente PaginaJuego ----------
/** Tablero del juego con la configuración de la URL, o `null` si no es válida */
function renderizarTablero(
  juego: IdJuego,
  parametros: URLSearchParams,
  props: PropsTablero,
): ReactNode | null {
  switch (juego) {
    case 'connect-four': {
      const configuracion = leerConfiguracionConecta4(parametros)
      return configuracion && <TableroConecta4 configuracion={configuracion} {...props} />
    }
    case 'bitbot': {
      const configuracion = leerConfiguracionBitBot(parametros)
      return configuracion && <JuegoBitBot configuracion={configuracion} {...props} />
    }
    case 'ball-sort': {
      const configuracion = leerConfiguracionEsferas(parametros)
      return configuracion && <TableroEsferas configuracion={configuracion} {...props} />
    }
    case 'memory': {
      const configuracion = leerConfiguracionMemorama(parametros)
      return configuracion && <TableroMemorama configuracion={configuracion} {...props} />
    }
  }
}

function crearRegistro(
  jugadorId: string,
  juego: IdJuego,
  desenlace: DesenlacePartida,
  duracionMs: number,
  recompensas: { xp: number; bits: number },
): Partida {
  return {
    id: crypto.randomUUID(),
    jugadorId,
    juego,
    resultado: desenlace.resultado,
    duracionMs,
    xpObtenida: recompensas.xp,
    bitsObtenidos: recompensas.bits,
    resumen: desenlace.resumen,
    detalles: desenlace.detalles,
    jugadaEn: new Date().toISOString(),
    estadoSincronizacion: 'pending',
  }
}

/**
 * Pantalla que aloja cada minijuego: pausa, cronómetro, registro de la partida y resultados.
 * @returns Pantalla del juego o de resultados
 * @see RF09, RF21, RF53, RF54, RF63, RIU07, RIU09
 */
export function PaginaJuego() {
  const { idJuego } = useParams()
  if (!esIdJuego(idJuego)) {
    return <Navigate to="/" replace />
  }
  return <PantallaJuego key={idJuego} juego={idJuego} />
}

function PantallaJuego({ juego }: { juego: IdJuego }) {
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [parametros] = useSearchParams()
  const jugador = useJugadorActivo()!
  const agregarRegistro = useHistorialStore((estado) => estado.agregarRegistro)
  const agregarRecompensas = useJugadorStore((estado) => estado.agregarRecompensas)
  const esCronometroVisible = useAjustesStore((estado) => estado.esCronometroVisible)

  // Verdadero mientras el menú de pausa está abierto
  const [estaPausado, asignarEstaPausado] = useState(false)
  // Cambiar la clave vuelve a montar la partida con un estado nuevo, sin temporizadores previos
  const [ronda, asignarRonda] = useState(0)
  // Cronómetro de la partida actual; se reemplaza al reiniciar
  const [cronometro, asignarCronometro] = useState(() => new Cronometro())
  // Resultados de la partida terminada, o null mientras se juega
  const [resultadosFinales, asignarResultadosFinales] = useState<EstadoResultados | null>(null)

  useEffect(() => {
    if (estaPausado || resultadosFinales) {
      cronometro.pausar()
    } else {
      cronometro.iniciar()
    }
  }, [estaPausado, resultadosFinales, cronometro])

  function manejarFin(desenlace: DesenlacePartida) {
    cronometro.pausar()
    const duracionMs = Math.round(cronometro.transcurrido())
    const recompensas = {
      xp: xpPorPartida(juego, desenlace.resultado),
      bits: bitsPorPartida(desenlace.resultado),
    }
    agregarRegistro(crearRegistro(jugador.id, juego, desenlace, duracionMs, recompensas))
    agregarRecompensas(jugador.id, recompensas)
    const nivelAntes = calcularNivel(jugador.xp).nivel
    const nivelDespues = calcularNivel(jugador.xp + recompensas.xp).nivel
    const logros = verificarLogros(jugador.id)

    reproducirEfecto(SONIDOS_DESENLACE[desenlace.resultado])
    if (nivelDespues > nivelAntes) {
      reproducirEfecto('levelUp', 900)
    }
    if (logros.length > 0) {
      reproducirEfecto('unlock', nivelDespues > nivelAntes ? 1700 : 900)
    }

    asignarResultadosFinales({
      juego,
      rutaRepetir: ubicacion.pathname + ubicacion.search,
      desenlace: desenlace.resultado,
      duracionMs,
      estadisticas: desenlace.estadisticas,
      mensaje: desenlace.mensaje,
      xp: recompensas.xp,
      bits: recompensas.bits,
      subidaNivel: nivelDespues > nivelAntes ? nivelDespues : undefined,
      logros: logros.map((logro) => logro.nombre),
    })
  }

  function reiniciar() {
    asignarRonda((rondaAnterior) => rondaAnterior + 1)
    asignarCronometro(new Cronometro())
    asignarResultadosFinales(null)
    asignarEstaPausado(false)
  }

  const tablero = renderizarTablero(juego, parametros, { estaPausado, alFinalizar: manejarFin })
  if (tablero === null) {
    return <Navigate to={JUEGOS[juego].rutaEntrada} replace />
  }
  const informacion = JUEGOS[juego]

  return (
    <MarcoPagina
      acciones={
        <>
          {esCronometroVisible && <CronometroJuego cronometro={cronometro} />}
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={() => asignarEstaPausado(true)}
            disabled={resultadosFinales !== null}
          >
            <IconoPausa />
            Pausa
          </button>
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={() => navegar('/')}
          >
            <IconoInicio />
            Salir al lobby
          </button>
        </>
      }
      ancho="medium"
    >
      <div className="page-title page-title--compact">
        <h1>{informacion.nombre}</h1>
        <p>{informacion.lema}</p>
      </div>

      {resultadosFinales && (
        <div className="finish-banner card" role="alert">
          <p>
            <strong>{resultadosFinales.mensaje ?? '¡Partida terminada!'}</strong>
          </p>
          <button
            type="button"
            className="btn btn--primary"
            autoFocus
            onClick={() => navegar('/resultados', { state: resultadosFinales })}
          >
            Ver resultados
            <IconoFlechaDerecha />
          </button>
        </div>
      )}

      <section key={ronda} className="card game-area" aria-label="Área de juego">
        {tablero}
      </section>

      <Modal
        estaAbierto={estaPausado}
        alCerrar={() => asignarEstaPausado(false)}
        etiquetadoPor="pause-title"
        tamano="large"
      >
        <MenuPausa alReanudar={() => asignarEstaPausado(false)} alReiniciar={reiniciar} />
      </Modal>
    </MarcoPagina>
  )
}
