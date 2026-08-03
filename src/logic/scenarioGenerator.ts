import type {
  CharacterSlot,
  GameMode,
  KillerInfo,
  Scenario,
  VictimInfo,
} from '../types/game'
import { CHARACTERS, getSlotsForCount } from '../data/characters'
import { WEAPONS } from '../data/weapons'
import { CRIME_SCENE_LOCATIONS } from '../data/locations'
import { VICTIM_BACKGROUNDS } from '../data/victimBackgrounds'
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

function victimCount(playerCount: number, mode: GameMode): number {
  if (mode === 'puzzle') return 0 // puzzle: everyone kills someone
  const max = playerCount <= 5 ? 1 : playerCount <= 6 ? 2 : 2
  return Math.floor(Math.random() * max) + 1
}

export function generateScenario(
  playerCount: number,
  mode: GameMode
): Scenario {
  const slots = getSlotsForCount(playerCount)
  const shuffled = shuffle(slots)

  // ── victims ──────────────────────────────────────────────
  const numVictims = mode === 'puzzle' ? 0 : victimCount(playerCount, mode)
  const victimSlots = shuffled.slice(0, numVictims)
  const victims: VictimInfo[] = victimSlots.map(slot => ({
    slot,
    background: pickRandom(VICTIM_BACKGROUNDS).detail,
  }))

  const nonVictimSlots = slots.filter(s => !victimSlots.includes(s))

  // ── killers ───────────────────────────────────────────────
  let killerSlots: CharacterSlot[]
  if (mode === 'puzzle') {
    // everyone kills someone in a cycle
    killerSlots = [...slots]
  } else if (mode === 'hard') {
    const numKillers = Math.min(
      Math.floor(Math.random() * 2) + 2,
      nonVictimSlots.length - 1
    )
    killerSlots = shuffle(nonVictimSlots).slice(0, numKillers)
  } else {
    killerSlots = [pickRandom(nonVictimSlots)]
  }

  // innocent slots — kept for reference (not directly used in generation)
  const _innocentSlots = nonVictimSlots.filter(s => !killerSlots.includes(s))
  void _innocentSlots

  const killers: KillerInfo[] = killerSlots.map(slot => {
    let targetVictim: CharacterSlot
    if (mode === 'puzzle') {
      // each killer targets the next slot in cycle
      const idx = slots.indexOf(slot)
      targetVictim = slots[(idx + 1) % slots.length]
    } else {
      targetVictim = pickRandom(victimSlots)
    }
    return {
      slot,
      victimSlot: targetVictim,
      weapon: pickRandom(WEAPONS),
      location: pickRandom(CRIME_SCENE_LOCATIONS),
    }
  })

  // ── roles ─────────────────────────────────────────────────
  const roles = {} as Partial<Record<CharacterSlot, 'killer' | 'innocent'>>
  for (const s of slots) {
    roles[s] = killerSlots.includes(s) ? 'killer' : 'innocent'
  }

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
      puzzleTargets[k.slot] = k.victimSlot
    }
  }

  return { victims, killers, roles, alibis, secretActions, puzzleTargets }
}

export { getSlotsForCount }
