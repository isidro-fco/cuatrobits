import { useState } from 'react'
import { BackButton } from '../components/BackButton'
import { PageShell } from '../components/PageShell'
import { StatCard } from '../components/StatCard'
import { GAMES } from '../data/games'
import { useHistoryStore } from '../stores/historyStore'
import { syncPendingGames } from '../services/syncService'
import { useActivePlayer } from '../stores/playerStore'
import { useSyncStore } from '../stores/syncStore'
import type { GameRecord } from '../types'
import { formatDate, formatDuration } from '../utils/format'

const PAGE_SIZE = 8

const RESULT_LABELS: Record<GameRecord['result'], { text: string; className: string }> = {
  win: { text: 'Victoria', className: 'pill--mint' },
  loss: { text: 'Derrota', className: 'pill--orange' },
  draw: { text: 'Empate', className: 'pill--yellow' },
  completed: { text: 'Completada', className: 'pill--blue' },
}

export function HistoryPage() {
  const player = useActivePlayer()!
  const allRecords = useHistoryStore((s) => s.records)
  const records = allRecords.filter((r) => r.playerId === player.id)
  const [page, setPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const visible = records.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const wins = records.filter((r) => r.result === 'win').length
  const levels = records.filter((r) => r.game === 'ball-sort' && r.result === 'completed').length
  const pending = records.filter((r) => r.syncStatus === 'pending').length
  const syncState = useSyncStore((s) => s.state)

  let syncMessage: string
  if (player.needsRecovery) syncMessage = 'Tu perfil está protegido en otro dispositivo. Recupéralo con tu código secreto para guardar tus partidas en el servidor.'
  else if (player.nameConflict) syncMessage = 'Otro jugador ya usa tu nombre en el servidor; tus partidas se guardan solo en este dispositivo.'
  else if (syncState === 'syncing') syncMessage = 'Guardando tus partidas en el servidor…'
  else if (pending === 0) syncMessage = 'Todas tus partidas están guardadas en el servidor.'
  else if (syncState === 'offline') syncMessage = `Sin conexión: ${pending} ${pending === 1 ? 'partida pendiente' : 'partidas pendientes'}. Se enviarán cuando vuelva la conexión.`
  else syncMessage = `${pending} ${pending === 1 ? 'partida pendiente' : 'partidas pendientes'} de sincronizar.`

  return (
    <PageShell actions={<BackButton to="/perfil" label="Volver al perfil" />}>
      <div className="page-title">
        <h1>Mi historial y estadísticas</h1>
        <p>¡Descubre cuánto has avanzado y celebra tus logros!</p>
      </div>

      <div className="stats-row">
        <StatCard value={records.length} label="Partidas jugadas" color="var(--blue)" />
        <StatCard value={wins} label="Victorias" color="var(--yellow)" />
        <StatCard value={levels} label="Niveles completados" color="var(--mint)" />
        <StatCard value={player.achievements.length} label="Logros desbloqueados" color="var(--lilac)" />
      </div>

      <div className="sync-banner card" data-state={pending > 0 ? syncState : 'done'} role="status">
        <span>{syncMessage}</span>
        {pending > 0 && !player.nameConflict && !player.needsRecovery && (
          <button
            type="button"
            className="btn btn--soft btn--small"
            disabled={syncState === 'syncing'}
            onClick={() => void syncPendingGames()}
          >
            Sincronizar ahora
          </button>
        )}
      </div>

      <section className="card history" aria-labelledby="history-title">
        <h2 id="history-title">Partidas recientes</h2>
        {records.length === 0 ? (
          <p className="empty-state">Aún no has jugado ninguna partida. ¡Elige una isla en el lobby para comenzar!</p>
        ) : (
          <>
            <div className="table-scroll">
              <table className="history__table">
                <thead>
                  <tr>
                    <th scope="col">Juego</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Resultado</th>
                    <th scope="col">Duración</th>
                    <th scope="col">Estadísticas</th>
                    <th scope="col">Recompensas</th>
                    <th scope="col">Sincronización</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.id}>
                      <td>{GAMES[r.game].name}</td>
                      <td>{formatDate(r.playedAt)}</td>
                      <td>
                        <span className={`pill ${RESULT_LABELS[r.result].className}`}>{RESULT_LABELS[r.result].text}</span>
                      </td>
                      <td>{formatDuration(r.durationMs)}</td>
                      <td>{r.summary}</td>
                      <td className="history__xp">
                        +{r.xpEarned} XP
                        {r.bitsEarned ? <span className="history__bits"> · +{r.bitsEarned} Bits</span> : null}
                      </td>
                      <td>
                        {r.syncStatus === 'synced' && <span className="pill pill--mint">Sincronizado</span>}
                        {r.syncStatus === 'pending' && <span className="pill pill--yellow">Pendiente</span>}
                        {r.syncStatus === 'rejected' && (
                          <span className="pill pill--orange" title={r.syncError}>
                            Solo local
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="history__footer">
              <span>
                Mostrando {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + visible.length} de {records.length} partidas
              </span>
              <span className="pager">
                <button type="button" aria-label="Página anterior" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  ‹
                </button>
                <span>{page + 1}</span>
                <button
                  type="button"
                  aria-label="Página siguiente"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage(page + 1)}
                >
                  ›
                </button>
              </span>
            </div>
          </>
        )}
      </section>
    </PageShell>
  )
}
