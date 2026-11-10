/**
 * Archivo: 005_seguridad_supabase.sql
 * Módulo: database / migrations
 * Descripción: Activa la seguridad a nivel de fila para que la API REST pública de Supabase no
 *              exponga las tablas.
 * Requerimientos: RNF12, RLYE01
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

-- Supabase publica el esquema `public` en su API REST con una clave anónima que cualquiera
-- puede ver. Con RLS activado y sin políticas, esa API no puede leer ni modificar las tablas.
-- El backend se conecta con el rol dueño de las tablas, que no está sujeto a RLS, así que sigue
-- funcionando igual. En un PostgreSQL normal no cambia nada.
ALTER TABLE players             ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress            ENABLE ROW LEVEL SECURITY;
ALTER TABLE games               ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_details        ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE migraciones_aplicadas ENABLE ROW LEVEL SECURITY;
