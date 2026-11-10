/**
 * Archivo: 004_autenticacion.sql
 * Módulo: database / migrations
 * Descripción: Autenticación por dispositivo (sección 4.3): tabla de huellas de tokens.
 * Requerimientos: RNF12, RLYE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

-- Autenticación por dispositivo (sección 4.3): cada dispositivo guarda un token secreto
-- y lo envía en las solicitudes. El servidor solo guarda su huella SHA-256.
CREATE TABLE player_tokens (
  token_hash CHAR(64)    PRIMARY KEY,
  player_id  UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_tokens_player ON player_tokens(player_id, created_at DESC);
