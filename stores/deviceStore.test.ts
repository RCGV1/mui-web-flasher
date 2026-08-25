import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { DeviceHardware } from '~/types/api'
import { getMuiCandidateReleaseManifest, getMuiCandidateTarget } from '~/utils/muiCandidate'
import { useDeviceStore, shouldAutoSelectMui } from './deviceStore'
import { useFirmwareStore } from './firmwareStore'

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

  it('loads and selects every verified MUI tester target from the Pages-relative tester manifest', async () => {
    const testerDevices = [
      makeTarget({
        hwModel: 97,
        hwModelSlug: 'CROWPANEL',
        platformioTarget: 'elecrow-adv-24-28-tft',
        architecture: 'esp32-s3',
        displayName: 'Crowpanel Adv 2.4/2.8 TFT — MUI virtual node-list tester',
        supportLevel: 1,
        tags: ['Elecrow', 'MUI tester'],
        hasMui: true,
      }),
      makeTarget({
        hwModel: 97,
        hwModelSlug: 'CROWPANEL',
        platformioTarget: 'elecrow-adv-35-tft',
        architecture: 'esp32-s3',
        displayName: 'Crowpanel Adv 3.5 TFT — MUI virtual node-list tester',
        supportLevel: 1,
        tags: ['Elecrow', 'MUI tester'],
        hasMui: true,
      }),
      makeTarget({
        hwModel: 97,
        hwModelSlug: 'CROWPANEL',
        platformioTarget: 'elecrow-adv1-43-50-70-tft',
        architecture: 'esp32-s3',
        displayName: 'Crowpanel Adv 4.3/5.0/7.0 TFT — MUI virtual node-list tester',
        supportLevel: 1,
        tags: ['Elecrow', 'MUI tester'],
        hasMui: true,
      }),
      makeTarget({
        hwModel: 52,
        hwModelSlug: 'PICOMPUTER_S3',
        platformioTarget: 'picomputer-s3',
        architecture: 'esp32-s3',
        displayName: 'Pi Computer S3 — MUI virtual node-list tester',
        supportLevel: 3,
        tags: ['MUI tester'],
        hasMui: true,
      }),
      makeTarget({
        hwModel: 110,
        hwModelSlug: 'HELTEC_V4',
        platformioTarget: 'heltec-v4',
        architecture: 'esp32-s3',
        displayName: 'Heltec V4 TFT — MUI virtual node-list tester',
        supportLevel: 1,
        tags: ['Heltec', 'MUI tester'],
        images: ['heltec_v4.svg'],
        partitionScheme: '16MB',
        requiresDfu: true,
        hasMui: true,
      }),
      makeTarget({
        hwModel: 116,
        hwModelSlug: 'WISMESH_TAP_V2',
        platformioTarget: 'rak_wismesh_tap_v2',
        architecture: 'esp32-s3',
        displayName: 'RAK WisMesh Tap V2 — MUI virtual node-list tester',
        supportLevel: 1,
        tags: ['RAK', 'MUI tester'],
        hasMui: true,
      }),
      makeTarget({
        hwModel: 70,
        hwModelSlug: 'SENSECAP_INDICATOR',
        platformioTarget: 'seeed-sensecap-indicator',
        architecture: 'esp32-s3',
        displayName: 'Seeed SenseCAP Indicator — MUI virtual node-list tester',
        supportLevel: 1,
        tags: ['Seeed', 'MUI tester'],
        hasMui: true,
      }),
      makeTarget({
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
      }),
      makeTarget({
        hwModel: 59,
        hwModelSlug: 'UNPHONE',
        platformioTarget: 'unphone',
        architecture: 'esp32-s3',
        displayName: 'unPhone — MUI virtual node-list tester',
        supportLevel: 3,
        tags: ['MUI tester'],
        hasMui: true,
      }),
    ]
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse({
      id: 'v2.8.0.0d652f6',
      version: '2.8.0.0d652f6',
      title: 'MUI virtual node-list tester firmware (all MUI targets)',
      releaseNotes: 'Tester notes',
      releaseTag: 'mui-node-list-20260824-0d652f6',
      buildTimestamp: '2026-08-24T23:37:58Z',
      testerNotes: ['Add/receive 250 nodes.'],
      source: {
        firmware: { repo: 'RCGV1/firmware-Fork', branch: 'candidate/mui-node-list-tester-20260824', commit: '0d652f66d5a58e23f7fd1505e23c03a4a6ada302' },
        deviceUi: { repo: 'RCGV1/device-ui', branch: 'candidate/virtual-node-list-improvement-20260824', commit: '9e84d74cb9bc4f2ef4cc577912b3d11b2ad29504' },
        compileDefinition: 'DEVICE_UI_MUI_VIRTUAL_NODE_LIST',
        compileValue: '1',
      },
      targets: testerDevices.map(device => ({
        board: device.platformioTarget.endsWith('-tft') ? device.platformioTarget : `${device.platformioTarget}-tft`,
        platform: 'esp32s3',
        device,
        manifestUrl: `https://rcgv1.github.io/mui-web-flasher/firmware/mui-node-list-20260824-0d652f6/firmware-${device.platformioTarget.endsWith('-tft') ? device.platformioTarget : `${device.platformioTarget}-tft`}-2.8.0.0d652f6.mt.json`,
        manifestSha256: 'a'.repeat(64),
        files: {},
      })),
    }))

    const store = useDeviceStore()
    await store.fetchList()

    expect(fetchMock).toHaveBeenCalledWith('/mui-web-flasher/data/mui-node-list-candidate.json')
    expect(store.sortedDevices).toHaveLength(9)
    expect(store.sortedDevices.map(device => device.platformioTarget)).toEqual([
      't-deck',
      'seeed-sensecap-indicator',
      'elecrow-adv-24-28-tft',
      'elecrow-adv-35-tft',
      'elecrow-adv1-43-50-70-tft',
      'heltec-v4',
      'rak_wismesh_tap_v2',
      'picomputer-s3',
      'unphone',
    ])

    const tDeck = store.sortedDevices.find(device => device.platformioTarget === 't-deck')
    expect(tDeck).toBeTruthy()
    await store.setSelectedTarget(tDeck!)

    expect(store.selectedTarget?.platformioTarget).toBe('t-deck')
    expect(store.selectedTarget?.hasMui).toBe(true)

    const heltec = store.sortedDevices.find(device => device.platformioTarget === 'heltec-v4')
    expect(heltec).toBeTruthy()
    expect(shouldAutoSelectMui(heltec!)).toBe(true)
    await store.setSelectedTarget(heltec!)
    expect(store.selectedTarget?.platformioTarget).toBe('heltec-v4')
    expect(useFirmwareStore().$state.shouldInstallMui).toBe(true)

    const firmwareStore = useFirmwareStore()
    firmwareStore.$state.selectedFirmware = { id: 'v2.8.0.0d652f6', title: 'MUI virtual node-list tester firmware' }
    firmwareStore.$state.releaseManifest = await getMuiCandidateReleaseManifest()

    for (const device of testerDevices) {
      const candidateTarget = await getMuiCandidateTarget(device.platformioTarget)
      expect(candidateTarget, device.platformioTarget).toBeTruthy()
      expect(candidateTarget?.device.platformioTarget).toBe(device.platformioTarget)
      expect(firmwareStore.isTargetAvailable(device.platformioTarget), device.platformioTarget).toBe(true)
    }
  })
})
