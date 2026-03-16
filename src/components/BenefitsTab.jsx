export default function BenefitsTab({ benefits }) {
  if (!benefits || benefits.length === 0) {
    return <p className="empty-text">No benefits listed. Edit this card to add benefits.</p>
  }

  return (
    <div className="benefits-list">
      {benefits.map(b => (
        <div key={b.id} className="benefit-item">
          <strong>{b.name}</strong>
          {b.description && <p>{b.description}</p>}
        </div>
      ))}
    </div>
  )
}
