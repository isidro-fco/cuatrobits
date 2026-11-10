/**
 * Archivo: JuegoBitBot.tsx
 * Módulo: frontend / games / bitbot
 * Descripción: Pantalla de juego de Arma a BitBot: palabra oculta, teclado en pantalla y robot.
 * Requerimientos: RF26, RF27, RF28, RF29, RF30, RIU10, RIU12
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useEffect, useState } from 'react'

// ---------- Módulos internos ----------
import { GlifoPixel } from '../../components/GlifoPixel'
import { IconoPixel } from '../../components/IconoPixel'
import { CATEGORIAS, DIFICULTADES_BITBOT } from '../../data/categorias'
import { CONTENIDO } from '../../data/contenido'
import { colorCuerpoBitBot, BITBOT_PREDETERMINADO } from '../../data/cosmeticos'
import { reproducirEfecto } from '../../services/audio'
import { useJugadorActivo } from '../../stores/useJugadorStore'
import type { PropsJuego } from '../tipos'
import { RobotBitBot } from './RobotBitBot'
import type { ConfiguracionBitBot } from './configuracionBitBot'
import {
  piezasEnsambladas,
  intentosRestantes,
  letrasCorrectas,
  crearJuegoBitBot,
  cantidadErrores,
  obtenerSituacionBitBot,
  adivinarLetra,
  FILAS_TECLADO,
  MAX_ERRORES_BITBOT,
  palabraOculta,
  normalizarLetra,
  seleccionarPalabra,
  palabrasRecientesAEvitar,
  letrasIncorrectas,
} from './logicaBitBot'
import { obtenerRecientes, recordarRecientes } from '../../utils/recientes'

// ---------- Componente JuegoBitBot ----------
/**
 * Pantalla de juego de Arma a BitBot: palabra oculta, teclado en pantalla y robot.
 * @param props Propiedades del componente
 * @param props.configuracion Configuración de la partida leída de la URL
 * @param props.estaPausado Verdadero mientras el menú de pausa está abierto
 * @param props.alFinalizar Función que recibe el desenlace al terminar la partida
 * @returns Área de juego con el robot, la palabra y el teclado
 * @see RF26, RF27, RF28, RF29, RIU10, RIU12
 */
export function JuegoBitBot({
  configuracion,
  estaPausado,
  alFinalizar,
}: PropsJuego<ConfiguracionBitBot>) {
  // Palabra de la partida; se elige una vez al montar el juego
  const [entrada] = useState(() => {
    // Las palabras de las últimas partidas se evitan para que no se repitan tan seguido
    const palabras = CONTENIDO[configuracion.categoria].palabras
    const lista = `bitbot:${configuracion.categoria}`
    const elegido = seleccionarPalabra(palabras, obtenerRecientes(lista))
    recordarRecientes(lista, [elegido.palabra], palabrasRecientesAEvitar(palabras.length))
    return elegido
  })
  // Letras elegidas y palabra de la partida
  const [estado, asignarEstado] = useState(() => crearJuegoBitBot(entrada.palabra))
  const apariencia = useJugadorActivo()?.bitbot ?? BITBOT_PREDETERMINADO
  const estatus = obtenerSituacionBitBot(estado)
  const categoria = CATEGORIAS.find((opcion) => opcion.id === configuracion.categoria)!
  const nombreDificultad = DIFICULTADES_BITBOT.find(
    (opcion) => opcion.id === configuracion.dificultad,
  )!.nombre

  function adivinanza(letra: string) {
    const siguiente = adivinarLetra(estado, letra)
    if (siguiente === estado) {
      return
    }
    asignarEstado(siguiente)

    const fin = obtenerSituacionBitBot(siguiente)
    if (fin === 'playing') {
      reproducirEfecto(cantidadErrores(siguiente) > cantidadErrores(estado) ? 'wrong' : 'correct')
      return
    }
    const errores = cantidadErrores(siguiente)
    alFinalizar({
      resultado: fin === 'won' ? 'win' : 'loss',
      resumen:
        `${categoria.nombre} · ${entrada.palabra} · ${errores} de ` +
        `${MAX_ERRORES_BITBOT} errores`,
      estadisticas: [
        { etiqueta: 'Palabra', valor: entrada.palabra },
        { etiqueta: 'Errores', valor: `${errores} de ${MAX_ERRORES_BITBOT}` },
      ],
      mensaje: fin === 'won' ? '¡BitBot está completo!' : `La palabra era ${entrada.palabra}.`,
      detalles: {
        categoria: configuracion.categoria,
        dificultad: configuracion.dificultad,
        palabra: entrada.palabra,
        letrasCorrectas: letrasCorrectas(siguiente),
        letrasIncorrectas: letrasIncorrectas(siguiente),
        intentosUsados: siguiente.adivinadas.length,
        errores,
      },
    })
  }

  // Teclado físico
  useEffect(() => {
    if (estaPausado || estatus !== 'playing') {
      return
    }
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.ctrlKey || evento.metaKey || evento.altKey || evento.key.length !== 1) {
        return
      }
      const letra = normalizarLetra(evento.key)
      if (FILAS_TECLADO.some((fila) => fila.includes(letra))) {
        adivinanza(letra)
      }
    }
    window.addEventListener('keydown', alPresionarTecla)
    return () => window.removeEventListener('keydown', alPresionarTecla)
  })

  const incorrecto = new Set(letrasIncorrectas(estado))
  const derecha = new Set(letrasCorrectas(estado))
  const oculta = palabraOculta(estado)
  const izquierda = intentosRestantes(estado)

  return (
    <div className="bitbot">
      <div className="bitbot__top">
        <RobotBitBot
          ensambladas={piezasEnsambladas(estado)}
          estaCelebrando={estatus === 'won'}
          color={colorCuerpoBitBot(apariencia.color)}
        />
        <div className="bitbot__info">
          <span className="pill pill--blue">
            <IconoPixel emoji={categoria.emoji} tamano={16} /> {categoria.nombre} ·{' '}
            {nombreDificultad}
          </span>
          <p className="bitbot__hint">
            <strong>Pista:</strong> {entrada.pista}
          </p>
          <div
            className="bitbot__attempts"
            aria-label={`Te quedan ${izquierda} de ${MAX_ERRORES_BITBOT} intentos`}
          >
            <span>Intentos</span>
            <span className="bitbot__hearts" aria-hidden>
              {Array.from({ length: MAX_ERRORES_BITBOT }, (_, i) => (
                <span key={i} className={i < izquierda ? 'is-full' : ''}>
                  <GlifoPixel nombre={i < izquierda ? 'heart' : 'heartOutline'} />
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>

      <p className="game-status" role="status">
        {estatus === 'won' && '¡Adivinaste la palabra! BitBot está listo.'}
        {estatus === 'lost' && `¡Se acabaron los intentos! La palabra era ${estado.palabra}.`}
        {estatus === 'playing' &&
          `${oculta.filter((casilla) => casilla === null).length} letras por descubrir`}
      </p>

      <div
        className="bitbot__word"
        aria-label={`Palabra: ${oculta.map((casilla) => casilla ?? 'espacio vacío').join(', ')}`}
      >
        {[...estado.palabra].map((caracter, i) => {
          const mostrado = oculta[i]
          return (
            <span
              key={i}
              className={
                `bitbot__slot ${mostrado ? 'is-shown' : ''} ` +
                `${estatus === 'lost' && !mostrado ? 'is-revealed' : ''}`
              }
              aria-hidden
            >
              {mostrado ?? (estatus === 'lost' ? caracter : '')}
            </span>
          )
        })}
      </div>

      <div className="keyboard" role="group" aria-label="Teclado">
        {FILAS_TECLADO.map((fila) => (
          <div key={fila} className="keyboard__row">
            {[...fila].map((letra) => {
              const estadoTecla = derecha.has(letra)
                ? 'right'
                : incorrecto.has(letra)
                  ? 'wrong'
                  : undefined
              return (
                <button
                  key={letra}
                  type="button"
                  className="keyboard__key"
                  data-state={estadoTecla}
                  disabled={estadoTecla !== undefined || estatus !== 'playing'}
                  aria-label={
                    estadoTecla
                      ? `${letra}, ${estadoTecla === 'right' ? 'correcta' : 'incorrecta'}`
                      : letra
                  }
                  onClick={() => adivinanza(letra)}
                >
                  {letra}
                  {estadoTecla && (
                    <span className="keyboard__mark" aria-hidden>
                      <GlifoPixel nombre={estadoTecla === 'right' ? 'check' : 'wrong'} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
