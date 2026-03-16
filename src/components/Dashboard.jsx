import { formatCurrency, daysUntil, getBonusStatus, getSpendProgress, getDeadline } from '../utils/helpers'

export default function Dashboard({ cards, onNavigate }) {
  const totalCards = cards.length
  const activeBonuses = cards.filter(c => getBonusStatus(c.signUpBonus) === 'in-progress')
  const upcomingFees = cards.filter(c => {
    const d = daysUntil(c.annualFee?.nextDueDate)
    return c.annualFee?.amount > 0 && d >= 0 && d <= 60
  })
  const totalAnnualFees = cards.reduce((s, c) => s + (c.annualFee?.amount || 0), 0)
  const totalBenefits = cards.reduce((s, c) => s + (c.benefits?.length || 0), 0)

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => onNavigate('cards')}>
          <div className="stat-value">{totalCards}</div>
          <div className="stat-label">Credit Cards</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalBenefits}</div>
          <div className="stat-label">Total Benefits</div>
        </div>
        <div className="stat-card" onClick={() => onNavigate('fees')}>
          <div className="stat-value">{formatCurrency(totalAnnualFees)}</div>
          <div className="stat-label">Annual Fees</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeBonuses.length}</div>
          <div className="stat-label">Active Bonuses</div>
        </div>
      </div>

      {activeBonuses.length > 0 && (
        <section className="dashboard-section">
          <h3>Active Sign-Up Bonuses</h3>
          {activeBonuses.map(card => {
            const progress = getSpendProgress(card.signUpBonus)
            const deadline = getDeadline(card.signUpBonus.startDate, card.signUpBonus.monthsAllowed)
            const deadlineDays = deadline ? daysUntil(deadline) : null
            const remaining = card.signUpBonus.spendRequired - card.signUpBonus.amountSpent
            return (
              <div key={card.id} className="bonus-summary-card">
                <div className="bonus-summary-header">
                  <div className="rec-card-name">
                    <span className="rec-dot" style={{ background: card.color }} />
                    <strong>{card.name}</strong>
                  </div>
                  <span className="bonus-summary-value">{card.signUpBonus.bonusValue}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill progress-in-progress" style={{ width: `${progress}%` }} />
                </div>
                <div className="bonus-summary-footer">
                  <span>{formatCurrency(remaining)} left</span>
                  {deadlineDays !== null && <span>{deadlineDays} days remaining</span>}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {upcomingFees.length > 0 && (
        <section className="dashboard-section">
          <h3>Upcoming Fees (next 60 days)</h3>
          {upcomingFees.map(card => (
            <div key={card.id} className="fee-summary-card">
              <div className="rec-card-name">
                <span className="rec-dot" style={{ background: card.color }} />
                <strong>{card.name}</strong>
              </div>
              <div>
                <span className="fee-amount">{formatCurrency(card.annualFee.amount)}</span>
                {' — '}
                <span>{daysUntil(card.annualFee.nextDueDate)} days away</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {totalCards === 0 && (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <p>Welcome! Add your first credit card to get started.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('cards')}>
            Add a Card
          </button>
        </div>
      )}
    </div>
  )
}
