import type {
  CharacterSlot,
  GameMode,
  KillerInfo,
  NpcVictim,
  Scenario,
  VictimInfo,
} from '../types/game'
import { CHARACTERS, getSlotsForCount } from '../data/characters'
import { WEAPONS } from '../data/weapons'
import { CRIME_SCENE_LOCATIONS } from '../data/locations'
import { VICTIM_BACKGROUNDS } from '../data/victimBackgrounds'
import { EXTRA_NPCS } from '../data/extraNpcs'
import { generateAlibis } from './alibiGenerator'

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

export function generateScenario(
  playerCount: number,
  mode: GameMode
): Scenario {
  const slots = getSlotsForCount(playerCount)
  const shuffledSlots = shuffle(slots)

  // ── killers ───────────────────────────────────────────────
  let killerSlots: CharacterSlot[]
  let outsideKiller = false
  if (mode === 'puzzle') {
    killerSlots = [...slots]
  } else {
    // n equal options: 1..n-1 player killers + outside killer (each 1/n probability)
    const roll = Math.floor(Math.random() * slots.length)
    if (roll === slots.length - 1) {
      killerSlots = []
      outsideKiller = true
    } else {
      killerSlots = shuffledSlots.slice(0, roll + 1)
    }
  }

  // ── roles ─────────────────────────────────────────────────
  const roles = {} as Partial<Record<CharacterSlot, 'killer' | 'innocent'>>
  for (const s of slots) {
    roles[s] = killerSlots.includes(s) ? 'killer' : 'innocent'
  }

  // ── victims ───────────────────────────────────────────────
  // puzzle mode: every player kills the next in a cycle (all are victims too)
  // non-puzzle: no player characters die — only NPCs
  let victims: VictimInfo[] = []
  let npcVictims: NpcVictim[] = []

  if (mode === 'puzzle') {
    victims = slots.map(slot => ({
      slot,
      background: pickRandom(VICTIM_BACKGROUNDS).detail,
    }))
  } else if (outsideKiller) {
    const shuffledNpcs = shuffle(EXTRA_NPCS)
    // Hitman killed 2–4 NPCs; rest died naturally (noise)
    const numMurderNpcs = Math.floor(Math.random() * 3) + 2
    const murderNpcs = shuffledNpcs.slice(0, numMurderNpcs)
    const naturalNpcs = shuffledNpcs.slice(numMurderNpcs, numMurderNpcs + Math.floor(Math.random() * 2) + 1)

    npcVictims = [
      ...murderNpcs.map(npc => ({
        name: npc.role,
        role: npc.role,
        apparentCause: npc.disguisedMurderCause,
        isRelatedToCase: true,
        trueMurderDetail: npc.hitmanMurderDetail,
        // killerSlot intentionally undefined — hitman, not a player
      })),
      ...naturalNpcs.map(npc => ({
        name: npc.role,
        role: npc.role,
        apparentCause: npc.naturalDeathCause,
        isRelatedToCase: false,
      })),
    ]
  } else {
    const shuffledNpcs = shuffle(EXTRA_NPCS)
    const numKillers = killerSlots.length

    // Each killer murders exactly one NPC (1-to-1 assignment)
    const murderNpcs = shuffledNpcs.slice(0, numKillers)
    const naturalNpcs = shuffledNpcs.slice(numKillers, numKillers + Math.floor(Math.random() * 2) + 1)

    npcVictims = [
      ...murderNpcs.map((npc, i) => ({
        name: npc.role,
        role: npc.role,
        apparentCause: npc.disguisedMurderCause,
        isRelatedToCase: true,
        trueMurderDetail: npc.trueMurderDetail,
        killerSlot: killerSlots[i],
      })),
      ...naturalNpcs.map(npc => ({
        name: npc.role,
        role: npc.role,
        apparentCause: npc.naturalDeathCause,
        isRelatedToCase: false,
      })),
    ]
  }

  // ── killers (with victim assignment) ─────────────────────
  const killers: KillerInfo[] = killerSlots.map((slot, i) => {
    let victimSlot: CharacterSlot | undefined
    let victimName: string | undefined

    if (mode === 'puzzle') {
      // circular: kill next in cycle
      const idx = slots.indexOf(slot)
      victimSlot = slots[(idx + 1) % slots.length]
      victimName = CHARACTERS[victimSlot]?.name
    } else {
      // NPC victim (index matches killer index)
      const npc = npcVictims[i]
      victimName = npc.role
    }

    return {
      slot,
      victimSlot,
      victimName,
      weapon: pickRandom(WEAPONS),
      location: pickRandom(CRIME_SCENE_LOCATIONS),
    }
  })

  // ── alibis ────────────────────────────────────────────────
  const alibis = generateAlibis(slots)

  // ── secret actions ────────────────────────────────────────
  const secretActions = {} as Partial<Record<CharacterSlot, string>>
  for (const slot of slots) {
    secretActions[slot] = CHARACTERS[slot].secretAction
  }

  // ── puzzle targets ────────────────────────────────────────
  let puzzleTargets: Record<CharacterSlot, CharacterSlot> | undefined
  if (mode === 'puzzle') {
    puzzleTargets = {} as Record<CharacterSlot, CharacterSlot>
    for (const k of killers) {
      if (k.victimSlot) puzzleTargets[k.slot] = k.victimSlot
    }
  }

  return { victims, npcVictims, killers, roles, alibis, secretActions, puzzleTargets, outsideKiller: outsideKiller || undefined }
}

export { getSlotsForCount }
