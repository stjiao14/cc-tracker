const API_KEY = import.meta.env.VITE_SEATS_AERO_API_KEY

const SEATS_AERO_BASE = 'https://seats.aero/partnerapi'

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
  const url = buildUrl(endpoint, params)

  const res = await fetch(url, {
    headers: { 'Partner-Authorization': API_KEY },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Seats.aero API error ${res.status}: ${text}`)
  }

  return res.json()
}

export async function cachedSearch({ origin, destination, cabin, startDate, endDate, source, cursor }) {
  return apiRequest('/search', {
    origin,
    destination,
    cabin,
    start_date: startDate,
    end_date: endDate,
    source,
    cursor,
  })
}

export async function getTrips(id) {
  return apiRequest(`/trips/${id}`)
}

export const CABIN_OPTIONS = [
  { value: 'economy', label: 'Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
]

export const SOURCES = [
  'aeroplan', 'alaska', 'american', 'aeromexico', 'azul', 'copa',
  'delta', 'emirates', 'ethiopian', 'etihad', 'finnair', 'flyingblue',
  'gol', 'jetblue', 'lufthansa', 'qantas', 'qatar', 'sas', 'saudia',
  'singapore', 'turkish', 'united', 'virginatlantic', 'virginaustralia',
]
