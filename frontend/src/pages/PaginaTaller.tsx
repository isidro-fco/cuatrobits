/**
 * Archivo: PaginaTaller.tsx
 * Módulo: frontend / pages
 * Descripción: Taller de BitBot: compra y equipa colores y accesorios con Bits.
 * Requerimientos: RF49
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useState } from 'react'

// ---------- Módulos internos ----------
import { BotonRegresar } from '../components/BotonRegresar'
import { IconoPalomita } from '../components/iconos'
import { MarcoPagina } from '../components/MarcoPagina'
import { SpritePixel } from '../components/SpritePixel'
import { obtenerAvatar } from '../data/avatares'
import {
  spriteAvatar,
  COSMETICOS,
  type ArticuloCosmetico,
  type TipoCosmetico,
} from '../data/cosmeticos'
import { reproducirEfecto } from '../services/audio'
import { useJugadorActivo, useJugadorStore } from '../stores/useJugadorStore'
import type { Jugador } from '../types'
import { formatearNumero } from '../utils/formato'

// ---------- Constantes ----------
/** Secciones del Taller y el tipo de artículo de cada una */
const SECCIONES: { tipo: TipoCosmetico; titulo: string }[] = [
  { tipo: 'color', titulo: 'Colores' },
  { tipo: 'accesorio', titulo: 'Accesorios' },
]

// ---------- Componente PaginaTaller ----------
function TarjetaArticulo({
  articulo,
  jugador,
  alComprar,
}: {
  articulo: ArticuloCosmetico
  jugador: Jugador
  alComprar: (articulo: ArticuloCosmetico) => void
}) {
  const equiparArticulo = useJugadorStore((estado) => estado.equiparArticulo)
  const esPropio = jugador.articulos.includes(articulo.id)
  const estaEquipado = jugador.bitbot[articulo.tipo] === articulo.id
  const faltante = articulo.precio - jugador.bits
  // Vista previa: el avatar del jugador con su apariencia actual y este artículo puesto
  const vistaPrevia = spriteAvatar(jugador.avatar, {
    ...jugador.bitbot,
    [articulo.tipo]: articulo.id,
  })

  let accion
  if (estaEquipado) {
    accion = (
      <span className="pill pill--mint">
        <IconoPalomita /> En uso
      </span>
    )
  } else if (esPropio) {
    accion = (
      <button
        type="button"
        className="btn btn--soft btn--small"
        onClick={() => {
          equiparArticulo(jugador.id, articulo.id)
          reproducirEfecto('select')
        }}
      >
        Usar
      </button>
    )
  } else {
    accion = (
      <>
        <button
          type="button"
          className="btn btn--primary btn--small"
          disabled={faltante > 0}
          aria-label={`Comprar ${articulo.nombre} por ${articulo.precio} Bits`}
          onClick={() => alComprar(articulo)}
        >
          Comprar · {articulo.precio} Bits
        </button>
        {faltante > 0 && <span className="shop-item__hint">Te faltan {faltante} Bits</span>}
      </>
    )
  }

  return (
    <li className="shop-item card" data-equipped={estaEquipado}>
      <span className="shop-item__preview" aria-hidden>
        <SpritePixel sprite={vistaPrevia} tamano={72} />
      </span>
      <strong>{articulo.nombre}</strong>
      <span className="shop-item__action">{accion}</span>
    </li>
  )
}

/**
 * Taller de BitBot: artículos cosméticos que se compran con Bits (sección 9.4)
 * @returns Pantalla del Taller
 * @see RF49
 */
export function PaginaTaller() {
  const jugador = useJugadorActivo()!
  const comprarArticulo = useJugadorStore((estado) => estado.comprarArticulo)
  const equiparArticulo = useJugadorStore((estado) => estado.equiparArticulo)
  // Aviso de la última compra; también se anuncia a los lectores de pantalla (role=status)
  const [mensaje, asignarMensaje] = useState('')

  function comprar(articulo: ArticuloCosmetico) {
    if (!comprarArticulo(jugador.id, articulo.id)) {
      return
    }
    equiparArticulo(jugador.id, articulo.id)
    reproducirEfecto('buy')
    asignarMensaje(`¡Compraste ${articulo.nombre}! Tu avatar ya lo está usando.`)
  }

  return (
    <MarcoPagina acciones={<BotonRegresar />}>
      <div className="page-title">
        <h1>Taller de BitBot</h1>
        <p>
          Usa tus Bits para cambiar el estilo de tu avatar. ¡Solo cambia su apariencia, no da
          ventajas en los juegos!
        </p>
      </div>

      <div className="workshop">
        <section className="card workshop__preview" aria-label="Tu avatar">
          <span
            className="workshop__bitbot"
            style={{ background: obtenerAvatar(jugador.avatar).fondo }}
          >
            <SpritePixel
              sprite={spriteAvatar(jugador.avatar, jugador.bitbot)}
              tamano="100%"
              titulo={obtenerAvatar(jugador.avatar).nombre}
            />
          </span>
          <div className="bits-badge" aria-label={`Tienes ${jugador.bits} Bits`}>
            <span className="bits-badge__coin" aria-hidden>
              B
            </span>
            {formatearNumero(jugador.bits)} Bits
          </div>
          <p className="workshop__tip">
            Ganas Bits al terminar cada partida, ¡y más si ganas o completas el reto!
          </p>
          <p className="workshop__message" role="status">
            {mensaje}
          </p>
        </section>

        <div className="workshop__catalog">
          {SECCIONES.map((seccion) => (
            <section key={seccion.tipo} aria-labelledby={`shop-${seccion.tipo}`}>
              <h2 id={`shop-${seccion.tipo}`}>{seccion.titulo}</h2>
              <ul className="shop-grid">
                {COSMETICOS.filter((articulo) => articulo.tipo === seccion.tipo).map((articulo) => (
                  <TarjetaArticulo
                    key={articulo.id}
                    articulo={articulo}
                    jugador={jugador}
                    alComprar={comprar}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </MarcoPagina>
  )
}
