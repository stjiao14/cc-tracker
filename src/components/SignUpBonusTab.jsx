import { formatCurrency, formatDate, getDeadline, getBonusStatus, getSpendProgress, daysUntil } from '../utils/helpers'

export default function SignUpBonusTab({ bonus }) {
  if (!bonus || !bonus.spendRequired) {
    return <p className="empty-text">No sign-up bonus tracked. Edit this card to set one.</p>
  }

  const status = getBonusStatus(bonus)
  const progress = getSpendProgress(bonus)
  const deadline = getDeadline(bonus.startDate, bonus.monthsAllowed)
  const remaining = bonus.spendRequired - bonus.amountSpent
  const deadlineDays = deadline ? daysUntil(deadline) : null

  return (
    <div className="signup-bonus">
      <div className="bonus-header">
        <div className="bonus-value">{bonus.bonusValue || 'Bonus'}</div>
        <span className={`status-badge status-${status}`}>
          {status === 'in-progress' ? 'In Progress' : status === 'completed' ? 'Completed' : 'Missed'}
        </span>
      </div>

      <div className="progress-section">
        <div className="progress-labels">
          <span>{formatCurrency(bonus.amountSpent)} spent</span>
          <span>{formatCurrency(bonus.spendRequired)} required</span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill progress-${status}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {status === 'in-progress' && remaining > 0 && (
          <p className="progress-remaining">{formatCurrency(remaining)} left to spend</p>
        )}
      </div>

      <div className="bonus-details">
        <div className="detail-row">
          <span>Start Date</span>
          <span>{formatDate(bonus.startDate)}</span>
        </div>
        <div className="detail-row">
          <span>Deadline</span>
          <span>
            {deadline ? formatDate(deadline) : '—'}
            {deadlineDays !== null && deadlineDays >= 0 && status === 'in-progress'
              ? ` (${deadlineDays} days left)`
              : ''}
          </span>
        </div>
        <div className="detail-row">
          <span>Time Period</span>
          <span>{bonus.monthsAllowed} month{bonus.monthsAllowed !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
