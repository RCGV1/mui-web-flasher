import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { DeviceHardware } from '~/types/api'
import { useDeviceStore } from './deviceStore'

// The store module reads window.location at import time (createUrl).
// vi.hoisted runs before the imports above are evaluated.
vi.hoisted(() => {
  (globalThis as any).window = { location: { host: 'localhost:3000', protocol: 'https:' } }
})

function makeTarget(overrides: Partial<DeviceHardware>): DeviceHardware {
  return {
    hwModel: 1,
    hwModelSlug: 'TEST',
    platformioTarget: 'test',
    architecture: 'nrf52840',
    activelySupported: true,
    displayName: 'Test',
    ...overrides,
  }
}

const SD73_ERASE = '/uf2/nrf_erase_sd7_3.uf2'
const SD611_ERASE = '/uf2/nrf_erase2.uf2'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

describe('deviceStore factory-erase UF2 selection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('serves the SoftDevice 7.3 erase file to the Seeed MeshTracker X1', () => {
    const store = useDeviceStore()
    store.selectedTarget = makeTarget({
      hwModel: 128,
      hwModelSlug: 'MESH_TRACKER_X1',
      platformioTarget: 'seeed_mesh_tracker_X1',
      tags: ['Seeed'],
    })
    expect(store.isSoftDevice7point3).toBe(true)
    expect(store.eraseUf2File).toBe(SD73_ERASE)
  })

  it.each([
    'WIO_WM1110',
    'TRACKER_T1000_E',
    'XIAO_NRF52_KIT',
    'SEEED_SOLAR_NODE',
    'SEEED_WIO_TRACKER_L1',
    'SEEED_WIO_TRACKER_L1_EINK',
  ])('serves the SoftDevice 7.3 erase file to %s', (slug) => {
    const store = useDeviceStore()
    store.selectedTarget = makeTarget({ hwModelSlug: slug, tags: ['Seeed'] })
    expect(store.eraseUf2File).toBe(SD73_ERASE)
  })

  it('treats any Seeed nRF52840 board as SoftDevice 7.3, even when not listed by slug', () => {
    const store = useDeviceStore()
    store.selectedTarget = makeTarget({ hwModelSlug: 'SEEED_SOME_FUTURE_BOARD', tags: ['Seeed'] })
    expect(store.isSoftDevice7point3).toBe(true)
    expect(store.eraseUf2File).toBe(SD73_ERASE)
  })

  it('does not apply the Seeed default to non-nRF architectures', () => {
    const store = useDeviceStore()
    store.selectedTarget = makeTarget({ hwModelSlug: 'SEEED_XIAO_S3', architecture: 'esp32-s3', tags: ['Seeed'] })
    expect(store.isSoftDevice7point3).toBe(false)
  })

  it.each([
    ['RAK4631', ['RAK']],
    ['T_ECHO', ['LilyGo']],
    ['HELTEC_MESH_NODE_T114', ['Heltec']],
  ])('serves the SoftDevice 6.1.1 erase file to %s', (slug, tags) => {
    const store = useDeviceStore()
    store.selectedTarget = makeTarget({ hwModelSlug: slug, tags })
    expect(store.isSoftDevice7point3).toBe(false)
    expect(store.eraseUf2File).toBe(SD611_ERASE)
  })

  it('serves the RP2040 erase file to rp2040 targets', () => {
    const store = useDeviceStore()
    store.selectedTarget = makeTarget({ hwModelSlug: 'RPI_PICO', architecture: 'rp2040', tags: ['Raspberry Pi'] })
    expect(store.eraseUf2File).toBe('/uf2/pico_erase.uf2')
  })

  it('is not SoftDevice 7.3 when nothing is selected', () => {
    const store = useDeviceStore()
    expect(store.isSoftDevice7point3).toBe(false)
  })
})

describe('deviceStore MUI tester candidate manifest', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('__NUXT__', { config: { app: { baseURL: '/mui-web-flasher/' } } })
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => ({ click: vi.fn() })),
    })
    vi.stubGlobal('fetch', vi.fn())
  })

  it('loads and selects the T-Deck from the Pages-relative tester manifest', async () => {
    const tDeck = makeTarget({
      hwModel: 50,
      hwModelSlug: 'T_DECK',
      platformioTarget: 't-deck',
      architecture: 'esp32-s3',
      displayName: 'LILYGO T-Deck — MUI virtual node-list tester',
      supportLevel: 1,
      tags: ['LilyGo', 'MUI tester'],
      images: ['t-deck.svg'],
      partitionScheme: '16MB',
      requiresDfu: true,
      hasMui: true,
    })
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse({
      id: 'v2.8.0.599f1c3',
      version: '2.8.0.599f1c3',
      title: 'MUI virtual node-list tester firmware (T-Deck)',
      releaseNotes: 'Tester notes',
      releaseTag: 'mui-node-list-20260824-599f1c3',
      buildTimestamp: '2026-08-24T19:22:39Z',
      testerNotes: ['Add/receive 250 nodes.'],
      source: {
        firmware: { repo: 'RCGV1/firmware-Fork', branch: 'candidate/mui-node-list-tester-20260824', commit: '599f1c36ec5738cae8d330b095ff9f3f868b1ea3' },
        deviceUi: { repo: 'RCGV1/device-ui', branch: 'candidate/virtual-node-list-improvement-20260824', commit: '9e84d74cb9bc4f2ef4cc577912b3d11b2ad29504' },
        compileDefinition: 'DEVICE_UI_MUI_VIRTUAL_NODE_LIST',
      },
      targets: [
        {
          board: 't-deck-tft',
          platform: 'esp32s3',
          device: tDeck,
          manifestUrl: 'https://rcgv1.github.io/mui-web-flasher/firmware/mui-node-list-20260824-599f1c3/firmware-t-deck-tft-2.8.0.599f1c3.mt.json',
          manifestSha256: '6009d733e33786dd96ae3da0ee465aaaa4c7dddbdb492993637ebae2d65a55b0',
          files: {},
        },
      ],
    }))

    const store = useDeviceStore()
    await store.fetchList()

    expect(fetchMock).toHaveBeenCalledWith('/mui-web-flasher/data/mui-node-list-candidate.json')
    expect(store.sortedDevices).toHaveLength(1)
    expect(store.sortedDevices[0].platformioTarget).toBe('t-deck')

    await store.setSelectedTarget(store.sortedDevices[0])

    expect(store.selectedTarget?.platformioTarget).toBe('t-deck')
    expect(store.selectedTarget?.hasMui).toBe(true)
  })
})
