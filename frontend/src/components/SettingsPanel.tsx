import { useSettingsStore } from '../stores/settingsStore'
import { Toggle } from './Toggle'

export function SettingsPanel() {
  const settings = useSettingsStore()
  return (
    <section className="settings-panel" aria-labelledby="settings-title">
      <h2 id="settings-title">Configuración</h2>
      <Toggle label="Música" checked={settings.music} onChange={() => settings.toggle('music')} />
      <Toggle label="Efectos de sonido" checked={settings.sfx} onChange={() => settings.toggle('sfx')} />
      <Toggle
        label="Reducir animaciones"
        hint="Menos movimiento en pantalla"
        checked={settings.reducedMotion}
        onChange={() => settings.toggle('reducedMotion')}
      />
      <Toggle label="Mostrar cronómetro" checked={settings.showTimer} onChange={() => settings.toggle('showTimer')} />
    </section>
  )
}
