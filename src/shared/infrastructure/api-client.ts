const API_ROOT = '/api'

type ApiOptions = RequestInit & { csrf?: boolean }

let csrfToken = ''

export function setCsrfToken(value: string) {
  csrfToken = value
}

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function formatValidationDetails(details: unknown): string {
  if (!Array.isArray(details)) return ''
  return details
    .flatMap((detail) => {
      if (!detail || typeof detail !== 'object') return []
      const { path, message } = detail as { path?: unknown; message?: unknown }
      if (typeof message !== 'string') return []
      return [`${typeof path === 'string' && path ? `${path}: ` : ''}${message}`]
    })
    .join(' ')
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { csrf = true, headers: requestHeaders, ...init } = options
  const headers = new Headers(requestHeaders)
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData
  if (init.body && !isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (csrf && init.method && !['GET', 'HEAD', 'OPTIONS'].includes(init.method.toUpperCase())) {
    if (!csrfToken) throw new ApiError('Your session needs to be refreshed. Sign in again.', 401)
    headers.set('X-CSRF-Token', csrfToken)
  }
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })
  if (response.status === 204) return undefined as T
  const payload = await response.json().catch(() => null) as { error?: string; details?: unknown } | null
  if (!response.ok) {
    const message = payload?.error || `Request failed (${response.status}).`
    if (response.status === 403) {
      console.error('[CMS API] Request forbidden', {
        method: init.method || 'GET',
        path,
        pageOrigin: window.location.origin,
        responseUrl: response.url,
        message,
      })
    }
    if (response.status === 401) window.dispatchEvent(new CustomEvent('cms:unauthorized'))
    const details = formatValidationDetails(payload?.details)
    throw new ApiError(details ? `${message} ${details}` : message, response.status, payload?.details)
  }
  if (payload === null) throw new ApiError('The CMS API returned an invalid response.', 502)
  return payload as T
}
