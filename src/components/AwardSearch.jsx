import { useState } from 'react'
import { cachedSearch, getTrips, CABIN_OPTIONS, SOURCES, isApiKeyConfigured } from '../services/seatsAero'
import { formatDate } from '../utils/helpers'

const AIRPORT_CODE_RE = /^[A-Z]{3}$/

export default function AwardSearch() {
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    cabin: 'business',
    startDate: '',
    endDate: '',
    source: '',
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [expandedTrip, setExpandedTrip] = useState(null)
  const [tripDetails, setTripDetails] = useState({})
  const [tripLoading, setTripLoading] = useState(null)

  const apiReady = isApiKeyConfigured()

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    const origin = form.origin.toUpperCase().trim()
    const destination = form.destination.toUpperCase().trim()
    if (!AIRPORT_CODE_RE.test(origin) || !AIRPORT_CODE_RE.test(destination)) {
      setError('Please enter valid 3-letter airport codes (e.g. SFO, NRT).')
      return
    }
    setLoading(true)
    setError(null)
    setResults(null)
    setExpandedTrip(null)
    try {
      const data = await cachedSearch({
        origin,
        destination,
        cabin: form.cabin,
        startDate: form.startDate,
        endDate: form.endDate,
        source: form.source || undefined,
      })
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
      const data = await cachedSearch({
        origin: form.origin.toUpperCase().trim(),
        destination: form.destination.toUpperCase().trim(),
        cabin: form.cabin,
        startDate: form.startDate,
        endDate: form.endDate,
        source: form.source || undefined,
        cursor: results.cursor,
      })
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
    if (row.YAvailable) cabins.push({ cabin: 'Y', miles: row.YMileageCost, seats: row.YRemainingSeats })
    if (row.WAvailable) cabins.push({ cabin: 'W', miles: row.WMileageCost, seats: row.WRemainingSeats })
    if (row.JAvailable) cabins.push({ cabin: 'J', miles: row.JMileageCost, seats: row.JRemainingSeats })
    if (row.FAvailable) cabins.push({ cabin: 'F', miles: row.FMileageCost, seats: row.FRemainingSeats })
    return cabins
  }

  const cabinLabel = { Y: 'Economy', W: 'Prem Econ', J: 'Business', F: 'First' }

  const formatMiles = (n) => n != null ? Number(n).toLocaleString() : '—'

  return (
    <div>
      <h2>Award Search</h2>
      <p className="section-desc">Search award flight availability across mileage programs via Seats.aero</p>

      {!apiReady && (
        <div className="award-error">
          Seats.aero API key is not configured. Add <code>VITE_SEATS_AERO_API_KEY</code> to your <code>.env</code> file and restart the dev server.
        </div>
      )}

      <form className="award-search-form" onSubmit={handleSearch}>
        <div className="award-form-grid">
          <label>
            Origin
            <input
              name="origin"
              placeholder="SFO"
              value={form.origin}
              onChange={handleChange}
              maxLength={3}
              required
            />
          </label>
          <label>
            Destination
            <input
              name="destination"
              placeholder="NRT"
              value={form.destination}
              onChange={handleChange}
              maxLength={3}
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
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
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
        <button type="submit" className="btn btn-primary award-search-btn" disabled={loading || !apiReady}>
          {loading ? 'Searching...' : 'Search Awards'}
        </button>
      </form>

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
                <div key={row.ID} className="award-result-card">
                  <div className="award-result-route">
                    <div className="award-route-airports">
                      <span className="airport-code">{row.Route?.OriginAirport}</span>
                      <span className="route-arrow">→</span>
                      <span className="airport-code">{row.Route?.DestinationAirport}</span>
                    </div>
                    <div className="award-route-meta">
                      <span className="tag">{formatDate(row.Date)}</span>
                      <span className="tag tag-blue">{row.Source}</span>
                    </div>
                  </div>

                  <div className="award-cabins">
                    {getCabinAvailability(row).map(c => (
                      <div key={c.cabin} className="award-cabin-pill">
                        <span className="cabin-label">{cabinLabel[c.cabin]}</span>
                        <span className="cabin-miles">{formatMiles(c.miles)} mi</span>
                        <span className="cabin-seats">{c.seats} seat{c.seats !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                    {getCabinAvailability(row).length === 0 && (
                      <span className="empty-text">No cabin availability</span>
                    )}
                  </div>

                  {row.AvailabilityTrips && (
                    <button
                      className="btn btn-secondary award-trips-btn"
                      onClick={() => handleViewTrips(row.ID)}
                    >
                      {expandedTrip === row.ID ? 'Hide Flights' : 'View Flights'}
                    </button>
                  )}

                  {expandedTrip === row.ID && (
                    <div className="award-trip-details">
                      {tripLoading === row.ID && <p className="empty-text">Loading flight details...</p>}
                      {tripDetails[row.ID]?.error && (
                        <p className="award-error">{tripDetails[row.ID].error}</p>
                      )}
                      {tripDetails[row.ID]?.data && tripDetails[row.ID].data.map((trip) => (
                        <div key={trip.ID} className="award-trip-option">
                          <div className="trip-header">
                            <span className="tag tag-green">{trip.Cabin}</span>
                            <span>{trip.MileageCost?.toLocaleString()} miles</span>
                            <span>{trip.Stops === 0 ? 'Nonstop' : `${trip.Stops} stop${trip.Stops > 1 ? 's' : ''}`}</span>
                            <span>{Math.floor(trip.TotalDuration / 60)}h {trip.TotalDuration % 60}m</span>
                            <span>{trip.RemainingSeats} seat{trip.RemainingSeats !== 1 ? 's' : ''}</span>
                          </div>
                          {trip.AvailabilitySegments && trip.AvailabilitySegments.map((seg, i) => (
                            <div key={seg.ID || i} className="trip-segment">
                              <span className="segment-flight">{seg.FlightNumber}</span>
                              <span>{seg.OriginAirport} → {seg.DestinationAirport}</span>
                              <span className="segment-aircraft">{seg.AircraftName || seg.AircraftCode}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                      {tripDetails[row.ID]?.booking_links && tripDetails[row.ID].booking_links.length > 0 && (
                        <div className="trip-booking-links">
                          {tripDetails[row.ID].booking_links.map((link, i) => (
                            <a key={i} href={link.link} target="_blank" rel="noopener noreferrer"
                              className={`btn ${link.primary ? 'btn-primary' : 'btn-secondary'}`}
                            >
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}
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
