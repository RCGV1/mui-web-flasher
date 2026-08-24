export const muiTesterOnly = true

export function isMuiTesterTarget(target: { hasMui?: boolean }) {
  return !muiTesterOnly || target.hasMui === true
}

export function publicPath(path: string) {
  const nuxt = globalThis as typeof globalThis & {
    __NUXT__?: {
      config?: {
        app?: {
          baseURL?: string
        }
      }
    }
  }
  const base = nuxt.__NUXT__?.config?.app?.baseURL || import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}
