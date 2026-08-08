// ════════════════════════════════════════════════════════════════════════
// 構造化ファクト：確定した"真相"から、誰がいつどこにいたか等の事実を構造体で導出する。
//
// 手がかりカードは文字列だが、真相（alibis / killers / roles / mainTrick /
// npcVictims）は既に構造化されている。ここではそこから機械可読なファクトを取り出し、
// 「カードの主張が真相と一致するか」を文字列一致ではなく構造で検査できるようにする。
// これが将来「真相から生成／構造で検査」へ移行する土台になる。
// ════════════════════════════════════════════════════════════════════════
import type { Scenario, CharacterSlot, Location } from '../types/game'
import { CHARACTERS, MAIN_VICTIM } from '../data/characters'
import { LOCATION_NAMES } from '../data/locations'

export type Period = 'T1' | 'T2' | 'T3'

// 「あるキャラが、ある時間帯に、ある部屋にいた」という在室ファクト
export interface PresenceFact {
  slot: CharacterSlot
  name: string
  room: Location
  roomName: string
  period: Period
}

export interface SceneFact {
  room: Location            // 当主の犯行現場（実際に手にかけられた部屋）
  roomName: string
  bodyRoom: Location        // 遺体が発見される部屋（死体移動時は現場と別）
  killerSlots: CharacterSlot[]
  crimeTime?: string
  remote: boolean
}

export interface DerivedFacts {
  presence: PresenceFact[]
  scene?: SceneFact
  // slot → その者がその夜いた部屋名の集合（T1〜T3）
  roomsBySlot: Map<CharacterSlot, Set<string>>
}

// 確定済みの真相から構造化ファクトを導出する（純関数）。
export function deriveFacts(scenario: Scenario): DerivedFacts {
  const presence: PresenceFact[] = []
  const roomsBySlot = new Map<CharacterSlot, Set<string>>()

  for (const [slotKey, a] of Object.entries(scenario.alibis ?? {})) {
    const slot = slotKey as CharacterSlot
    if (!a) continue
    const name = CHARACTERS[slot]?.name ?? slot
    const set = new Set<string>()
    ;(['T1', 'T2', 'T3'] as Period[]).forEach(period => {
      const room = a[period]
      const roomName = LOCATION_NAMES[room]
      presence.push({ slot, name, room, roomName, period })
      set.add(roomName)
    })
    roomsBySlot.set(slot, set)
  }

  const mainKillers = (scenario.killers ?? []).filter(k => k.victimName === MAIN_VICTIM.name)
  const anchor = mainKillers.find(k => !k.isDualKiller) ?? mainKillers[0]
  const scene: SceneFact | undefined = anchor
    ? {
        room: anchor.location,
        roomName: LOCATION_NAMES[anchor.location],
        bodyRoom: scenario.mainVictimLocation ?? anchor.location,
        killerSlots: mainKillers.map(k => k.slot),
        crimeTime: scenario.mainTrick?.crimeTime ?? scenario.crimeTime,
        remote: !!scenario.mainTrick?.remote,
      }
    : undefined

  return { presence, scene, roomsBySlot }
}
