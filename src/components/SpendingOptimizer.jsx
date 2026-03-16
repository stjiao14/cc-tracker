import { useState } from 'react'
import { SPEND_CATEGORIES } from '../utils/helpers'

export default function SpendingOptimizer({ cards }) {
  const [selectedCategory, setSelectedCategory] = useState('')

  const getRecommendations = () => {
    if (!selectedCategory) return []
    return cards
      .map(card => {
        const match = card.rewardCategories?.find(r => r.category === selectedCategory)
        const fallback = card.rewardCategories?.find(r => r.category === 'Everything Else')
        const multiplier = match?.multiplier || fallback?.multiplier || 0
        return { card, multiplier }
      })
      .filter(r => r.multiplier > 0)
      .sort((a, b) => b.multiplier - a.multiplier)
  }

  const recommendations = getRecommendations()

  const allCategories = [...new Set([
    ...SPEND_CATEGORIES,
    ...cards.flatMap(c => (c.rewardCategories || []).map(r => r.category)),
  ])].filter(Boolean)

  return (
    <div className="spending-optimizer">
      <h2>Spending Optimizer</h2>
      <p className="section-desc">Select a purchase category to see which card earns the most rewards.</p>

      {cards.length === 0 ? (
        <div className="empty-state">
          <p>Add cards with reward categories first.</p>
        </div>
      ) : (
        <>
          <div className="category-selector">
            <label>Purchase Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">Choose a category...</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {selectedCategory && (
            <div className="recommendations">
              {recommendations.length === 0 ? (
                <p className="empty-text">No cards have rewards for this category.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Card</th>
                      <th>Multiplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.map((rec, i) => (
                      <tr key={rec.card.id} className={i === 0 ? 'best-card' : ''}>
                        <td>{i === 0 ? '🏆' : `#${i + 1}`}</td>
                        <td>
                          <div className="rec-card-name">
                            <span className="rec-dot" style={{ background: rec.card.color }} />
                            {rec.card.name}
                          </div>
                        </td>
                        <td><strong>{rec.multiplier}x</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div className="all-rewards-overview">
            <h3>All Reward Categories</h3>
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Card</th>
                  {allCategories.filter(c => cards.some(card =>
                    card.rewardCategories?.some(r => r.category === c)
                  )).slice(0, 6).map(c => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cards.filter(c => c.rewardCategories?.length > 0).map(card => (
                  <tr key={card.id}>
                    <td>
                      <div className="rec-card-name">
                        <span className="rec-dot" style={{ background: card.color }} />
                        {card.name}
                      </div>
                    </td>
                    {allCategories.filter(c => cards.some(card =>
                      card.rewardCategories?.some(r => r.category === c)
                    )).slice(0, 6).map(cat => {
                      const match = card.rewardCategories?.find(r => r.category === cat)
                      return (
                        <td key={cat}>
                          {match ? <strong>{match.multiplier}x</strong> : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
