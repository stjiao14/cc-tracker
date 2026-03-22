import { useState } from 'react'
import { isApiKeyConfigured, setApiKey } from '../services/seatsAero'

const API_KEY_STORAGE_KEY = 'cc-tracker-seats-aero-api-key'

export default function Settings() {
  const [key, setKey] = useState(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '')
  const [saved, setSaved] = useState(false)
  const [masked, setMasked] = useState(true)

  const handleSave = () => {
    setApiKey(key)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = () => {
    setKey('')
    setApiKey('')
    setSaved(false)
  }

  return (
    <div>
      <h2>Settings</h2>
      <p className="section-desc">Configure API keys and preferences</p>

      <fieldset className="settings-section">
        <legend>Seats.aero API Key</legend>
        <p className="settings-help">
          Enter your Seats.aero Partner API key to enable award search, deals explorer, and route browser.
          Your key is stored locally in your browser and never sent to any server other than Seats.aero.
        </p>
        <div className="settings-key-row">
          <input
            type={masked ? 'password' : 'text'}
            value={key}
            onChange={e => { setKey(e.target.value); setSaved(false) }}
            placeholder="Enter your Seats.aero API key"
            className="settings-key-input"
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setMasked(m => !m)}
          >
            {masked ? 'Show' : 'Hide'}
          </button>
        </div>
        <div className="settings-key-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={!key.trim()}>
            Save Key
          </button>
          <button className="btn btn-secondary" onClick={handleClear} disabled={!key}>
            Clear Key
          </button>
          {saved && <span className="settings-saved">Saved!</span>}
        </div>
        <div className="settings-key-status">
          Status: {isApiKeyConfigured()
            ? <span className="tag tag-green">Configured</span>
            : <span className="tag tag-outline">Not configured</span>
          }
        </div>
      </fieldset>
    </div>
  )
}
