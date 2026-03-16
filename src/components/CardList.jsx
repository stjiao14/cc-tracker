import { formatCurrency, daysUntil, getBonusStatus, getSpendProgress, getDeadline } from '../utils/helpers'

export default function CardList({ cards, onSelect, onAdd }) {
  return (
    <div className="card-list">
      <div className="card-list-header">
        <h2>My Cards</h2>
        <button className="btn btn-primary" onClick={onAdd}>+ Add Card</button>
      </div>
      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <p>No cards yet. Add your first credit card to start tracking!</p>
        </div>
      ) : (
        <div className="cards-grid">
          {cards.map(card => {
            const bonusStatus = getBonusStatus(card.signUpBonus)
            const feeDays = daysUntil(card.annualFee?.nextDueDate)
            return (
              <div
                key={card.id}
                className="card-tile"
                style={{ borderLeftColor: card.color }}
                onClick={() => onSelect(card.id)}
              >
                <div className="card-tile-header">
                  <div className="card-tile-color" style={{ background: card.color }}>
                    {card.network?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3>{card.name || 'Unnamed Card'}</h3>
                    <span className="card-issuer">{card.issuer}{card.last4 ? ` •••• ${card.last4}` : ''}</span>
                  </div>
                </div>
                <div className="card-tile-tags">
                  {card.benefits?.length > 0 && (
                    <span className="tag">{card.benefits.length} benefit{card.benefits.length !== 1 ? 's' : ''}</span>
                  )}
                  {card.rewardCategories?.length > 0 && (
                    <span className="tag">{card.rewardCategories.length} reward cat.</span>
                  )}
                  {bonusStatus === 'in-progress' && (
                    <span className="tag tag-blue">
                      Bonus: {Math.round(getSpendProgress(card.signUpBonus))}%
                    </span>
                  )}
                  {bonusStatus === 'completed' && <span className="tag tag-green">Bonus earned</span>}
                  {bonusStatus === 'missed' && <span className="tag tag-red">Bonus missed</span>}
                  {card.annualFee?.amount > 0 && (
                    <span className={`tag ${feeDays <= 30 ? 'tag-orange' : ''}`}>
                      Fee: {formatCurrency(card.annualFee.amount)}
                      {feeDays <= 30 && feeDays >= 0 ? ` (${feeDays}d)` : ''}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
