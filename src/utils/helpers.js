export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysUntil(dateStr) {
  if (!dateStr) return Infinity
  const target = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

export function addMonths(dateStr, months) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

export function getDeadline(startDate, monthsAllowed) {
  if (!startDate || !monthsAllowed) return null
  return addMonths(startDate, monthsAllowed)
}

export function getBonusStatus(bonus) {
  if (!bonus || !bonus.spendRequired) return null
  if (bonus.amountSpent >= bonus.spendRequired) return 'completed'
  const deadline = getDeadline(bonus.startDate, bonus.monthsAllowed)
  if (deadline && daysUntil(deadline) < 0) return 'missed'
  return 'in-progress'
}

export function getSpendProgress(bonus) {
  if (!bonus || !bonus.spendRequired) return 0
  return Math.min(100, (bonus.amountSpent / bonus.spendRequired) * 100)
}

export const CARD_COLORS = [
  '#1a3c6d', '#2d6a4f', '#7b2d8e', '#c44536',
  '#1b4965', '#e07a00', '#374151', '#0f766e',
  '#7c3aed', '#be185d', '#0369a1', '#65a30d',
]

export const NETWORKS = ['Visa', 'Mastercard', 'Amex', 'Discover', 'Other']

export const SPEND_CATEGORIES = [
  'Dining', 'Travel', 'Gas', 'Groceries', 'Streaming',
  'Online Shopping', 'Transit', 'Entertainment', 'Drugstores',
  'Home Improvement', 'Everything Else',
]

export function createEmptyCard() {
  return {
    id: generateId(),
    name: '',
    issuer: '',
    network: 'Visa',
    last4: '',
    color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
    benefits: [],
    signUpBonus: {
      bonusValue: '',
      spendRequired: 0,
      monthsAllowed: 3,
      startDate: new Date().toISOString().split('T')[0],
      amountSpent: 0,
    },
    rewardCategories: [],
    annualFee: {
      amount: 0,
      nextDueDate: '',
    },
  }
}
