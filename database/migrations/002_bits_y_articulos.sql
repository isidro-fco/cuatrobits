/**
 * Archivo: 002_bits_y_articulos.sql
 * Módulo: database / migrations
 * Descripción: Etapa 4: Bits por partida y artículos cosméticos de BitBot (sección 9.4). Se
 *              conserva con los nombres originales; la migración 006 los renombra al español.
 * Requerimientos: RF49, RDC10
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

-- Las partidas registradas antes de esta migración no otorgaron Bits
ALTER TABLE games ADD COLUMN bits_earned INTEGER NOT NULL DEFAULT 0 CHECK (bits_earned >= 0);

-- Cada artículo se compra una sola vez; el precio se guarda tal como se cobró
CREATE TABLE player_items (
  player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id      VARCHAR(50) NOT NULL,
  price        INTEGER NOT NULL CHECK (price >= 0),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, item_id)
);
