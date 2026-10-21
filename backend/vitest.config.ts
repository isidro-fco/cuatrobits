import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Cada archivo arranca su propio PostgreSQL en WebAssembly (PGlite) y aplica las migraciones;
    // en equipos con pocos núcleos y las pruebas del frontend en paralelo puede tardar varios segundos
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
