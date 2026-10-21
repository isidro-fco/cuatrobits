import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { fakeApi, fakeFetch } from './fakeApi'

// findBy* espera 1 s por defecto; con el backend probándose en paralelo la página puede tardar más
configure({ asyncUtilTimeout: 5_000 })

afterEach(cleanup)

// Todas las pruebas hablan con un servidor falso en memoria
beforeEach(() => {
  fakeApi.reset()
  vi.stubGlobal('fetch', fakeFetch)
})

// jsdom no implementa matchMedia ni los métodos de <dialog>
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false
}
