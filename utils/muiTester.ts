export const muiTesterOnly = true

export function isMuiTesterTarget(target: { hasMui?: boolean }) {
  return !muiTesterOnly || target.hasMui === true
}

export function publicPath(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}
