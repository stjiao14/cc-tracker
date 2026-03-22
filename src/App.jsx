import { useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import Dashboard from './components/Dashboard'
import CardList from './components/CardList'
import CardForm from './components/CardForm'
import CardDetail from './components/CardDetail'
import SpendingOptimizer from './components/SpendingOptimizer'
import AnnualFeeTracker from './components/AnnualFeeTracker'
import AwardSearch from './components/AwardSearch'
import DealsExplorer from './components/DealsExplorer'
import RouteBrowser from './components/RouteBrowser'
import Settings from './components/Settings'

export default function App() {
  const [cards, setCards] = useLocalStorage('cc-tracker-cards', [])
  const [view, setView] = useState('dashboard')
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const selectedCard = cards.find(c => c.id === selectedCardId)

  const handleSaveCard = (card) => {
    setCards(prev => {
      const exists = prev.find(c => c.id === card.id)
      if (exists) {
        return prev.map(c => c.id === card.id ? card : c)
      }
      return [...prev, card]
    })
    setShowForm(false)
    setEditingCard(null)
    if (selectedCardId === card.id) {
      // stay on detail
    } else {
      setView('cards')
    }
  }

  const handleDeleteCard = (id) => {
    setCards(prev => prev.filter(c => c.id !== id))
    setShowForm(false)
    setEditingCard(null)
    setSelectedCardId(null)
    setView('cards')
  }

  const handleSelectCard = (id) => {
    setSelectedCardId(id)
    setView('detail')
  }

  const handleEditCard = (card) => {
    setEditingCard(card)
    setShowForm(true)
  }

  const handleAddCard = () => {
    setEditingCard(null)
    setFormKey(k => k + 1)
    setShowForm(true)
  }

  if (showForm) {
    return (
      <div className="app">
        <CardForm
          key={editingCard?.id || formKey}
          card={editingCard}
          onSave={handleSaveCard}
          onCancel={() => { setShowForm(false); setEditingCard(null) }}
          onDelete={handleDeleteCard}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="logo">💳 CC Tracker</div>
        <ul>
          <li>
            <button
              className={view === 'dashboard' ? 'active' : ''}
              onClick={() => { setView('dashboard'); setSelectedCardId(null) }}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              className={view === 'cards' || view === 'detail' ? 'active' : ''}
              onClick={() => { setView('cards'); setSelectedCardId(null) }}
            >
              My Cards
            </button>
          </li>
          <li>
            <button
              className={view === 'optimizer' ? 'active' : ''}
              onClick={() => { setView('optimizer'); setSelectedCardId(null) }}
            >
              Optimizer
            </button>
          </li>
          <li>
            <button
              className={view === 'fees' ? 'active' : ''}
              onClick={() => { setView('fees'); setSelectedCardId(null) }}
            >
              Annual Fees
            </button>
          </li>
          <li>
            <button
              className={view === 'awards' ? 'active' : ''}
              onClick={() => { setView('awards'); setSelectedCardId(null) }}
            >
              Award Search
            </button>
          </li>
          <li>
            <button
              className={view === 'deals' ? 'active' : ''}
              onClick={() => { setView('deals'); setSelectedCardId(null) }}
            >
              Deals Explorer
            </button>
          </li>
          <li>
            <button
              className={view === 'routes' ? 'active' : ''}
              onClick={() => { setView('routes'); setSelectedCardId(null) }}
            >
              Route Browser
            </button>
          </li>
          <li>
            <button
              className={view === 'settings' ? 'active' : ''}
              onClick={() => { setView('settings'); setSelectedCardId(null) }}
            >
              Settings
            </button>
          </li>
        </ul>
      </nav>

      <main className="main-content">
        {view === 'dashboard' && (
          <Dashboard cards={cards} onNavigate={setView} />
        )}
        {view === 'cards' && (
          <CardList
            cards={cards}
            onSelect={handleSelectCard}
            onAdd={handleAddCard}
          />
        )}
        {view === 'detail' && selectedCard && (
          <CardDetail
            card={selectedCard}
            onBack={() => setView('cards')}
            onEdit={handleEditCard}
          />
        )}
        {view === 'optimizer' && (
          <SpendingOptimizer cards={cards} />
        )}
        {view === 'fees' && (
          <AnnualFeeTracker cards={cards} />
        )}
        {view === 'awards' && (
          <AwardSearch cards={cards} />
        )}
        {view === 'deals' && (
          <DealsExplorer cards={cards} />
        )}
        {view === 'routes' && (
          <RouteBrowser />
        )}
        {view === 'settings' && (
          <Settings />
        )}
      </main>
    </div>
  )
}
