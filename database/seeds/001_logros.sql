-- Catálogo inicial de logros (especificación, sección 9.3)
INSERT INTO achievements (id, name, description) VALUES
  ('first-game',     'Primera partida',      'Completa tu primera partida.'),
  ('first-win',      'Primera victoria',     'Gana tu primera partida.'),
  ('five-games',     'Jugador constante',    'Completa cinco partidas.'),
  ('win-each-game',  'Gran explorador',      'Gana al menos una vez en cada juego.'),
  ('bitbot-10',      'Constructor experto',  'Adivina diez palabras en Arma a BitBot.'),
  ('ball-sort-5',    'Maestro de las esferas','Completa cinco niveles de esferas.'),
  ('memory-10',      'Memoria brillante',    'Encuentra diez parejas en Memorama.')
ON CONFLICT (id) DO NOTHING;
