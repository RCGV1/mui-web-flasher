import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('MUI tester flasher UI guardrails', () => {
  it('does not expose official firmware pickers, PR builds, or generic upload affordances', () => {
    const firmwareComponent = read('components/Firmware.vue')
    const firmwareStore = read('stores/firmwareStore.ts')
    const firmwareUrl = read('utils/firmwareUrl.ts')
    const app = read('app.vue')
    const english = read('i18n/locales/en.json')

    expect(firmwareComponent).toContain('v-if="muiTesterOnly"')
    expect(firmwareComponent).not.toContain('store.fetchNightly()')
    expect(firmwareComponent).not.toContain('store.$state.nightly')
    expect(firmwareComponent).not.toContain('store.$state.stable')
    expect(firmwareComponent).not.toContain('store.$state.previews')
    expect(firmwareComponent).not.toContain('store.$state.prFirmware')
    expect(firmwareComponent).not.toContain('file_upload')
    expect(firmwareComponent).not.toContain('upload_tooltip')

    expect(firmwareStore).toMatch(/async fetchNightly\(\) \{\n\s+return\n\s+\}/)
    expect(firmwareUrl).not.toContain('firmware-nightly')
    expect(app).toContain('!muiTesterOnly')
    expect(app).not.toContain('firmwareStore.loadPrFirmware(prNumber)')

    expect(english).not.toContain('Choose from the release options')
    expect(english).not.toContain('upload a release zip')
  })

  it('explains the Flash button prerequisites for device selection and supported browsers', () => {
    const flashComponent = read('components/Flash.vue')
    const english = read('i18n/locales/en.json')

    expect(flashComponent).toContain('flash.disabled_until_device')
    expect(flashComponent).toContain('flash.web_serial_requirement')
    expect(english).toContain('Select a supported MUI device to enable Flash.')
    expect(english).toContain('Chrome or Edge on desktop')
    expect(english).toContain('Safari is not supported')
  })
})
