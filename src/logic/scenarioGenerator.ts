import type {
  CharacterSlot,
  ConnectionType,
  GameMode,
  KillerInfo,
  NpcVictim,
  PlayerConnection,
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

function connFromText(type: ConnectionType, toName: string): string {
  if (type === 'lookout') {
    return `${toName}に今夜T2の見張りを頼んだ。自分が秘密行動を実行している間、廊下を見張ってもらった。${toName}は何があったかは知らないが、誰かが近づいたら知らせるよう言われている。`
  }
  if (type === 'preparation') {
    return `${toName}に今夜の準備の一部を手伝ってもらった。具体的な用途は告げず、道具の手配と受け渡しだけを依頼した。`
  }
  // silence_deal
  return `T2の頃、あなたは偶然にも${toName}の秘密の行動を目撃してしまった。本人も気づいていた——目が合った瞬間、${toName}の顔が青ざめるのがわかった。その後、ふたりきりになった際、あなたは静かに切り出した。「見てしまったことは、誰にも言わない。ただ、今夜の話し合いで少しだけ協力してほしい」。${toName}は長い沈黙の後、うなずいた。`
}

function connToText(type: ConnectionType, fromName: string): string {
  if (type === 'lookout') {
    return `${fromName}に頼まれ、T2の間、廊下で見張りに立った。何があったかは問われていないが、誰かが近づいたら合図するよう言われた。T2にそこにいた理由の説明として使えるかもしれない。`
  }
  if (type === 'preparation') {
    return `${fromName}に頼まれ、今夜の準備を手伝った。内容の詳細は聞かされていないが、言われた通りに道具を用意して渡した。`
  }
  // silence_deal
  return `T2の頃、${fromName}と目が合った。あの瞬間、見られたと悟った。その後、${fromName}が静かに近づいてきた。「あのことは、誰にも話さない。ただ、今夜の話し合いで少しだけ協力してほしい」。断ることもできたが——できなかった。あなたは無言でうなずいた。`
}

function generateConnections(slots: CharacterSlot[]): PlayerConnection[] {
  if (slots.length < 2 || Math.random() < 0.5) return []
  const count = Math.random() < 0.7 ? 1 : 2
  const result: PlayerConnection[] = []
  const used = new Set<string>()
  const shuffled = shuffle(slots)
  const types: ConnectionType[] = ['lookout', 'preparation', 'silence_deal']

  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const from = shuffled[Math.floor(Math.random() * shuffled.length)]
      const to = shuffled[Math.floor(Math.random() * shuffled.length)]
      if (from === to) continue
      const key = from < to ? `${from}-${to}` : `${to}-${from}`
      if (used.has(key)) continue
      used.add(key)
      const type = types[Math.floor(Math.random() * types.length)]
      result.push({
        fromSlot: from,
        toSlot: to,
        type,
        fromText: connFromText(type, CHARACTERS[to].name),
        toText: connToText(type, CHARACTERS[from].name),
      })
      break
    }
  }
  return result
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

  const connections = generateConnections(slots)

  return {
    victims,
    npcVictims,
    killers,
    roles,
    alibis,
    secretActions,
    puzzleTargets,
    outsideKiller: outsideKiller || undefined,
    connections: connections.length > 0 ? connections : undefined,
  }
}

export { getSlotsForCount }
