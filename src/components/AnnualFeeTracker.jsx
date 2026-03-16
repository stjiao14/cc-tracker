import { formatCurrency, formatDate, daysUntil } from '../utils/helpers'

export default function AnnualFeeTracker({ cards }) {
  const cardsWithFees = cards
    .filter(c => c.annualFee?.amount > 0)
    .map(c => ({
      ...c,
      feeDays: daysUntil(c.annualFee.nextDueDate),
      benefitCount: c.benefits?.length || 0,
    }))
    .sort((a, b) => a.feeDays - b.feeDays)

  const totalFees = cardsWithFees.reduce((sum, c) => sum + c.annualFee.amount, 0)

  return (
    <div className="fee-tracker">
      <div className="fee-header">
        <h2>Annual Fee Tracker</h2>
        <div className="fee-total">
          Total annual fees: <strong>{formatCurrency(totalFees)}</strong>
        </div>
      </div>

      {cardsWithFees.length === 0 ? (
        <div className="empty-state">
          <p>No cards with annual fees. Cards with $0 fees are hidden.</p>
        </div>
      ) : (
        <div className="fee-cards">
          {cardsWithFees.map(card => {
            const urgent = card.feeDays >= 0 && card.feeDays <= 30
            const overdue = card.feeDays < 0
            return (
              <div key={card.id} className={`fee-card ${urgent ? 'fee-urgent' : ''} ${overdue ? 'fee-overdue' : ''}`}>
                <div className="fee-card-header">
                  <div className="rec-card-name">
                    <span className="rec-dot" style={{ background: card.color }} />
                    <strong>{card.name}</strong>
                  </div>
                  <span className="fee-amount">{formatCurrency(card.annualFee.amount)}/yr</span>
                </div>
                <div className="fee-card-body">
                  <div className="fee-detail">
                    <span>Next Due</span>
                    <span>
                      {card.annualFee.nextDueDate ? formatDate(card.annualFee.nextDueDate) : 'Not set'}
                      {urgent && <span className="badge badge-orange"> Due in {card.feeDays} days</span>}
                      {overdue && <span className="badge badge-red"> Overdue</span>}
                    </span>
                  </div>
                  <div className="fee-detail">
                    <span>Benefits</span>
                    <span>{card.benefitCount} listed</span>
                  </div>
                  <div className="fee-detail">
                    <span>Reward Categories</span>
                    <span>{card.rewardCategories?.length || 0} set</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
