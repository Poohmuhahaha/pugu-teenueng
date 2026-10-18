// apps/vue/src/api/client.ts — Client-Side Silent Refresh (SOP §2.3)

let isRefreshing = false
let failedQueue: Array<{ resolve: (val?: unknown) => void; reject: (err?: unknown) => void }> = []

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()))
  failedQueue = []
}

const NO_REFRESH_PATHS = [
  '/api/auth/refresh',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
]

export function resetClientRefreshState(): void {
  isRefreshing = false
  failedQueue = []
}

export async function customFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const reqOptions: RequestInit = {
    ...options,
    credentials: 'same-origin', // Always send/receive the HttpOnly cookie (SOP §2.3)
  }

  const response = await fetch(url, reqOptions)

  // Intercept 401 Unauthorized (access token expired)
  const shouldRefresh =
    response.status === 401 && !NO_REFRESH_PATHS.some((path) => url.includes(path))

  if (shouldRefresh) {
    if (isRefreshing) {
      // A refresh is already in flight — queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(() => fetch(url, reqOptions))
    }

    isRefreshing = true

    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'same-origin',
      })

      if (!refreshRes.ok) {
        let errMessage = 'Refresh token expired'
        try {
          const text = await refreshRes.text()
          if (text) {
            const parsed = JSON.parse(text) as { message?: string; error?: string }
            errMessage = parsed.message ?? parsed.error ?? text
          }
        } catch {
          // keep default error message
        }
        throw new Error(errMessage)
      }

      processQueue()
      return fetch(url, reqOptions) // Retry the original request
    } catch (err) {
      processQueue(err)
      if (typeof window !== 'undefined' && window.location) {
        try {
          window.location.href = '/login?expired=true'
        } catch {
          // ignore navigation errors in test environments
        }
      }
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }

  return response
}
