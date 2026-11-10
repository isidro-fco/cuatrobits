/**
 * Archivo: 003_recuperacion_de_perfiles.sql
 * Módulo: database / migrations
 * Descripción: Huella del código secreto para recuperar un perfil en otro dispositivo.
 * Requerimientos: RNF12, RLYE01
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

-- Huella del código secreto de recuperación (scrypt); nunca se guarda el código
ALTER TABLE players ADD COLUMN recovery_hash TEXT;

-- Texto del historial, para mostrar las partidas recuperadas igual que en el dispositivo original
ALTER TABLE games ADD COLUMN summary VARCHAR(200) NOT NULL DEFAULT '';
