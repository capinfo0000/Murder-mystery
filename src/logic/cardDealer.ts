import { v4 as uuid } from 'uuid'
import type { CardCategory, EvidenceCard, CharacterSlot, KillerInfo, NpcSurvivor, NpcVictim, VictimInfo, MainTrick } from '../types/game'
import { CARD_TEMPLATES } from '../data/cardTemplates'
import { PAST_PROFESSIONS } from '../data/pastProfessions'
import { CHARACTERS } from '../data/characters'
import { LOCATION_NAMES } from '../data/locations'
import { naturalizeTime } from './timeText'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// カード本文中の枠記号（A〜G）をキャラ名に、時刻トークン（T1/T2/T3）を自然表現に置換。
function resolveNames(text: string): string {
  let t = naturalizeTime(text)
  t = t.replace(/(^|[^A-Za-z0-9])([A-G])(?![A-Za-z0-9])/g,
    (_m, pre: string, letter: string) => pre + (CHARACTERS[letter as CharacterSlot]?.name ?? letter))
  return t
}

function makeCard(
  content: string,
  category: CardCategory,
  relatedSlot: CharacterSlot | null,
  isTrue: boolean,
): EvidenceCard {
  return { id: uuid(), content: resolveNames(content), category, relatedSlot, isTrue, ownerId: 'deck', sharedWith: [] }
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
        `${npc.role}は「${innocentName}が夜中に何度も廊下を行き来していた」と証言している。`,
        `${npc.role}によれば、T2頃に${innocentName}が落ち着かない様子で部屋の外をのぞいていたのを見たという。`,
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
    const where = v.deathLocation ? `${v.deathLocation}で発見` : '発見'
    const finding = v.causeFinding ?? `死因は「${v.apparentCause}」とされた。`
    if (v.isRelatedToCase) {
      // 1枚目: 検死の公式所見（＝偽装。単体では事故・病死に見える → ミスリード）
      cards.push(makeCard(`【検死所見】${v.role}（${where}）。${finding}`, 'victim', null, false))
      // 2枚目: 所見と矛盾する事実（真の手がかり）。2枚を突き合わせて初めて他殺と分かる
      if (v.causeContradiction) {
        cards.push(makeCard(`【関係者の証言・記録】${v.role}について——${v.causeContradiction}`, 'psychology', null, true))
      }
    } else {
      // 自然死: 所見のみ（真）。矛盾する事実は存在しない
      cards.push(makeCard(`【検死所見】${v.role}（${where}）。${finding}争った跡や不審な点は確認されず、事故・病死とみて矛盾はない。`, 'victim', null, true))
    }
  }
  return cards
}

// 秘密通路・隠し部屋を「発見した」体裁のヒントカード（マップには載せず、カードで徐々に判明）
function generateSecretRouteCards(): EvidenceCard[] {
  // 館に隠し通路が「存在する」という中立的な事実のみ（使用の有無は主張しない）。
  // 毎回は出さず 0〜2 枚だけ配り、隠し通路が絡まない事件も成立させる（バリエーション）。
  const routes = [
    '書斎の本棚のひとつが横にずれ、その奥に人ひとり通れる隠し通路の入口がある。図書室の方へ通じているようだ。',
    '図書室の暖炉の奥が空洞になっており、地下へ下りる細い隠し階段が隠されている。',
    '絵画室の壁にかかる一枚の絵の裏に、正規の間取り図には無い扉がある。その先は暗い通路が続いている。',
    '地下室の石壁の一部が回転扉になっており、押すと窓のない小部屋に出る。',
    '主寝室のクローゼットの背板が外れ、細い通路が廊下の外へと伸びている。知る者は少ないという。',
    '館の古い設計図が見つかった。公式の図面には無い通路が数本、赤い線で書き加えられている。',
  ]
  const count = Math.floor(Math.random() * 3) // 0〜2
  return shuffle(routes).slice(0, count).map(r => makeCard(r, 'technical', null, true))
}

// コナン風トリックと現場の手がかりを、事件の実データから生成する。
// eyewitness/flaw は決定的な真の手がかり（フェアプレイ担保の対象）。
function generateTrickCards(t?: MainTrick): { cards: EvidenceCard[]; decisive: Set<string> } {
  if (!t) return { cards: [], decisive: new Set() }
  const eye = makeCard(t.eyewitness, 'alibi', null, true)
  const sound = makeCard(t.sound, 'alibi', null, true)
  const trace = makeCard(t.trace, 'physical', null, true)
  const appearance = makeCard(`【一見の状況】${t.appearance}`, 'alibi', null, false)
  const flaw = makeCard(`【トリックの綻び】${t.flaw}`, 'technical', null, true)
  const misdir = makeCard(t.misdirection, 'alibi', null, false)
  return { cards: [eye, sound, trace, appearance, flaw, misdir], decisive: new Set([eye.id, flaw.id]) }
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
  mainTrick?: MainTrick,
): Record<string, EvidenceCard> {
  const killerSlots = killers.map(k => k.slot)
  const killerWeaponIds = killers.map(k => k.weapon.id)
  const crimeLocations = killers.map(k => k.location)
  const victimSlots = victims.map(v => v.slot)

  // resolve each template into a card with a concrete isTrue value
  const decisiveIds = new Set<string>()  // 決定的な真の手がかり（必ず手札へ）
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

    const id = uuid()
    const decisive = isTrue && (!!t.condition || (!!t.relatedSlot && killerSlots.includes(t.relatedSlot)))
    if (decisive) decisiveIds.add(id)
    return {
      id,
      content: resolveNames(t.content),
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
  // コナン風トリック＋現場の手がかり（事件データから生成）
  const trickResult = generateTrickCards(mainTrick)

  // 決定的な真の手がかり（条件成立カード・犯人関連・NPC証言の真・死因の矛盾・トリックの綻び）
  const keyIds = new Set<string>(decisiveIds)
  for (const c of npcCards) if (c.isTrue) keyIds.add(c.id)
  for (const c of npcCauseCards) if (c.isTrue && c.category === 'psychology') keyIds.add(c.id)
  for (const id of trickResult.decisive) keyIds.add(id)

  const allCards = [...resolved, ...professionCards, ...npcCards, ...npcCauseCards, ...secretRouteCards, ...trickResult.cards]
  const handCapacity = playerIds.length * cardsPerPlayer
  const totalNeeded = handCapacity + deckSize

  const keyCards = allCards.filter(c => keyIds.has(c.id))
  const restCards = allCards.filter(c => !keyIds.has(c.id))

  // フェアプレイ担保：決定的な真の手がかりを最低数、必ず手札領域に配る（山札に埋もれさせない）
  const guaranteeN = Math.min(keyCards.length, handCapacity, Math.max(1, Math.ceil(playerIds.length / 2)))
  const guaranteed = shuffle(keyCards).slice(0, guaranteeN)
  const guaranteedSet = new Set(guaranteed.map(c => c.id))
  const leftover = shuffle([...restCards, ...keyCards.filter(c => !guaranteedSet.has(c.id))])

  const handFillCount = Math.max(0, handCapacity - guaranteed.length)
  const handFill = leftover.slice(0, handFillCount)
  const deckFill = leftover.slice(handFillCount)
  const hands = shuffle([...guaranteed, ...handFill])       // 手札領域（決定的手がかりを内包）
  const pool = [...hands, ...deckFill].slice(0, totalNeeded)

  const cards: Record<string, EvidenceCard> = {}
  pool.forEach((card, i) => {
    const playerIndex = Math.floor(i / cardsPerPlayer)
    if (playerIndex < playerIds.length) card.ownerId = playerIds[playerIndex]
    cards[card.id] = card
  })

  return cards
}
