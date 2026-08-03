import type { CharacterSlot, Location } from '../types/game'
import { CHARACTERS } from '../data/characters'
import { ALL_LOCATIONS } from '../data/locations'

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateAlibis(
  slots: CharacterSlot[]
): Record<CharacterSlot, { T1: Location; T2: Location; T3: Location }> {
  const alibis = {} as Record<CharacterSlot, { T1: Location; T2: Location; T3: Location }>

  // T2 is fixed: each character is at their secret action location
  // T1 and T3 are randomized from the remaining locations
  const otherLocations = ALL_LOCATIONS.filter(
    l => !slots.map(s => CHARACTERS[s].t2Location).includes(l)
  )

  for (const slot of slots) {
    const t2 = CHARACTERS[slot].t2Location
    const available = shuffle(otherLocations)
    const t1 = available[0] || pickRandom(ALL_LOCATIONS)
    const t3 = available[1] || pickRandom(ALL_LOCATIONS)
    alibis[slot] = { T1: t1, T2: t2, T3: t3 }
  }

  return alibis
}
