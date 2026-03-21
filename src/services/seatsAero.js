const API_KEY = import.meta.env.VITE_SEATS_AERO_API_KEY

// In dev, Vite proxy handles /partnerapi → seats.aero
// In production, call seats.aero directly (requires CORS or a proxy)
const BASE_URL = import.meta.env.DEV
  ? '/partnerapi'
  : 'https://seats.aero/partnerapi'

async function apiRequest(endpoint, params = {}) {
  const url = new URL(endpoint, window.location.origin)
  if (!endpoint.startsWith('http')) {
    url.pathname = `${BASE_URL}${endpoint}`
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  const res = await fetch(url.toString(), {
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
