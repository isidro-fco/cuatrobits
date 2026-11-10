/**
 * Archivo: 006_nombres_en_espanol.sql
 * Módulo: database / migrations
 * Descripción: Renombra tablas, columnas e índices al español (estándar de codificación,
 *              regla de identificadores SQL) y traduce las claves JSON de los detalles de
 *              partida. Usa RENAME, por lo que conserva los datos, las llaves foráneas y la
 *              seguridad a nivel de fila de la migración 005.
 * Requerimientos: RDC07, RDC10, RIE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-11-09
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

-- ---------- Tablas ----------
ALTER TABLE players             RENAME TO jugadores;
ALTER TABLE progress            RENAME TO progresos;
ALTER TABLE games               RENAME TO partidas;
ALTER TABLE game_details        RENAME TO detalles_partidas;
ALTER TABLE achievements        RENAME TO logros;
ALTER TABLE player_achievements RENAME TO logros_jugadores;
ALTER TABLE player_items        RENAME TO articulos_jugadores;
ALTER TABLE player_tokens       RENAME TO tokens_jugadores;

-- ---------- Columnas de jugadores ----------
ALTER TABLE jugadores RENAME COLUMN username_normalized TO username_normalizado;
ALTER TABLE jugadores RENAME COLUMN created_at          TO creado_en;
ALTER TABLE jugadores RENAME COLUMN recovery_hash       TO hash_recuperacion;

-- ---------- Columnas de progresos ----------
ALTER TABLE progresos RENAME COLUMN player_id  TO jugador_id;
ALTER TABLE progresos RENAME COLUMN level      TO nivel;
ALTER TABLE progresos RENAME COLUMN updated_at TO actualizado_en;

-- ---------- Columnas de partidas ----------
ALTER TABLE partidas RENAME COLUMN player_id   TO jugador_id;
ALTER TABLE partidas RENAME COLUMN game_type   TO tipo_juego;
ALTER TABLE partidas RENAME COLUMN result      TO resultado;
ALTER TABLE partidas RENAME COLUMN duration_ms TO duracion_ms;
ALTER TABLE partidas RENAME COLUMN xp_earned   TO xp_obtenida;
ALTER TABLE partidas RENAME COLUMN bits_earned TO bits_obtenidos;
ALTER TABLE partidas RENAME COLUMN played_at   TO jugada_en;
ALTER TABLE partidas RENAME COLUMN synced_at   TO sincronizada_en;
ALTER TABLE partidas RENAME COLUMN summary     TO resumen;

-- ---------- Columnas de detalles, logros, artículos y tokens ----------
ALTER TABLE detalles_partidas   RENAME COLUMN game_id        TO partida_id;
ALTER TABLE detalles_partidas   RENAME COLUMN details        TO detalles;
ALTER TABLE logros              RENAME COLUMN name           TO nombre;
ALTER TABLE logros              RENAME COLUMN description    TO descripcion;
ALTER TABLE logros_jugadores    RENAME COLUMN player_id      TO jugador_id;
ALTER TABLE logros_jugadores    RENAME COLUMN achievement_id TO logro_id;
ALTER TABLE logros_jugadores    RENAME COLUMN unlocked_at    TO desbloqueado_en;
ALTER TABLE articulos_jugadores RENAME COLUMN player_id      TO jugador_id;
ALTER TABLE articulos_jugadores RENAME COLUMN item_id        TO articulo_id;
ALTER TABLE articulos_jugadores RENAME COLUMN price          TO precio;
ALTER TABLE articulos_jugadores RENAME COLUMN purchased_at   TO comprado_en;
ALTER TABLE tokens_jugadores    RENAME COLUMN token_hash     TO hash_token;
ALTER TABLE tokens_jugadores    RENAME COLUMN player_id      TO jugador_id;
ALTER TABLE tokens_jugadores    RENAME COLUMN created_at     TO creado_en;

-- ---------- Índices ----------
ALTER INDEX games_player_played_idx  RENAME TO partidas_jugador_jugada_idx;
ALTER INDEX idx_player_tokens_player RENAME TO tokens_jugadores_jugador_idx;

-- ---------- Claves JSON de los detalles de partida ----------
-- Las partidas guardadas antes de esta migración usan las claves en inglés del frontend anterior
UPDATE detalles_partidas
SET detalles = COALESCE(
  (
    SELECT jsonb_object_agg(COALESCE(mapa.nueva, entrada.key), entrada.value)
    FROM jsonb_each(detalles) AS entrada
    LEFT JOIN (
      VALUES
        ('players', 'jugadores'), ('mode', 'modo'), ('difficulty', 'dificultad'),
        ('moves', 'movimientos'), ('winner', 'ganador'), ('category', 'categoria'),
        ('word', 'palabra'), ('correctLetters', 'letrasCorrectas'),
        ('wrongLetters', 'letrasIncorrectas'), ('attemptsUsed', 'intentosUsados'),
        ('errors', 'errores'), ('colors', 'colores'), ('completed', 'estaCompletada'),
        ('pairs', 'parejas'), ('attempts', 'intentos')
    ) AS mapa (anterior, nueva) ON mapa.anterior = entrada.key
  ),
  '{}'::jsonb
);
