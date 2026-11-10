/**
 * Archivo: PanelAjustes.tsx
 * Módulo: frontend / components
 * Descripción: Panel con las preferencias de música, efectos, animaciones y cronómetro.
 * Requerimientos: RF08, RNF04, RNF05
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { useAjustesStore } from '../stores/useAjustesStore'
import { Interruptor } from './Interruptor'

// ---------- Componente PanelAjustes ----------
/**
 * Panel con las preferencias de música, efectos, animaciones y cronómetro.
 * @returns Lista de interruptores
 * @see RF08, RNF04, RNF05
 */
export function PanelAjustes() {
  const ajustes = useAjustesStore()
  return (
    <section className="settings-panel" aria-labelledby="settings-title">
      <h2 id="settings-title">Configuración</h2>
      <Interruptor
        etiqueta="Música"
        estaMarcado={ajustes.estaMusicaActiva}
        alCambiar={() => ajustes.alternar('estaMusicaActiva')}
      />
      <Interruptor
        etiqueta="Efectos de sonido"
        estaMarcado={ajustes.estaSonidoActivo}
        alCambiar={() => ajustes.alternar('estaSonidoActivo')}
      />
      <Interruptor
        etiqueta="Reducir animaciones"
        pista="Menos movimiento en pantalla"
        estaMarcado={ajustes.esMovimientoReducido}
        alCambiar={() => ajustes.alternar('esMovimientoReducido')}
      />
      <Interruptor
        etiqueta="Mostrar cronómetro"
        estaMarcado={ajustes.esCronometroVisible}
        alCambiar={() => ajustes.alternar('esCronometroVisible')}
      />
    </section>
  )
}
