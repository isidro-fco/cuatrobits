/**
 * Archivo: 001_logros.sql
 * Módulo: database / seeds
 * Descripción: Catálogo de logros (especificación, sección 9.3). Se vuelve a ejecutar en cada
 *              arranque.
 * Requerimientos: RF48, RDC10
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

-- Catálogo inicial de logros (especificación, sección 9.3)
INSERT INTO logros (id, nombre, descripcion) VALUES
  ('first-game',     'Primera partida',      'Completa tu primera partida.'),
  ('first-win',      'Primera victoria',     'Gana tu primera partida.'),
  ('five-games',     'Jugador constante',    'Completa cinco partidas.'),
  ('win-each-game',  'Gran explorador',      'Gana al menos una vez en cada juego.'),
  ('bitbot-10',      'Constructor experto',  'Adivina diez palabras en Arma a BitBot.'),
  ('ball-sort-5',    'Maestro de las esferas','Completa cinco niveles de esferas.'),
  ('memory-10',      'Memoria brillante',    'Encuentra diez parejas en Memorama.')
ON CONFLICT (id) DO NOTHING;
