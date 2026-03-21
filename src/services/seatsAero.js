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
    // In dev, Vite proxy rewrites /partnerapi → seats.aero
    return `/partnerapi${endpoint}?${target.searchParams.toString()}`
  }
  // In production, route through CORS proxy
  return `https://corsproxy.io/?${encodeURIComponent(target.toString())}`
}

async function apiRequest(endpoint, params = {}) {
  if (!isApiKeyConfigured()) {
    throw new Error('Seats.aero API key is not configured. Set VITE_SEATS_AERO_API_KEY in your .env file.')
  }

  const url = buildUrl(endpoint, params)

  const res = await fetch(url, {
    headers: { 'Partner-Authorization': API_KEY },
  })

  if (!res.ok) {
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

  return res.json()
}

export async function cachedSearch({
  origin, destination, cabin, startDate, endDate, source, cursor,
  directOnly, orderBy, take, carriers,
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
  })
}

export async function getTrips(id) {
  return apiRequest(`/trips/${id}`)
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
  })
}

export async function getRoutes(source) {
  return apiRequest('/routes', { source })
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
