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
  slots: CharacterSlot[],
  // 犯行現場・遺体発見場所。22時台(T3)にここへ無実の者を置くと、深夜の発見前に
  // 遺体を見つけてしまう矛盾になるため、T3の候補から外す。
  excludeFromT3: Location[] = [],
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
    // T3 は現場・遺体発見場所を避ける（避けられないときだけ従来どおり）
    const t3pool = available.filter(l => l !== t1 && !excludeFromT3.includes(l))
    const t3 = t3pool[0] || available.find(l => l !== t1) || available[1] || pickRandom(ALL_LOCATIONS)
    alibis[slot] = { T1: t1, T2: t2, T3: t3 }
  }

  return alibis
}
