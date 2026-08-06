import { v4 as uuid } from 'uuid'
import type { CardCategory, EvidenceCard, CharacterSlot, KillerInfo, NpcSurvivor, NpcVictim, VictimInfo } from '../types/game'
import { CARD_TEMPLATES } from '../data/cardTemplates'
import { PAST_PROFESSIONS } from '../data/pastProfessions'
import { CHARACTERS } from '../data/characters'
import { LOCATION_NAMES } from '../data/locations'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeCard(
  content: string,
  category: CardCategory,
  relatedSlot: CharacterSlot | null,
  isTrue: boolean,
): EvidenceCard {
  return { id: uuid(), content, category, relatedSlot, isTrue, ownerId: 'deck', sharedWith: [] }
}

function generateNpcTestimonyCards(
  survivors: NpcSurvivor[],
  npcVictims: NpcVictim[],
  killers: KillerInfo[],
  slots: CharacterSlot[],
  assignedProfessions: Partial<Record<CharacterSlot, string>>,
): EvidenceCard[] {
  if (killers.length === 0) return []
  const cards: EvidenceCard[] = []
  const innocentSlots = slots.filter(s => !killers.some(k => k.slot === s))
  const shuffledKillers = shuffle([...killers])

  survivors.forEach((npc, i) => {
    const killer = shuffledKillers[i % shuffledKillers.length]
    const killerName = CHARACTERS[killer.slot].name
    const locationName = LOCATION_NAMES[killer.location]

    // True: survivor saw killer heading toward crime scene
    const trueVariants = [
      `${npc.role}は、T2の頃に${killerName}が${locationName}の方向へ急ぎ足で向かうのを廊下から目撃したという。`,
      `${npc.role}によれば、夜中に${locationName}の方向から物音がした時刻、${killerName}の姿が廊下に見当たらなかったという。`,
      killer.weapon.isPoison
        ? `${npc.role}は「${killerName}が食事の準備が終わった後も厨房周辺をうろついていた」と証言している。`
        : `${npc.role}は「${killerName}が${locationName}付近で立ち止まって何かを確かめるような様子だった」と話している。`,
    ]
    cards.push(makeCard(trueVariants[i % trueVariants.length], 'alibi', killer.slot, true))

    // False: vague testimony pointing to innocent
    if (innocentSlots.length > 0) {
      const innocentSlot = innocentSlots[i % innocentSlots.length]
      const innocentName = CHARACTERS[innocentSlot].name
      const falseVariants = [
        `${npc.role}は「${innocentName}が夜中に何度も廊下を行き来していた」と話しているが、見間違いの可能性もある。`,
        `${npc.role}によれば、T2頃に${innocentName}が落ち着かない様子で部屋の外をのぞいていたという。詳細は曖昧だ。`,
      ]
      cards.push(makeCard(falseVariants[i % falseVariants.length], 'alibi', innocentSlot, false))
    } else {
      cards.push(makeCard(`${npc.role}は、T2前後に廊下で誰かと誰かが口論しているのを聞いたというが、声の主は特定できていない。`, 'alibi', null, false))
    }
  })

  // Dead NPCs: cipher card (behavior described, no name) + decoder card (name + behavior)
  // Players must hold both cards to identify who the diary entry points to.
  npcVictims.filter(v => v.isRelatedToCase).forEach((victim, i) => {
    const killer = shuffledKillers[i % shuffledKillers.length]
    const killerSlot = killer.slot
    const killerName = CHARACTERS[killerSlot].name
    const profId = assignedProfessions[killerSlot]
    const prof = profId ? PAST_PROFESSIONS.find(p => p.id === profId) : undefined

    if (prof) {
      // Remove trailing 。for embedding mid-sentence
      const hint = prof.observableHint.replace(/。$/, '')

      // Cipher: observableHint written as description, no name
      const cipherVariants = [
        `死亡した${victim.role}の手帳に走り書きが残されていた。『T2前後、${hint}人物が廊下でこちらを見た。何か知っているのだろうか』——誰のことを指しているのか。`,
        `死亡した${victim.role}の遺品にメモがあった。『${hint}者が夜、${LOCATION_NAMES[killer.location]}付近にいた』とだけ記されていた。人物は特定されていない。`,
      ]
      cards.push(makeCard(cipherVariants[i % cipherVariants.length], 'alibi', killerSlot, true))

      // Decoder: name the person and describe the same behavior
      const decoderVariants = [
        `周囲の者は${killerName}についてこう語る——「${hint}のが気になる。昔から染み付いた習慣なのかもしれない」。`,
        `館の滞在者数名が${killerName}の独特の癖を指摘している。${hint}という。本人は意識していないようだ。`,
      ]
      cards.push(makeCard(decoderVariants[i % decoderVariants.length], 'background', killerSlot, true))
    } else {
      // Fallback: vague but not direct
      cards.push(makeCard(
        `死亡した${victim.role}の手帳の最終ページに断片的な記録があった。『T2頃、廊下で見知った顔と目が合った。あの足取りはどこへ向かっていたのか』——読み取れるのはそれだけだ。`,
        'alibi', killerSlot, true
      ))
    }
  })

  return cards
}

// Coroner-style cause-of-death findings, gradually revealed via cards.
// Murdered NPCs carry a suspicious anomaly (true clue → foul play);
// natural deaths yield a clean finding (true → genuinely accidental/illness).
function generateNpcCauseCards(npcVictims: NpcVictim[]): EvidenceCard[] {
  const cards: EvidenceCard[] = []
  for (const v of npcVictims) {
    if (v.isRelatedToCase) {
      const content = v.causeHint
        ? `【検死所見】${v.role}（${v.deathLocation}で発見）。${v.causeHint}`
        : `【検死所見】${v.role}（${v.deathLocation}で発見）の遺体には、公式の死因では説明しづらい不審な点が残されていた。`
      cards.push(makeCard(content, 'victim', null, true))
    } else {
      cards.push(makeCard(
        `【検死所見】${v.role}（${v.deathLocation}で発見）。死因は「${v.apparentCause}」で、争った跡や不審な点は確認されなかった。事故・病死とみて矛盾はない。`,
        'victim', null, true,
      ))
    }
  }
  return cards
}

// 秘密通路・隠し部屋を「発見した」体裁のヒントカード（マップには載せず、カードで徐々に判明）
function generateSecretRouteCards(): EvidenceCard[] {
  const routes = [
    '書斎の本棚のひとつが横にずれ、その奥に人ひとり通れる隠し通路の入口があった。図書室の方へ通じているようだ。',
    '図書室の暖炉の奥が空洞になっており、地下へ下りる細い隠し階段が隠されていた。',
    '絵画室の壁にかかる一枚の絵の裏に、正規の間取り図には無い扉が見つかった。その先は暗い通路が続いている。',
    '地下室の石壁の一部が回転扉になっており、押すと窓のない小部屋（隠し部屋）に出た。',
    '主寝室のクローゼットの背板が外れ、細い通路が廊下の外へと伸びていた。知る者は少ないという。',
    '館の古い設計図が見つかった。公式の図面には無い通路が数本、赤い線で書き加えられている。',
    '廊下の突き当たりの羽目板に不自然な継ぎ目があり、押すと通路が現れた。ごく最近、誰かが通った形跡がある。',
    '温室の裏から地下へ抜ける小さな隠し扉が見つかった。土で汚れた足跡がその先へ続いていた。',
  ]
  return shuffle(routes).slice(0, 3).map(r => makeCard(r, 'technical', null, true))
}

export function dealCards(
  playerIds: string[],
  slots: CharacterSlot[],
  killers: KillerInfo[],
  victims: VictimInfo[],
  cardsPerPlayer = 5,
  deckSize = 25,
  assignedProfessions: Partial<Record<CharacterSlot, string>> = {},
  npcSurvivors: NpcSurvivor[] = [],
  npcVictims: NpcVictim[] = [],
  outsideKiller = false,
  suicide = false,
): Record<string, EvidenceCard> {
  const killerSlots = killers.map(k => k.slot)
  const killerWeaponIds = killers.map(k => k.weapon.id)
  const crimeLocations = killers.map(k => k.location)
  const victimSlots = victims.map(v => v.slot)

  // resolve each template into a card with a concrete isTrue value
  const resolved: EvidenceCard[] = CARD_TEMPLATES.map(t => {
    let isTrue = t.baseIsTrue

    if (t.condition) {
      if (t.condition === 'suicide') {
        isTrue = suicide
      } else if (t.condition === 'outside_killer') {
        isTrue = outsideKiller
      } else if (t.condition.startsWith('crime_scene:')) {
        const loc = t.condition.replace('crime_scene:', '')
        isTrue = crimeLocations.some(l => l === loc)
      } else if (t.condition.startsWith('weapon:')) {
        const wid = t.condition.replace('weapon:', '')
        isTrue = killerWeaponIds.includes(wid)
      }
    }

    if (t.relatedSlot && killerSlots.includes(t.relatedSlot) && t.baseIsTrue) isTrue = true
    if (t.relatedSlot && victimSlots.includes(t.relatedSlot) && t.category === 'victim') isTrue = t.baseIsTrue

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

  // profession hint cards
  const professionCards: EvidenceCard[] = []
  for (const slot of slots) {
    const profId = assignedProfessions[slot]
    if (!profId) continue
    const prof = PAST_PROFESSIONS.find(p => p.id === profId)
    if (!prof) continue
    const charName = CHARACTERS[slot]?.name ?? slot
    for (const tmpl of prof.cards) {
      professionCards.push(makeCard(
        tmpl.content.replace(/\{name\}/g, charName),
        tmpl.category,
        slot,
        tmpl.isTrue,
      ))
    }
  }

  // NPC testimony cards
  const npcCards = generateNpcTestimonyCards(npcSurvivors, npcVictims, killers, slots, assignedProfessions)
  // NPC cause-of-death finding cards (gradual death-cause reveal)
  const npcCauseCards = generateNpcCauseCards(npcVictims)
  // secret passage / hidden room discovery hints
  const secretRouteCards = generateSecretRouteCards()

  const shuffled = shuffle([...resolved, ...professionCards, ...npcCards, ...npcCauseCards, ...secretRouteCards])
  const totalNeeded = playerIds.length * cardsPerPlayer + deckSize
  const pool = shuffled.slice(0, Math.min(totalNeeded, shuffled.length))

  const cards: Record<string, EvidenceCard> = {}

  pool.forEach((card, i) => {
    const playerIndex = Math.floor(i / cardsPerPlayer)
    if (playerIndex < playerIds.length) card.ownerId = playerIds[playerIndex]
    cards[card.id] = card
  })

  return cards
}
