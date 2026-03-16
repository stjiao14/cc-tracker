import { useState } from 'react'
import BenefitsTab from './BenefitsTab'
import SignUpBonusTab from './SignUpBonusTab'

export default function CardDetail({ card, onBack, onEdit }) {
  const [tab, setTab] = useState('benefits')

  return (
    <div className="card-detail">
      <div className="card-detail-header">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <div className="card-detail-title" style={{ borderLeftColor: card.color }}>
          <div className="card-tile-color" style={{ background: card.color }}>
            {card.network?.charAt(0) || '?'}
          </div>
          <div>
            <h2>{card.name}</h2>
            <span className="card-issuer">{card.issuer}{card.last4 ? ` •••• ${card.last4}` : ''}</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => onEdit(card)}>Edit</button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === 'benefits' ? 'active' : ''}`}
          onClick={() => setTab('benefits')}
        >
          Benefits ({card.benefits?.length || 0})
        </button>
        <button
          className={`tab ${tab === 'bonus' ? 'active' : ''}`}
          onClick={() => setTab('bonus')}
        >
          Sign-Up Bonus
        </button>
        <button
          className={`tab ${tab === 'rewards' ? 'active' : ''}`}
          onClick={() => setTab('rewards')}
        >
          Rewards ({card.rewardCategories?.length || 0})
        </button>
      </div>

      <div className="tab-content">
        {tab === 'benefits' && <BenefitsTab benefits={card.benefits || []} />}
        {tab === 'bonus' && <SignUpBonusTab bonus={card.signUpBonus} />}
        {tab === 'rewards' && (
          <div className="rewards-list">
            {(!card.rewardCategories || card.rewardCategories.length === 0) ? (
              <p className="empty-text">No reward categories set. Edit this card to add some.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Category</th><th>Multiplier</th></tr>
                </thead>
                <tbody>
                  {card.rewardCategories.map((r, i) => (
                    <tr key={i}>
                      <td>{r.category}</td>
                      <td><strong>{r.multiplier}x</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
