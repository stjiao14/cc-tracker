import { useState } from 'react'
import { getAvailability, getTrips, CABIN_OPTIONS, SOURCES, REGIONS, isApiKeyConfigured, getApiQuota } from '../services/seatsAero'
import { formatDate } from '../utils/helpers'
import { getTransferablePrograms } from '../utils/transferPartners'

export default function DealsExplorer({ cards = [] }) {
  const [form, setForm] = useState({
    source: '',
    cabin: 'business',
    startDate: '',
    endDate: '',
    originRegion: '',
    destinationRegion: '',
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [expandedTrip, setExpandedTrip] = useState(null)
  const [tripDetails, setTripDetails] = useState({})
  const [tripLoading, setTripLoading] = useState(null)
  const [quota, setQuota] = useState(null)

  const apiReady = isApiKeyConfigured()
  const transferable = getTransferablePrograms(cards)
  const isTransferable = (source) => transferable.has(source?.toLowerCase())

  const refreshQuota = () => {
    const q = getApiQuota()
    if (q) setQuota(q)
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const buildParams = () => ({
    source: form.source,
    cabin: form.cabin,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    originRegion: form.originRegion || undefined,
    destinationRegion: form.destinationRegion || undefined,
  })

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!form.source) {
      setError('Please select a mileage program.')
      return
    }
    setLoading(true)
    setError(null)
    setResults(null)
    setExpandedTrip(null)
    try {
      const data = await getAvailability(buildParams())
      setResults(data)
      refreshQuota()
    } catch (err) {
      setError(err.message)
      refreshQuota()
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = async () => {
    if (!results?.cursor) return
    setLoadingMore(true)
    try {
      const data = await getAvailability({ ...buildParams(), cursor: results.cursor })
      setResults(prev => ({
        ...data,
        data: [...(prev?.data || []), ...(data.data || [])],
        count: (prev?.count || 0) + (data.count || 0),
      }))
      refreshQuota()
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
      refreshQuota()
    } catch (err) {
      setTripDetails(prev => ({ ...prev, [availabilityId]: { error: err.message } }))
    } finally {
      setTripLoading(null)
    }
  }

  const getCabinAvailability = (row) => {
    const cabins = []
    if (row.YAvailable) cabins.push({ cabin: 'Y', miles: row.YMileageCost, seats: row.YRemainingSeats, taxes: row.YTotalTaxes, airlines: row.YAirlines })
    if (row.WAvailable) cabins.push({ cabin: 'W', miles: row.WMileageCost, seats: row.WRemainingSeats, taxes: row.WTotalTaxes, airlines: row.WAirlines })
    if (row.JAvailable) cabins.push({ cabin: 'J', miles: row.JMileageCost, seats: row.JRemainingSeats, taxes: row.JTotalTaxes, airlines: row.JAirlines })
    if (row.FAvailable) cabins.push({ cabin: 'F', miles: row.FMileageCost, seats: row.FRemainingSeats, taxes: row.FTotalTaxes, airlines: row.FAirlines })
    return cabins
  }

  const cabinLabel = { Y: 'Economy', W: 'Prem Econ', J: 'Business', F: 'First' }
  const formatMiles = (n) => n != null ? Number(n).toLocaleString() : '—'
  const formatTaxes = (cents, currency) => {
    if (!cents) return null
    const amount = (cents / 100).toFixed(0)
    return currency === 'USD' ? `$${amount}` : `${amount} ${currency || ''}`
  }
  const calcCPM = (miles, taxCents) => {
    if (!miles || !taxCents) return null
    return (taxCents / miles).toFixed(2)
  }

  return (
    <div>
      <div className="award-search-header">
        <div>
          <h2>Deals Explorer</h2>
          <p className="section-desc">Browse award availability across regions by mileage program</p>
        </div>
        {quota && (
          <div className="api-quota">
            <span className={`quota-badge ${quota.remaining < 10 ? 'quota-low' : ''}`}>
              API: {quota.remaining} calls left today
            </span>
          </div>
        )}
      </div>

      {!apiReady && (
        <div className="award-error">
          Seats.aero API key is not configured. Add your API key in <strong>Settings</strong>.
        </div>
      )}

      <form className="award-search-form" onSubmit={handleSearch}>
        <div className="award-form-grid">
          <label>
            Program
            <select name="source" value={form.source} onChange={handleChange} required>
              <option value="">Select Program</option>
              {SOURCES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
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
            Origin Region
            <select name="originRegion" value={form.originRegion} onChange={handleChange}>
              <option value="">All Regions</option>
              {REGIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            Destination Region
            <select name="destinationRegion" value={form.destinationRegion} onChange={handleChange}>
              <option value="">All Regions</option>
              {REGIONS.map(r => (
                <option key={r} value={r}>{r}</option>
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
        <button type="submit" className="btn btn-primary award-search-btn" disabled={loading || !apiReady || !form.source}>
          {loading ? 'Searching...' : 'Browse Deals'}
        </button>
      </form>

      {error && <div className="award-error">{error}</div>}

      {results && (
        <div className="award-results">
          <div className="award-results-header">
            <h3>{results.count || 0} deal{results.count !== 1 ? 's' : ''} found</h3>
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
                        {row.Route?.OriginRegion && (
                          <span className="tag tag-outline">{row.Route.OriginRegion}</span>
                        )}
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
                            {c.airlines && <span className="cabin-airlines">{c.airlines}</span>}
                            <span className="cabin-seats">{c.seats} seat{c.seats !== 1 ? 's' : ''}</span>
                          </div>
                        )
                      })}
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
                            {trip.AllianceCost > 0 && trip.AllianceCost !== trip.MileageCost && (
                              <span className="trip-alliance-cost">({formatMiles(trip.AllianceCost)} alliance)</span>
                            )}
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
                              {seg.FareClass && (
                                <span className="segment-fareclass">{seg.FareClass}</span>
                              )}
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
              <p>No deals found for this program and filter combination.</p>
            </div>
          )}

          {results.hasMore && (
            <button
              className="btn btn-secondary award-search-btn"
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {loadingMore ? 'Loading more...' : 'Load More Deals'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
