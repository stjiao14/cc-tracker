import { useState, useEffect } from 'react'
import { cachedSearch, getTrips, CABIN_OPTIONS, SOURCES, isApiKeyConfigured } from '../services/seatsAero'
import { formatDate } from '../utils/helpers'
import { getTransferablePrograms } from '../utils/transferPartners'

const AIRPORT_RE = /^[A-Z]{3}(,[A-Z]{3})*$/

function parseAirports(raw) {
  return raw.toUpperCase().replace(/\s/g, '').trim()
}

const SAVED_SEARCHES_KEY = 'cc-tracker-saved-searches'

function loadSavedSearches() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY)) || []
  } catch { return [] }
}

function persistSavedSearches(searches) {
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches))
}

export default function AwardSearch({ cards = [] }) {
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    cabin: 'business',
    startDate: '',
    endDate: '',
    source: '',
    directOnly: false,
    orderBy: '',
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [expandedTrip, setExpandedTrip] = useState(null)
  const [tripDetails, setTripDetails] = useState({})
  const [tripLoading, setTripLoading] = useState(null)
  const [savedSearches, setSavedSearches] = useState(loadSavedSearches)

  const apiReady = isApiKeyConfigured()
  const transferable = getTransferablePrograms(cards)

  useEffect(() => {
    persistSavedSearches(savedSearches)
  }, [savedSearches])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const buildSearchParams = () => {
    const origin = parseAirports(form.origin)
    const destination = parseAirports(form.destination)
    return {
      origin,
      destination,
      cabin: form.cabin,
      startDate: form.startDate,
      endDate: form.endDate,
      source: form.source || undefined,
      directOnly: form.directOnly || undefined,
      orderBy: form.orderBy || undefined,
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    const params = buildSearchParams()
    if (!AIRPORT_RE.test(params.origin) || !AIRPORT_RE.test(params.destination)) {
      setError('Enter valid 3-letter airport codes. Use commas for multiple (e.g. SFO,LAX).')
      return
    }
    setLoading(true)
    setError(null)
    setResults(null)
    setExpandedTrip(null)
    try {
      const data = await cachedSearch(params)
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = async () => {
    if (!results?.cursor) return
    setLoadingMore(true)
    try {
      const params = buildSearchParams()
      const data = await cachedSearch({ ...params, cursor: results.cursor })
      setResults(prev => ({
        ...data,
        data: [...(prev?.data || []), ...(data.data || [])],
        count: (prev?.count || 0) + (data.count || 0),
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSaveSearch = () => {
    const params = buildSearchParams()
    if (!AIRPORT_RE.test(params.origin) || !AIRPORT_RE.test(params.destination)) return
    const label = `${params.origin} → ${params.destination} (${form.cabin})`
    const entry = { ...form, id: Date.now(), label }
    setSavedSearches(prev => [entry, ...prev.slice(0, 9)])
  }

  const handleLoadSaved = (saved) => {
    setForm({
      origin: saved.origin,
      destination: saved.destination,
      cabin: saved.cabin,
      startDate: saved.startDate || '',
      endDate: saved.endDate || '',
      source: saved.source || '',
      directOnly: saved.directOnly || false,
      orderBy: saved.orderBy || '',
    })
  }

  const handleRemoveSaved = (id) => {
    setSavedSearches(prev => prev.filter(s => s.id !== id))
  }

  const handleViewTrips = async (availabilityId) => {
    if (expandedTrip === availabilityId) {
      setExpandedTrip(null)
      return
    }
    setExpandedTrip(availabilityId)
    if (tripDetails[availabilityId]) return

    setTripLoading(availabilityId)
    try {
      const data = await getTrips(availabilityId)
      setTripDetails(prev => ({ ...prev, [availabilityId]: data }))
    } catch (err) {
      setTripDetails(prev => ({ ...prev, [availabilityId]: { error: err.message } }))
    } finally {
      setTripLoading(null)
    }
  }

  const getCabinAvailability = (row) => {
    const cabins = []
    if (row.YAvailable) cabins.push({ cabin: 'Y', miles: row.YMileageCost, seats: row.YRemainingSeats, taxes: row.YTotalTaxes })
    if (row.WAvailable) cabins.push({ cabin: 'W', miles: row.WMileageCost, seats: row.WRemainingSeats, taxes: row.WTotalTaxes })
    if (row.JAvailable) cabins.push({ cabin: 'J', miles: row.JMileageCost, seats: row.JRemainingSeats, taxes: row.JTotalTaxes })
    if (row.FAvailable) cabins.push({ cabin: 'F', miles: row.FMileageCost, seats: row.FRemainingSeats, taxes: row.FTotalTaxes })
    return cabins
  }

  const cabinLabel = { Y: 'Economy', W: 'Prem Econ', J: 'Business', F: 'First' }
  const formatMiles = (n) => n != null ? Number(n).toLocaleString() : '—'
  const formatTaxes = (cents, currency) => {
    if (!cents) return null
    const amount = (cents / 100).toFixed(0)
    return currency === 'USD' ? `$${amount}` : `${amount} ${currency || ''}`
  }

  // Cents per mile: taxes(USD cents) / miles * 100 to get cpp
  const calcCPM = (miles, taxCents) => {
    if (!miles || !taxCents) return null
    return (taxCents / miles).toFixed(2)
  }

  const isTransferable = (source) => transferable.has(source?.toLowerCase())

  return (
    <div>
      <h2>Award Search</h2>
      <p className="section-desc">Search award flight availability across mileage programs via Seats.aero</p>

      {!apiReady && (
        <div className="award-error">
          Seats.aero API key is not configured. Add <code>VITE_SEATS_AERO_API_KEY</code> to your <code>.env</code> file and restart the dev server.
        </div>
      )}

      {savedSearches.length > 0 && (
        <div className="saved-searches">
          <h4 className="saved-searches-title">Saved Searches</h4>
          <div className="saved-searches-list">
            {savedSearches.map(s => (
              <div key={s.id} className="saved-search-chip">
                <button className="saved-search-btn" onClick={() => handleLoadSaved(s)}>{s.label}</button>
                <button className="saved-search-remove" onClick={() => handleRemoveSaved(s.id)} title="Remove">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form className="award-search-form" onSubmit={handleSearch}>
        <div className="award-form-grid">
          <label>
            Origin
            <input
              name="origin"
              placeholder="SFO or SFO,LAX"
              value={form.origin}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Destination
            <input
              name="destination"
              placeholder="NRT or NRT,HND"
              value={form.destination}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Cabin
            <select name="cabin" value={form.cabin} onChange={handleChange}>
              {CABIN_OPTIONS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label>
            Program
            <select name="source" value={form.source} onChange={handleChange}>
              <option value="">All Programs</option>
              {SOURCES.map(s => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}{transferable.has(s) ? ' ★' : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Start Date
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
          </label>
          <label>
            End Date
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
          </label>
        </div>
        <div className="award-form-options">
          <label className="checkbox-label">
            <input type="checkbox" name="directOnly" checked={form.directOnly} onChange={handleChange} />
            Nonstop flights only
          </label>
          <label>
            Sort by
            <select name="orderBy" value={form.orderBy} onChange={handleChange}>
              <option value="">Default</option>
              <option value="price">Price (lowest first)</option>
            </select>
          </label>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleSaveSearch}>Save Search</button>
        </div>
        <button type="submit" className="btn btn-primary award-search-btn" disabled={loading || !apiReady}>
          {loading ? 'Searching...' : 'Search Awards'}
        </button>
      </form>

      {transferable.size > 0 && (
        <p className="transfer-hint">★ = transferable from your credit card points</p>
      )}

      {error && <div className="award-error">{error}</div>}

      {results && (
        <div className="award-results">
          <div className="award-results-header">
            <h3>{results.count || 0} result{results.count !== 1 ? 's' : ''} found</h3>
            {results.hasMore && <span className="tag tag-blue">More available</span>}
          </div>

          {results.data && results.data.length > 0 ? (
            <div className="award-results-list">
              {results.data.map((row) => (
                <div key={row.ID} className={`award-result-card ${expandedTrip === row.ID ? 'expanded' : ''} ${isTransferable(row.Source) ? 'transferable' : ''}`}>
                  <div className="award-result-clickable" onClick={() => handleViewTrips(row.ID)} role="button" tabIndex={0}>
                    <div className="award-result-route">
                      <div className="award-route-airports">
                        <span className="airport-code">{row.Route?.OriginAirport}</span>
                        <span className="route-arrow">→</span>
                        <span className="airport-code">{row.Route?.DestinationAirport}</span>
                        {row.Route?.Distance > 0 && (
                          <span className="route-distance">{Number(row.Route.Distance).toLocaleString()} mi</span>
                        )}
                      </div>
                      <div className="award-route-meta">
                        <span className="tag">{formatDate(row.Date)}</span>
                        <span className={`tag ${isTransferable(row.Source) ? 'tag-green' : 'tag-blue'}`}>
                          {row.Source}{isTransferable(row.Source) ? ' ★' : ''}
                        </span>
                        <span className={`expand-arrow ${expandedTrip === row.ID ? 'expanded' : ''}`}>▼</span>
                      </div>
                    </div>

                    <div className="award-cabins">
                      {getCabinAvailability(row).map(c => {
                        const cpm = calcCPM(c.miles, c.taxes)
                        return (
                          <div key={c.cabin} className="award-cabin-pill">
                            <span className="cabin-label">{cabinLabel[c.cabin]}</span>
                            <span className="cabin-miles">{formatMiles(c.miles)} mi</span>
                            {c.taxes > 0 && (
                              <span className="cabin-taxes">+ {formatTaxes(c.taxes, row.TaxesCurrency)}</span>
                            )}
                            {cpm && <span className="cabin-cpm">{cpm} cpp</span>}
                            <span className="cabin-seats">{c.seats} seat{c.seats !== 1 ? 's' : ''}</span>
                          </div>
                        )
                      })}
                      {getCabinAvailability(row).length === 0 && (
                        <span className="empty-text">No cabin availability</span>
                      )}
                    </div>
                  </div>

                  {expandedTrip === row.ID && (
                    <div className="award-trip-details">
                      {tripLoading === row.ID && <p className="empty-text">Loading flight details...</p>}
                      {tripDetails[row.ID]?.error && (
                        <p className="award-error">{tripDetails[row.ID].error}</p>
                      )}
                      {(tripDetails[row.ID]?.data || tripDetails[row.ID]?.Data)?.map((trip) => (
                        <div key={trip.ID} className="award-trip-option">
                          <div className="trip-header">
                            <span className="tag tag-green">{trip.Cabin}</span>
                            <span>{formatMiles(trip.MileageCost)} miles</span>
                            {trip.TotalTaxes > 0 && (
                              <span className="trip-taxes">+ {formatTaxes(trip.TotalTaxes, trip.TaxesCurrency)}</span>
                            )}
                            <span>{trip.Stops === 0 ? 'Nonstop' : `${trip.Stops} stop${trip.Stops > 1 ? 's' : ''}`}</span>
                            <span>{Math.floor(trip.TotalDuration / 60)}h {trip.TotalDuration % 60}m</span>
                            <span>{trip.RemainingSeats} seat{trip.RemainingSeats !== 1 ? 's' : ''}</span>
                          </div>
                          {(trip.AvailabilitySegments || []).map((seg, i) => (
                            <div key={seg.ID || i} className="trip-segment">
                              <span className="segment-flight">{seg.FlightNumber}</span>
                              <span>{seg.OriginAirport} → {seg.DestinationAirport}</span>
                              <span className="segment-aircraft">{seg.AircraftName || seg.AircraftCode}</span>
                              {seg.DepartsAt && (
                                <span className="segment-time">
                                  {new Date(seg.DepartsAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              {seg.ArrivesAt && (
                                <span className="segment-time">
                                  → {new Date(seg.ArrivesAt).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                      {(() => {
                        const details = tripDetails[row.ID]
                        const links = details?.BookingLinks || details?.booking_links
                        return links?.length > 0 && (
                          <div className="trip-booking-links">
                            {links.map((link, i) => (
                              <a key={i} href={link.Link || link.link} target="_blank" rel="noopener noreferrer"
                                className={`btn ${(link.Primary || link.primary) ? 'btn-primary' : 'btn-secondary'}`}
                              >
                                {link.Label || link.label}
                              </a>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">✈</div>
              <p>No award availability found for this route and date range.</p>
            </div>
          )}

          {results.hasMore && (
            <button
              className="btn btn-secondary award-search-btn"
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {loadingMore ? 'Loading more...' : 'Load More Results'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
