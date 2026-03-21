import { useState } from 'react'
import { cachedSearch, getTrips, CABIN_OPTIONS, SOURCES } from '../services/seatsAero'
import { formatDate } from '../utils/helpers'

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
  const [error, setError] = useState(null)
  const [expandedTrip, setExpandedTrip] = useState(null)
  const [tripDetails, setTripDetails] = useState({})
  const [tripLoading, setTripLoading] = useState(null)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!form.origin || !form.destination) return
    setLoading(true)
    setError(null)
    setResults(null)
    setExpandedTrip(null)
    try {
      const data = await cachedSearch({
        origin: form.origin.toUpperCase(),
        destination: form.destination.toUpperCase(),
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

  return (
    <div>
      <h2>Award Search</h2>
      <p className="section-desc">Search award flight availability across mileage programs via Seats.aero</p>

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
        <button type="submit" className="btn btn-primary award-search-btn" disabled={loading}>
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
                        <span className="cabin-miles">{c.miles} mi</span>
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
        </div>
      )}
    </div>
  )
}
