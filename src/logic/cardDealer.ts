import { v4 as uuid } from 'uuid'
import type { EvidenceCard, CharacterSlot } from '../types/game'
import { CARD_TEMPLATES } from '../data/cardTemplates'
import type { KillerInfo, VictimInfo } from '../types/game'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function dealCards(
  playerIds: string[],
  _slots: CharacterSlot[],
  killers: KillerInfo[],
  victims: VictimInfo[],
  cardsPerPlayer = 5,
  deckSize = 25
): Record<string, EvidenceCard> {
  const killerSlots = killers.map(k => k.slot)
  const killerWeaponIds = killers.map(k => k.weapon.id)
  const crimeLocations = killers.map(k => k.location)
  const victimSlots = victims.map(v => v.slot)

  // resolve each template into a card with a concrete isTrue value
  const resolved: EvidenceCard[] = CARD_TEMPLATES.map(t => {
    let isTrue = t.baseIsTrue

    // override truth based on scenario conditions
    if (t.condition) {
      if (t.condition.startsWith('crime_scene:')) {
        const loc = t.condition.replace('crime_scene:', '')
        isTrue = crimeLocations.some(l => l === loc)
      } else if (t.condition.startsWith('weapon:')) {
        const wid = t.condition.replace('weapon:', '')
        isTrue = killerWeaponIds.includes(wid)
      }
    }

    // cards pointing to a killer are more likely to be true
    if (t.relatedSlot && killerSlots.includes(t.relatedSlot) && t.baseIsTrue) {
      isTrue = true
    }
    // cards pointing to a victim can carry true victim info
    if (t.relatedSlot && victimSlots.includes(t.relatedSlot) && t.category === 'victim') {
      isTrue = t.baseIsTrue
    }

    return {
      id: uuid(),
      content: t.content,
      category: t.category,
      relatedSlot: t.relatedSlot,
      isTrue,
      ownerId: 'deck' as 'deck',
      sharedWith: [] as string[],
    } satisfies EvidenceCard
  })

  const shuffled = shuffle(resolved)
  const totalNeeded = playerIds.length * cardsPerPlayer + deckSize
  const pool = shuffled.slice(0, Math.min(totalNeeded, shuffled.length))

  const cards: Record<string, EvidenceCard> = {}

  // deal hands
  pool.forEach((card, i) => {
    const playerIndex = Math.floor(i / cardsPerPlayer)
    if (playerIndex < playerIds.length) {
      card.ownerId = playerIds[playerIndex]
    }
    // rest stays as 'deck'
    cards[card.id] = card
  })

  return cards
}
