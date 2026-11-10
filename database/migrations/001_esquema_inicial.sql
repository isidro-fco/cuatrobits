/**
 * Archivo: 001_esquema_inicial.sql
 * Módulo: database / migrations
 * Descripción: Esquema inicial de CuatroBits (especificación, sección 13.3). Se conserva con los
 *              nombres originales; la migración 006 los renombra al español.
 * Requerimientos: RIE02, RDC07, RDC10, RDC11
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

CREATE TABLE players (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username            VARCHAR(20) NOT NULL,
  username_normalized VARCHAR(20) NOT NULL UNIQUE,
  avatar              VARCHAR(50) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE progress (
  player_id  UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  xp         INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level      INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  bits       INTEGER NOT NULL DEFAULT 0 CHECK (bits >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- El id lo genera el cliente para que la sincronización sea idempotente
CREATE TABLE games (
  id          UUID PRIMARY KEY,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_type   VARCHAR(20) NOT NULL
              CHECK (game_type IN ('connect-four', 'bitbot', 'ball-sort', 'memory')),
  result      VARCHAR(20) NOT NULL,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  xp_earned   INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  played_at   TIMESTAMPTZ NOT NULL,
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX games_player_played_idx ON games (player_id, played_at DESC);

CREATE TABLE game_details (
  game_id UUID PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  details JSONB NOT NULL
);

CREATE TABLE achievements (
  id          VARCHAR(50) PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE player_achievements (
  player_id      UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, achievement_id)
);
