// Maps credit card issuer/program → Seats.aero source names they can transfer to
export const TRANSFER_PARTNERS = {
  'Chase': ['aeroplan', 'emirates', 'flyingblue', 'jetblue', 'singapore', 'united', 'virginatlantic', 'southwest'],
  'American Express': ['aeroplan', 'delta', 'emirates', 'etihad', 'flyingblue', 'jetblue', 'qantas', 'singapore', 'virginatlantic'],
  'Amex': ['aeroplan', 'delta', 'emirates', 'etihad', 'flyingblue', 'jetblue', 'qantas', 'singapore', 'virginatlantic'],
  'Capital One': ['aeroplan', 'emirates', 'etihad', 'eurobonus', 'finnair', 'flyingblue', 'qantas', 'singapore', 'turkish', 'virginatlantic'],
  'Citi': ['aeroplan', 'emirates', 'etihad', 'flyingblue', 'jetblue', 'qantas', 'qatar', 'singapore', 'turkish', 'virginatlantic'],
  'Bilt': ['aeroplan', 'alaska', 'american', 'emirates', 'flyingblue', 'turkish', 'united', 'virginatlantic'],
  'US Bank': ['aeroplan', 'flyingblue', 'virginatlantic'],
}

// Given user's cards, return set of Seats.aero sources they can book through
export function getTransferablePrograms(cards) {
  const programs = new Set()
  for (const card of cards) {
    const issuer = card.issuer?.trim()
    if (!issuer) continue
    // Check exact match first, then partial
    const partners = TRANSFER_PARTNERS[issuer]
      || Object.entries(TRANSFER_PARTNERS).find(([k]) =>
        issuer.toLowerCase().includes(k.toLowerCase())
      )?.[1]
    if (partners) {
      partners.forEach(p => programs.add(p))
    }
  }
  return programs
}
