const baseCache: { url?: string } = {}

function resolveBaseUrl(): string {
  if (baseCache.url) {
    return baseCache.url
  }
  const baseTag = document.querySelector('base')?.getAttribute('href')
  const fallback = (import.meta.env.BASE_URL ?? '/') || '/'
  let absolute = `${window.location.origin}/`
  try {
    const url = new URL(baseTag || fallback || '/', window.location.origin)
    absolute = url.toString()
  } catch (error) {
    absolute = `${window.location.origin}/`
  }
  baseCache.url = absolute.endsWith('/') ? absolute : `${absolute}/`
  return baseCache.url
}

function buildUrl(path: string): string {
  return new URL(path, resolveBaseUrl()).toString()
}

export function getAppBaseUrl(): string {
  return resolveBaseUrl()
}

export function getAppBasePath(): string {
  return new URL(resolveBaseUrl()).pathname.replace(/\/$/, '/')
}

export function navigateToAppHome(): void {
  window.location.assign(buildUrl('./'))
}

export function navigateToLogin(): void {
  window.location.assign(buildUrl('./login'))
}

export function replaceWithLogin(): void {
  window.history.replaceState(null, '', buildUrl('./login'))
}

export function isLoginRoute(pathname: string = window.location.pathname): boolean {
  const basePath = getAppBasePath().replace(/\/$/, '')
  const loginPath = `${basePath}/login`
  return pathname === loginPath || pathname === `${loginPath}/` || pathname.startsWith(`${loginPath}/`)
}
