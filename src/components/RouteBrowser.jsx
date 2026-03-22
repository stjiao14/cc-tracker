import { useState } from 'react'
import { getRoutes, SOURCES, isApiKeyConfigured } from '../services/seatsAero'

export default function RouteBrowser() {
  const [source, setSource] = useState('')
  const [routes, setRoutes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')

  const apiReady = isApiKeyConfigured()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!source) {
      setError('Please select a mileage program.')
      return
    }
    setLoading(true)
    setError(null)
    setRoutes(null)
    setFilter('')
    try {
      const data = await getRoutes(source)
      const routeList = data.data || data.Data || data || []
      setRoutes(Array.isArray(routeList) ? routeList : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = routes?.filter(r => {
    if (!filter) return true
    const q = filter.toUpperCase()
    return (
      r.OriginAirport?.includes(q) ||
      r.DestinationAirport?.includes(q) ||
      r.OriginRegion?.toUpperCase().includes(q) ||
      r.DestinationRegion?.toUpperCase().includes(q)
    )
  })

  const grouped = filtered ? groupByRegion(filtered) : null

  return (
    <div>
      <h2>Route Browser</h2>
      <p className="section-desc">Discover all monitored routes for a mileage program</p>

      {!apiReady && (
        <div className="award-error">
          Seats.aero API key is not configured. Add your API key in <strong>Settings</strong>.
        </div>
      )}

      <form className="award-search-form" onSubmit={handleSearch}>
        <div className="award-form-grid">
          <label>
            Program
            <select value={source} onChange={e => setSource(e.target.value)} required>
              <option value="">Select Program</option>
              {SOURCES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="btn btn-primary award-search-btn" disabled={loading || !apiReady || !source}>
          {loading ? 'Loading...' : 'Browse Routes'}
        </button>
      </form>

      {error && <div className="award-error">{error}</div>}

      {routes && (
        <div className="award-results">
          <div className="award-results-header">
            <h3>{routes.length} route{routes.length !== 1 ? 's' : ''} monitored</h3>
            <input
              className="route-filter-input"
              type="text"
              placeholder="Filter by airport or region..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>

          {filtered && filtered.length > 0 ? (
            <div className="route-groups">
              {Object.entries(grouped).map(([region, regionRoutes]) => (
                <div key={region} className="route-group">
                  <h4 className="route-group-title">{region} ({regionRoutes.length})</h4>
                  <div className="route-grid">
                    {regionRoutes.map(r => (
                      <div key={r.ID} className="route-card">
                        <div className="route-card-airports">
                          <span className="airport-code">{r.OriginAirport}</span>
                          <span className="route-arrow">→</span>
                          <span className="airport-code">{r.DestinationAirport}</span>
                        </div>
                        <div className="route-card-meta">
                          {r.Distance > 0 && (
                            <span className="route-distance">{Number(r.Distance).toLocaleString()} mi</span>
                          )}
                          <span className="tag tag-outline">{r.OriginRegion}</span>
                          <span className="route-arrow">→</span>
                          <span className="tag tag-outline">{r.DestinationRegion}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">✈</div>
              <p>{filter ? 'No routes match your filter.' : 'No routes found for this program.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function groupByRegion(routes) {
  const groups = {}
  routes.forEach(r => {
    const key = `${r.OriginRegion} → ${r.DestinationRegion}`
    if (!groups[key]) groups[key] = []
    groups[key].push(r)
  })
  return groups
}
