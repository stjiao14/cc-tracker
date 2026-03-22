const API_KEY = import.meta.env.VITE_SEATS_AERO_API_KEY

const SEATS_AERO_BASE = 'https://seats.aero/partnerapi'

export function isApiKeyConfigured() {
  return Boolean(API_KEY && API_KEY !== 'your_seats_aero_api_key_here')
}

function buildUrl(endpoint, params = {}) {
  const target = new URL(SEATS_AERO_BASE + endpoint)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      target.searchParams.set(key, value)
    }
  })

  if (import.meta.env.DEV) {
    return `/partnerapi${endpoint}?${target.searchParams.toString()}`
  }
  return `https://corsproxy.io/?${encodeURIComponent(target.toString())}`
}

// API quota tracking from response headers
let apiQuota = null
export function getApiQuota() { return apiQuota }

// Session cache: key → { data, ts }
const sessionCache = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached(key) {
  const entry = sessionCache[key]
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data
  return null
}

function setCache(key, data) {
  sessionCache[key] = { data, ts: Date.now() }
}

function isTransientError(status) {
  return status >= 500 || status === 0
}

async function apiRequest(endpoint, params = {}, { retries = 3, useCache = false } = {}) {
  if (!isApiKeyConfigured()) {
    throw new Error('Seats.aero API key is not configured. Set VITE_SEATS_AERO_API_KEY in your .env file.')
  }

  const url = buildUrl(endpoint, params)

  // Check cache
  if (useCache) {
    const cached = getCached(url)
    if (cached) return cached
  }

  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
    }

    try {
      const res = await fetch(url, {
        headers: { 'Partner-Authorization': API_KEY },
      })

      // Read API quota from response headers
      const remaining = res.headers.get('x-ratelimit-remaining')
      if (remaining != null) {
        apiQuota = { remaining: Number(remaining), ts: Date.now() }
      }

      if (!res.ok) {
        if (isTransientError(res.status) && attempt < retries) {
          lastError = new Error(`Seats.aero API error ${res.status}`)
          continue
        }

        let message
        try {
          const text = await res.text()
          message = text || res.statusText
        } catch {
          message = res.statusText
        }

        if (res.status === 401 || res.status === 403) {
          throw new Error('Invalid or expired Seats.aero API key. Check your VITE_SEATS_AERO_API_KEY.')
        }
        if (res.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.')
        }
        throw new Error(`Seats.aero API error ${res.status}: ${message}`)
      }

      let data
      try {
        data = await res.json()
      } catch {
        throw new Error('Invalid JSON response from Seats.aero API')
      }
      if (useCache) setCache(url, data)
      return data
    } catch (err) {
      if (err.name === 'TypeError' && attempt < retries) {
        // Network error, retry
        lastError = err
        continue
      }
      throw err
    }
  }
  throw lastError
}

export async function cachedSearch({
  origin, destination, cabin, startDate, endDate, source, cursor,
  directOnly, orderBy, take, carriers, includeTrips,
}) {
  return apiRequest('/search', {
    origin_airport: origin,
    destination_airport: destination,
    cabin,
    start_date: startDate,
    end_date: endDate,
    source,
    cursor,
    only_direct_flights: directOnly || undefined,
    order_by: orderBy || undefined,
    take: take || undefined,
    carriers: carriers || undefined,
    include_trips: includeTrips || undefined,
  }, { useCache: !cursor })
}

export async function getTrips(id) {
  return apiRequest(`/trips/${id}`, {}, { useCache: true })
}

export async function getAvailability({
  source, cabin, startDate, endDate, originRegion, destinationRegion,
  cursor, take, skip,
}) {
  return apiRequest('/availability', {
    source,
    cabin,
    start_date: startDate,
    end_date: endDate,
    origin_region: originRegion,
    destination_region: destinationRegion,
    cursor,
    take,
    skip,
  }, { useCache: !cursor })
}

export async function getRoutes(source) {
  return apiRequest('/routes', { source }, { useCache: true })
}

export const CABIN_OPTIONS = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
]

export const SOURCES = [
  'aeroplan', 'alaska', 'american', 'aeromexico', 'azul', 'copa',
  'delta', 'emirates', 'ethiopian', 'etihad', 'eurobonus', 'finnair', 'flyingblue',
  'gol', 'jetblue', 'lufthansa', 'qantas', 'qatar', 'sas', 'saudia',
  'singapore', 'turkish', 'united', 'velocity', 'virginatlantic', 'virginaustralia',
]

export const REGIONS = [
  'North America', 'South America', 'Europe', 'Africa',
  'Middle East', 'Asia', 'Oceania',
]
