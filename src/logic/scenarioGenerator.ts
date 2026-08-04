import type {
  CharacterSlot,
  ConnectionType,
  DualKillerInfo,
  DualKillerPattern,
  GameMode,
  KillerInfo,
  NpcVictim,
  PlayerConnection,
  Scenario,
  VictimInfo,
} from '../types/game'
import { CHARACTERS, getSlotsForCount } from '../data/characters'
import { WEAPONS } from '../data/weapons'
import { CRIME_SCENE_LOCATIONS, LOCATION_NAMES } from '../data/locations'
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
  if (type === 'weapon_supply') {
    return `${toName}に「ある品物を人知れず調達しておいてほしい」と頼んだ。何に使うのかは一切告げていない。${toName}は言われた通りに動き、今夜それを渡してきた。`
  }
  if (type === 'victim_lure') {
    return `${toName}に「ある人物を今夜の決まった時刻にここへ来るよう取り計らってほしい」と頼んだ。理由は適当に言いくるめるよう指示した。${toName}は役目を果たしてくれた。`
  }
  if (type === 'map_provision') {
    return `${toName}から館の内部構造を詳しく教えてもらった。どこに何があるか、誰がどこを通るかを事前に把握した。${toName}はなぜ知りたいのかを聞かずに教えてくれた。`
  }
  if (type === 'false_alibi') {
    return `${toName}には「T2、ふたりで話していたことにしてほしい」と頼んである。実際に何があったかは告げていない。${toName}は了承してくれた。`
  }
  if (type === 'distraction') {
    return `${toName}に「T2頃、食堂か廊下で何か騒ぎを起こして人目を引きつけておいてほしい」と頼んだ。理由は告げなかったが、${toName}は引き受けてくれた。`
  }
  if (type === 'evidence_disposal') {
    return `${toName}に「ある物を人知れず処分してほしい」と頼んだ。中身を見せず、理由も告げなかった。${toName}は黙って引き受けてくれた。`
  }
  if (type === 'key_provision') {
    return `今夜のために、${toName}が持っていた合鍵を借りた。何に使うかは告げなかった。`
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
  if (type === 'weapon_supply') {
    return `${fromName}から「内緒で頼みたいことがある」と呼び出され、ある品の調達を依頼された。何に使うのか問いただしても教えてもらえず、ただ言われた通りに用意して手渡した。自分が何に加担したのか、今も知らない。`
  }
  if (type === 'victim_lure') {
    return `${fromName}から「ある人物を特定の時刻に特定の場所へ誘い出してほしい」と頼まれた。口実は自分で考えるよう言われた。なぜそんなことを頼むのか理由は聞かされなかったが、言われた通りに動いた。`
  }
  if (type === 'map_provision') {
    return `${fromName}に、館の見取り図や通路の位置を教えてほしいと頼まれた。こんな時間になぜそんなことを聞くのかと思いながらも、聞かれたことだけを答えた。その情報がどう使われたかは知らない。`
  }
  if (type === 'false_alibi') {
    return `${fromName}から「もし誰かに聞かれたら、T2はふたりで話していたと答えてほしい」と頼まれた。実際は別々にいたが、なぜそんなことを頼むのかを聞かずに承諾した。`
  }
  if (type === 'distraction') {
    return `${fromName}に「人目を引くような些細な騒ぎを起こしてほしい」と頼まれた。詳しい理由は教えてもらえなかったが、言われた通りに動いた。自分が何かの計画に使われたとは知らない。`
  }
  if (type === 'evidence_disposal') {
    return `${fromName}から包まれた何かを渡され「誰にも見られないよう捨ててきてほしい」と頼まれた。中身は確認していない。自分が何を処分したのか、今も知らない。`
  }
  if (type === 'key_provision') {
    return `${fromName}に「今夜だけ合鍵を貸してほしい」と頼まれた。「大事なものを確認するだけだ」と言われたが、それ以上の説明はなかった。鍵がどう使われたかは知らない。`
  }
  // silence_deal
  return `T2の頃、${fromName}と目が合った。あの瞬間、見られたと悟った。その後、${fromName}が静かに近づいてきた。「あのことは、誰にも話さない。ただ、今夜の話し合いで少しだけ協力してほしい」。断ることもできたが——できなかった。あなたは無言でうなずいた。`
}

function generateConnections(slots: CharacterSlot[]): PlayerConnection[] {
  if (slots.length < 2) return []
  const count = Math.floor(Math.random() * 3)  // 0, 1, 2 — equally likely
  if (count === 0) return []
  const result: PlayerConnection[] = []
  const used = new Set<string>()
  const shuffled = shuffle(slots)
  const types: ConnectionType[] = [
    'lookout', 'preparation', 'silence_deal',
    'weapon_supply', 'victim_lure', 'map_provision',
    'false_alibi', 'distraction', 'evidence_disposal', 'key_provision',
  ]

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
    const naturalNpcs = shuffledNpcs.slice(numMurderNpcs, numMurderNpcs + Math.floor(Math.random() * 3))

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
    const dualActive = numKillers >= 2 && Math.random() < 0.5

    if (dualActive) {
      type DualCategory = 'poison' | 'physical' | 'environmental'
      const POISON_NPC_IDS = ['cook', 'maid_haru', 'gardener', 'secretary', 'footman', 'accountant']
      const PHYSICAL_NPC_IDS = ['lawyer', 'maid_tsuki', 'night_guard']
      const ENVIRONMENTAL_NPC_IDS = ['driver']
      const PATTERNS_BY_CATEGORY: Record<DualCategory, DualKillerPattern[]> = {
        poison: ['poison_then_weapon', 'weapon_found_dead', 'weapon_then_poison', 'poison_failed_weapon_killed'],
        physical: ['double_weapon_first_failed', 'double_weapon_overlap'],
        environmental: ['environment_then_weapon'],
      }
      const chosenCategory = pickRandom<DualCategory>(['poison', 'physical', 'environmental'])
      const preferredIds = chosenCategory === 'poison' ? POISON_NPC_IDS
        : chosenCategory === 'physical' ? PHYSICAL_NPC_IDS
        : ENVIRONMENTAL_NPC_IDS
      const sharedNpc = shuffledNpcs.find(n => preferredIds.includes(n.id)) ?? shuffledNpcs[0]
      const remainingNpcs = shuffledNpcs.filter(n => n.id !== sharedNpc.id)
      const soloNpcs = remainingNpcs.slice(0, numKillers - 2)  // killers[2+]
      const naturalNpcs = remainingNpcs.slice(numKillers - 2, numKillers - 2 + Math.floor(Math.random() * 3))
      const chosenDualPattern = pickRandom(PATTERNS_BY_CATEGORY[chosenCategory])

      npcVictims = [
        {
          name: sharedNpc.role,
          role: sharedNpc.role,
          apparentCause: sharedNpc.disguisedMurderCause,
          isRelatedToCase: true,
          trueMurderDetail: undefined,  // filled after killers are built
          killerSlot: killerSlots[0],
          secondKillerSlot: killerSlots[1],
          dualKillerPattern: chosenDualPattern,
        },
        ...soloNpcs.map((npc, i) => ({
          name: npc.role,
          role: npc.role,
          apparentCause: npc.disguisedMurderCause,
          isRelatedToCase: true as const,
          trueMurderDetail: npc.trueMurderDetail,
          killerSlot: killerSlots[i + 2],
        })),
        ...naturalNpcs.map(npc => ({
          name: npc.role,
          role: npc.role,
          apparentCause: npc.naturalDeathCause,
          isRelatedToCase: false as const,
        })),
      ]
    } else {
      // Normal: each killer gets their own NPC
      const murderNpcs = shuffledNpcs.slice(0, numKillers)
      const naturalNpcs = shuffledNpcs.slice(numKillers, numKillers + Math.floor(Math.random() * 3))

      npcVictims = [
        ...murderNpcs.map((npc, i) => ({
          name: npc.role,
          role: npc.role,
          apparentCause: npc.disguisedMurderCause,
          isRelatedToCase: true as const,
          trueMurderDetail: npc.trueMurderDetail,
          killerSlot: killerSlots[i],
        })),
        ...naturalNpcs.map(npc => ({
          name: npc.role,
          role: npc.role,
          apparentCause: npc.naturalDeathCause,
          isRelatedToCase: false as const,
        })),
      ]
    }
  }

  // ── killers (with victim assignment) ─────────────────────
  const poisonWeapons = WEAPONS.filter(w => w.isPoison)
  const physicalWeapons = WEAPONS.filter(w => !w.isPoison && !w.isEnvironmental)
  const environmentalWeapons = WEAPONS.filter(w => w.isEnvironmental)
  const dualPattern = npcVictims[0]?.dualKillerPattern

  const sharedLocation = dualPattern ? pickRandom(CRIME_SCENE_LOCATIONS) : null

  // Pre-build the dual pair so weapon[1] can avoid repeating weapon[0]
  type DualPair = [KillerInfo, KillerInfo]
  const preDual: DualPair | null = (() => {
    if (!dualPattern) return null
    const isEnv = dualPattern === 'environment_then_weapon'
    const isDbl = dualPattern === 'double_weapon_first_failed' || dualPattern === 'double_weapon_overlap'
    const method0: 'poison' | 'weapon' | 'environmental' =
      isEnv ? 'environmental' : isDbl ? 'weapon' : 'poison'
    const w0 = isEnv ? pickRandom(environmentalWeapons) :
               method0 === 'poison' ? pickRandom(poisonWeapons) :
               pickRandom(physicalWeapons)
    const w1 = isDbl
      ? pickRandom(physicalWeapons.filter(w => w.id !== w0.id))
      : pickRandom(physicalWeapons)
    const vName = npcVictims[0].role
    return [
      { slot: killerSlots[0], victimName: vName, weapon: w0, location: sharedLocation!, method: method0, isDualKiller: true },
      { slot: killerSlots[1], victimName: vName, weapon: w1, location: sharedLocation!, method: 'weapon' as const, isDualKiller: true },
    ]
  })()

  const killers: KillerInfo[] = killerSlots.map((slot, i) => {
    if (preDual && i === 0) return preDual[0]
    if (preDual && i === 1) return preDual[1]

    let victimSlot: CharacterSlot | undefined
    let victimName: string | undefined

    if (mode === 'puzzle') {
      const idx = slots.indexOf(slot)
      victimSlot = slots[(idx + 1) % slots.length]
      victimName = CHARACTERS[victimSlot]?.name
    } else {
      // NPC index offset for dual (dual pair occupies index 0, solo killers from index 1)
      const npcIdx = dualPattern ? i - 1 : i
      victimName = npcVictims[npcIdx]?.role
    }

    return {
      slot,
      victimSlot,
      victimName,
      weapon: pickRandom(WEAPONS.filter(w => !w.isEnvironmental)),
      location: pickRandom(CRIME_SCENE_LOCATIONS),
    }
  })

  // Fill trueMurderDetail for dual killer shared victim
  if (dualPattern && npcVictims[0].dualKillerPattern) {
    const k1 = killers[0]
    const k2 = killers[1]
    const k1Name = CHARACTERS[k1.slot].name
    const k2Name = CHARACTERS[k2.slot].name
    const v = npcVictims[0].name

    let detail: string
    switch (dualPattern) {
      case 'poison_then_weapon':
        detail = `${k1Name}がT2に遅効性の毒（${k1.weapon.name}）を使い立ち去った。苦しみながら部屋へ戻った${v}のところへ、${k2Name}が${k2.weapon.name}を持って現れ止めを刺した。ふたりは互いの行動を知らなかった。`
        break
      case 'weapon_found_dead':
        detail = `${k1Name}がT2に遅効性の毒（${k1.weapon.name}）で${v}を毒殺した。その後、${k2Name}が凶器（${k2.weapon.name}）を持って部屋へ乗り込んだとき、すでに遺体となっていた。凶器は使われなかった。`
        break
      case 'weapon_then_poison':
        detail = `${k2Name}がT2に${v}を${k2.weapon.name}で傷つけ立ち去った。瀕死の${v}のもとへその後${k1Name}が現れ、毒（${k1.weapon.name}）を用いて止めを刺した。どちらが致命傷を与えたかは法医学的にも曖昧である。`
        break
      case 'poison_failed_weapon_killed':
        detail = `${k1Name}がT2より前に${v}に毒（${k1.weapon.name}）を盛ったが、量が足りず死に至らなかった。独立して${v}を狙っていた${k2Name}がT2に${k2.weapon.name}で殺害した。${k1Name}は自分の毒が効いたと信じているが、実際の死因は凶器による外傷である。`
        break
      case 'double_weapon_first_failed':
        detail = `${k1Name}がT2に${k1.weapon.name}で${v}を攻撃し、動かなくなったのを見て立ち去った。しかし${v}はまだ息があり、後から現れた${k2Name}が${k2.weapon.name}で致命傷を与えた。ふたりは互いの存在を知らない。`
        break
      case 'double_weapon_overlap':
        detail = `${k1Name}と${k2Name}が、それぞれ独立に${v}を狙っていた。T2前後に両者がほぼ同時期に接触し、それぞれ別の凶器（${k1.weapon.name}と${k2.weapon.name}）で攻撃した。どちらの一撃が致命傷となったかは法医学的にも断定できない。`
        break
      case 'environment_then_weapon':
        detail = `${k1Name}がT2より前に${LOCATION_NAMES[k1.location]}で${k1.weapon.name}を仕掛け、${v}が罠にかかり負傷した。その場を立ち去った後、事情を知らない${k2Name}が${k2.weapon.name}を手に現れ止めを刺した。ふたりは互いの計画を知らない。`
        break
    }
    npcVictims[0] = { ...npcVictims[0], trueMurderDetail: detail }
    if (dualPattern === 'environment_then_weapon') {
      npcVictims[0] = { ...npcVictims[0], apparentCause: killers[0].weapon.disguisedAs }
    }
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
      if (k.victimSlot) puzzleTargets[k.slot] = k.victimSlot
    }
  }

  const connections = generateConnections(slots)

  let dualKillerInfo: DualKillerInfo | undefined
  if (dualPattern && killers.length >= 2) {
    dualKillerInfo = {
      type: dualPattern,
      poisonKillerSlot: killers[0].slot,
      weaponKillerSlot: killers[1].slot,
      victimName: npcVictims[0].role,
    }
  }

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
    dualKillerInfo,
  }
}

export { getSlotsForCount }
