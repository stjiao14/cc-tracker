import { useState } from 'react'
import { NETWORKS, CARD_COLORS, SPEND_CATEGORIES, generateId, createEmptyCard } from '../utils/helpers'

export default function CardForm({ card, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(() => card || createEmptyCard())

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const updateNested = (parent, field, value) =>
    setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }))

  const addBenefit = () => {
    setForm(prev => ({
      ...prev,
      benefits: [...prev.benefits, { id: generateId(), name: '', description: '' }],
    }))
  }

  const updateBenefit = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      benefits: prev.benefits.map(b => b.id === id ? { ...b, [field]: value } : b),
    }))
  }

  const removeBenefit = (id) => {
    setForm(prev => ({ ...prev, benefits: prev.benefits.filter(b => b.id !== id) }))
  }

  const addRewardCategory = () => {
    setForm(prev => ({
      ...prev,
      rewardCategories: [...prev.rewardCategories, { category: '', multiplier: 1 }],
    }))
  }

  const updateReward = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      rewardCategories: prev.rewardCategories.map((r, i) =>
        i === idx ? { ...r, [field]: value } : r
      ),
    }))
  }

  const removeReward = (idx) => {
    setForm(prev => ({
      ...prev,
      rewardCategories: prev.rewardCategories.filter((_, i) => i !== idx),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form className="card-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>{card ? 'Edit Card' : 'Add New Card'}</h2>
        <button type="button" className="btn-close" onClick={onCancel}>✕</button>
      </div>

      <fieldset>
        <legend>Card Info</legend>
        <div className="form-row">
          <label>
            Card Name *
            <input
              required
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. Chase Sapphire Preferred"
            />
          </label>
          <label>
            Issuer
            <input
              value={form.issuer}
              onChange={e => update('issuer', e.target.value)}
              placeholder="e.g. Chase"
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Network
            <select value={form.network} onChange={e => update('network', e.target.value)}>
              {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label>
            Last 4 Digits
            <input
              value={form.last4}
              onChange={e => update('last4', e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              maxLength={4}
            />
          </label>
          <label>
            Color
            <div className="color-picker">
              {CARD_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => update('color', c)}
                />
              ))}
            </div>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Benefits</legend>
        {form.benefits.map(b => (
          <div key={b.id} className="form-row benefit-row">
            <input
              value={b.name}
              onChange={e => updateBenefit(b.id, 'name', e.target.value)}
              placeholder="Benefit name"
            />
            <input
              value={b.description}
              onChange={e => updateBenefit(b.id, 'description', e.target.value)}
              placeholder="Description"
            />
            <button type="button" className="btn-icon btn-danger" onClick={() => removeBenefit(b.id)}>✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={addBenefit}>+ Add Benefit</button>
      </fieldset>

      <fieldset>
        <legend>Sign-Up Bonus</legend>
        <div className="form-row">
          <label>
            Bonus Value
            <input
              value={form.signUpBonus.bonusValue}
              onChange={e => updateNested('signUpBonus', 'bonusValue', e.target.value)}
              placeholder="e.g. 80,000 points"
            />
          </label>
          <label>
            Spend Required ($)
            <input
              type="number"
              min="0"
              value={form.signUpBonus.spendRequired || ''}
              onChange={e => updateNested('signUpBonus', 'spendRequired', Number(e.target.value))}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Months Allowed
            <input
              type="number"
              min="1"
              max="24"
              value={form.signUpBonus.monthsAllowed || ''}
              onChange={e => updateNested('signUpBonus', 'monthsAllowed', Number(e.target.value))}
            />
          </label>
          <label>
            Start Date
            <input
              type="date"
              value={form.signUpBonus.startDate || ''}
              onChange={e => updateNested('signUpBonus', 'startDate', e.target.value)}
            />
          </label>
          <label>
            Amount Spent ($)
            <input
              type="number"
              min="0"
              value={form.signUpBonus.amountSpent || ''}
              onChange={e => updateNested('signUpBonus', 'amountSpent', Number(e.target.value))}
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Reward Categories</legend>
        {form.rewardCategories.map((r, idx) => (
          <div key={idx} className="form-row benefit-row">
            <select
              value={r.category}
              onChange={e => updateReward(idx, 'category', e.target.value)}
            >
              <option value="">Select category</option>
              {SPEND_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="inline-label">
              <input
                type="number"
                min="0"
                step="0.5"
                value={r.multiplier}
                onChange={e => updateReward(idx, 'multiplier', Number(e.target.value))}
              />
              x
            </label>
            <button type="button" className="btn-icon btn-danger" onClick={() => removeReward(idx)}>✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={addRewardCategory}>+ Add Category</button>
      </fieldset>

      <fieldset>
        <legend>Annual Fee</legend>
        <div className="form-row">
          <label>
            Fee Amount ($)
            <input
              type="number"
              min="0"
              value={form.annualFee.amount || ''}
              onChange={e => updateNested('annualFee', 'amount', Number(e.target.value))}
            />
          </label>
          <label>
            Next Due Date
            <input
              type="date"
              value={form.annualFee.nextDueDate || ''}
              onChange={e => updateNested('annualFee', 'nextDueDate', e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <div className="form-actions">
        {card && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => { if (confirm('Delete this card?')) onDelete(card.id) }}
          >
            Delete Card
          </button>
        )}
        <div className="form-actions-right">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            {card ? 'Save Changes' : 'Add Card'}
          </button>
        </div>
      </div>
    </form>
  )
}
