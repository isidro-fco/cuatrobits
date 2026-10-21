import { useState } from 'react'
import { BackButton } from '../components/BackButton'
import { Check } from '../components/icons'
import { PageShell } from '../components/PageShell'
import { PixelSprite } from '../components/PixelSprite'
import { getAvatar } from '../data/avatars'
import { avatarSprite, COSMETICS, type CosmeticItem, type CosmeticKind } from '../data/cosmetics'
import { playSfx } from '../services/audio'
import { useActivePlayer, usePlayerStore } from '../stores/playerStore'
import type { Player } from '../types'
import { formatNumber } from '../utils/format'

const SECTIONS: { kind: CosmeticKind; title: string }[] = [
  { kind: 'color', title: 'Colores' },
  { kind: 'accessory', title: 'Accesorios' },
]

function ItemCard({ item, player, onBuy }: { item: CosmeticItem; player: Player; onBuy: (item: CosmeticItem) => void }) {
  const equipItem = usePlayerStore((s) => s.equipItem)
  const owned = player.items.includes(item.id)
  const equipped = player.bitbot[item.kind] === item.id
  const missing = item.price - player.bits
  // Vista previa: el avatar del jugador con su apariencia actual y este artículo puesto
  const preview = avatarSprite(player.avatar, { ...player.bitbot, [item.kind]: item.id })

  let action
  if (equipped) {
    action = (
      <span className="pill pill--mint">
        <Check /> En uso
      </span>
    )
  } else if (owned) {
    action = (
      <button
        type="button"
        className="btn btn--soft btn--small"
        onClick={() => {
          equipItem(player.id, item.id)
          playSfx('select')
        }}
      >
        Usar
      </button>
    )
  } else {
    action = (
      <>
        <button
          type="button"
          className="btn btn--primary btn--small"
          disabled={missing > 0}
          aria-label={`Comprar ${item.name} por ${item.price} Bits`}
          onClick={() => onBuy(item)}
        >
          Comprar · {item.price} Bits
        </button>
        {missing > 0 && <span className="shop-item__hint">Te faltan {missing} Bits</span>}
      </>
    )
  }

  return (
    <li className="shop-item card" data-equipped={equipped}>
      <span className="shop-item__preview" aria-hidden>
        <PixelSprite sprite={preview} size={72} />
      </span>
      <strong>{item.name}</strong>
      <span className="shop-item__action">{action}</span>
    </li>
  )
}

/** Taller de BitBot: artículos cosméticos que se compran con Bits (sección 9.4) */
export function WorkshopPage() {
  const player = useActivePlayer()!
  const buyItem = usePlayerStore((s) => s.buyItem)
  const equipItem = usePlayerStore((s) => s.equipItem)
  const [message, setMessage] = useState('')

  function buy(item: CosmeticItem) {
    if (!buyItem(player.id, item.id)) return
    equipItem(player.id, item.id)
    playSfx('buy')
    setMessage(`¡Compraste ${item.name}! Tu avatar ya lo está usando.`)
  }

  return (
    <PageShell actions={<BackButton />}>
      <div className="page-title">
        <h1>Taller de BitBot</h1>
        <p>Usa tus Bits para cambiar el estilo de tu avatar. ¡Solo cambia su apariencia, no da ventajas en los juegos!</p>
      </div>

      <div className="workshop">
        <section className="card workshop__preview" aria-label="Tu avatar">
          <span className="workshop__bitbot" style={{ background: getAvatar(player.avatar).background }}>
            <PixelSprite sprite={avatarSprite(player.avatar, player.bitbot)} size="100%" title={getAvatar(player.avatar).name} />
          </span>
          <div className="bits-badge" aria-label={`Tienes ${player.bits} Bits`}>
            <span className="bits-badge__coin" aria-hidden>
              B
            </span>
            {formatNumber(player.bits)} Bits
          </div>
          <p className="workshop__tip">Ganas Bits al terminar cada partida, ¡y más si ganas o completas el reto!</p>
          <p className="workshop__message" role="status">
            {message}
          </p>
        </section>

        <div className="workshop__catalog">
          {SECTIONS.map((section) => (
            <section key={section.kind} aria-labelledby={`shop-${section.kind}`}>
              <h2 id={`shop-${section.kind}`}>{section.title}</h2>
              <ul className="shop-grid">
                {COSMETICS.filter((item) => item.kind === section.kind).map((item) => (
                  <ItemCard key={item.id} item={item} player={player} onBuy={buy} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
