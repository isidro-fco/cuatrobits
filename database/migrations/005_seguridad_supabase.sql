-- Supabase publica el esquema `public` en su API REST con una clave anónima que cualquiera puede ver.
-- Con RLS activado y sin políticas, esa API no puede leer ni modificar las tablas. El backend se
-- conecta con el rol dueño de las tablas, que no está sujeto a RLS, así que sigue funcionando igual.
-- En un PostgreSQL normal no cambia nada.
ALTER TABLE players             ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress            ENABLE ROW LEVEL SECURITY;
ALTER TABLE games               ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_details        ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations   ENABLE ROW LEVEL SECURITY;
