// Shared helpers for award availability display (AwardSearch + DealsExplorer)

export const CABIN_LABELS = { Y: 'Economy', W: 'Prem Econ', J: 'Business', F: 'First' }

export function getCabinAvailability(row) {
  const cabins = []
  if (row.YAvailable) cabins.push({ cabin: 'Y', miles: row.YMileageCost, seats: row.YRemainingSeats, taxes: row.YTotalTaxes, airlines: row.YAirlines })
  if (row.WAvailable) cabins.push({ cabin: 'W', miles: row.WMileageCost, seats: row.WRemainingSeats, taxes: row.WTotalTaxes, airlines: row.WAirlines })
  if (row.JAvailable) cabins.push({ cabin: 'J', miles: row.JMileageCost, seats: row.JRemainingSeats, taxes: row.JTotalTaxes, airlines: row.JAirlines })
  if (row.FAvailable) cabins.push({ cabin: 'F', miles: row.FMileageCost, seats: row.FRemainingSeats, taxes: row.FTotalTaxes, airlines: row.FAirlines })
  return cabins
}

export function formatMiles(n) {
  return n != null ? Number(n).toLocaleString() : '—'
}

export function formatTaxes(cents, currency) {
  if (!cents) return null
  const amount = (cents / 100).toFixed(0)
  return currency === 'USD' ? `$${amount}` : `${amount} ${currency || ''}`
}

export function calcCPM(miles, taxCents) {
  if (!miles || !taxCents) return null
  return (taxCents / miles).toFixed(2)
}
