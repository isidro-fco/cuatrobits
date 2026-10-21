-- Recuperar un perfil en otro dispositivo o después de borrar los datos del navegador

-- Huella del código secreto de recuperación (scrypt); nunca se guarda el código
ALTER TABLE players ADD COLUMN recovery_hash TEXT;

-- Texto del historial, para mostrar las partidas recuperadas igual que en el dispositivo original
ALTER TABLE games ADD COLUMN summary VARCHAR(200) NOT NULL DEFAULT '';
