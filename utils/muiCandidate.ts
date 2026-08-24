import type { DeviceHardware, FirmwareResource } from '~/types/api'
import type { FirmwareManifest, ReleaseManifest } from '~/types/manifest'
import { publicPath } from '~/utils/muiTester'

export interface CandidateFile {
  url: string
  sha256: string
  bytes?: number
}

export interface CandidateTarget {
  board: string
  platform: string
  device: DeviceHardware
  manifestUrl: string
  manifestSha256: string
  files: Record<string, CandidateFile>
}

export interface CandidateManifest {
  id: string
  version: string
  title: string
  releaseNotes: string
  releaseTag: string
  buildTimestamp: string
  testerNotes: string[]
  source: {
    firmware: {
      repo: string
      branch: string
      commit: string
    }
    deviceUi: {
      repo: string
      branch: string
      commit: string
    }
    compileDefinition: string
  }
  targets: CandidateTarget[]
}

export const MUI_CANDIDATE_ID = 'v2.8.0.599f1c3'

let candidatePromise: Promise<CandidateManifest> | undefined

export async function loadMuiCandidateManifest(): Promise<CandidateManifest> {
  candidatePromise ??= fetch(publicPath('/data/mui-node-list-candidate.json')).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Could not load MUI candidate manifest (HTTP ${response.status})`)
    }
    return await response.json() as CandidateManifest
  })
  return candidatePromise
}

export async function getMuiCandidateFirmwareResource(): Promise<FirmwareResource> {
  const candidate = await loadMuiCandidateManifest()
  return {
    id: candidate.id,
    title: candidate.title,
    page_url: `https://github.com/RCGV1/mui-node-list-candidate-firmware/releases/tag/${candidate.releaseTag}`,
    release_notes: candidate.releaseNotes,
  }
}

export async function getMuiCandidateDevices(): Promise<DeviceHardware[]> {
  const candidate = await loadMuiCandidateManifest()
  return candidate.targets.map(target => target.device)
}

export async function getMuiCandidateReleaseManifest(): Promise<ReleaseManifest> {
  const candidate = await loadMuiCandidateManifest()
  return {
    version: candidate.version,
    targets: candidate.targets.map(target => ({
      board: target.board,
      platform: target.platform,
    })),
  }
}

export async function fetchMuiCandidateTargetManifest(targetBoard: string): Promise<FirmwareManifest | undefined> {
  const candidate = await loadMuiCandidateManifest()
  const target = candidate.targets.find(target => target.board === targetBoard)
  if (!target) return undefined

  const response = await fetch(target.manifestUrl)
  if (!response.ok) {
    throw new Error(`Could not load MUI candidate target manifest ${targetBoard} (HTTP ${response.status})`)
  }
  return await response.json() as FirmwareManifest
}

export async function getMuiCandidateFileUrl(fileName: string): Promise<string | undefined> {
  const candidate = await loadMuiCandidateManifest()
  for (const target of candidate.targets) {
    const file = target.files[fileName]
    if (file) return file.url
  }
  return undefined
}

export async function getMuiCandidateTarget(targetBoard: string): Promise<CandidateTarget | undefined> {
  const candidate = await loadMuiCandidateManifest()
  return candidate.targets.find(target => target.board === targetBoard)
}
