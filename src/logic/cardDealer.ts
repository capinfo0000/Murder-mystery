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
): Record<string, EvidenceCard> {
  const killerSlots = killers.map(k => k.slot)
  const killerWeaponIds = killers.map(k => k.weapon.id)
  const crimeLocations = killers.map(k => k.location)
  const victimSlots = victims.map(v => v.slot)

  // resolve each template into a card with a concrete isTrue value
  const resolved: EvidenceCard[] = CARD_TEMPLATES.map(t => {
    let isTrue = t.baseIsTrue

    if (t.condition) {
      if (t.condition.startsWith('crime_scene:')) {
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

  const shuffled = shuffle([...resolved, ...professionCards, ...npcCards])
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
