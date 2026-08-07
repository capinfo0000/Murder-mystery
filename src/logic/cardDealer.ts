import { v4 as uuid } from 'uuid'
import type { CardCategory, EvidenceCard, CharacterSlot, KillerInfo, NpcSurvivor, NpcVictim, VictimInfo, MainTrick, Location } from '../types/game'
import { CARD_TEMPLATES } from '../data/cardTemplates'
import { PAST_PROFESSIONS } from '../data/pastProfessions'
import { CHARACTERS, MAIN_VICTIM } from '../data/characters'
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
  mainTrick?: MainTrick,
): EvidenceCard[] {
  if (killers.length === 0) return []
  const cards: EvidenceCard[] = []
  const innocentSlots = slots.filter(s => !killers.some(k => k.slot === s))
  // 当主(源太郎)を殺した犯人＝21時台に犯行現場にいた者。生存者の「現場へ向かうのを見た」証言はこの犯人に紐づける。
  const mainKillers = killers.filter(k => k.victimName === MAIN_VICTIM.name)
  const testimonyKillers = mainKillers.length > 0 ? mainKillers : killers
  // 犯人の到達経路に合わせて周辺証言を作る（メイントリックと矛盾させない）。
  const ct = mainTrick?.crimeTime ?? '21時'
  const approach = mainTrick?.killerApproach ?? 'corridor'

  survivors.forEach((npc, i) => {
    const killer = testimonyKillers[i % testimonyKillers.length]
    const killerName = CHARACTERS[killer.slot].name
    const locationName = LOCATION_NAMES[killer.location]

    // True: 犯人の状況に応じた真の証言。
    //  corridor … 廊下を通って現場へ向かうのを目撃
    //  passage  … 廊下では見えず、隠し通路の方で気配（＝廊下では不在）
    //  remote   … 犯行時刻には現場に不在。20時台に現場付近で"仕込み"を目撃
    const corridorV = [
      `${npc.role}は、${ct}頃に${killerName}が${locationName}の方向へ急ぎ足で向かうのを廊下から目撃したという。`,
      `${npc.role}によれば、${ct}頃に${locationName}の方向から物音がした時刻、${killerName}の姿が廊下に見当たらなかったという。`,
      `${npc.role}は「${ct}頃、${killerName}が${locationName}付近で立ち止まって何かを確かめるような様子だった」と話している。`,
    ]
    const passageV = [
      `${npc.role}によれば、${ct}頃に${locationName}の方向から物音がした時、廊下に${killerName}の姿はどこにもなかったという。廊下を通らずに現場へ達する道があったとしか思えない。`,
      `${npc.role}は「${ct}の少し前、壁の奥で衣擦れのような音がした。${killerName}が隠し通路を通ったのではないか」と話している。`,
    ]
    const remoteV = [
      `${npc.role}は、20時頃に${killerName}が${locationName}のあたりで何かを仕込むように屈み込んでいるのを見たという。`,
      `${npc.role}によれば、${ct}頃に${locationName}で物音がした時、${killerName}はその場におらず、別室で他の者と一緒だったという。`,
    ]
    const trueV = approach === 'passage' ? passageV : approach === 'remote' ? remoteV : corridorV
    cards.push(makeCard(trueV[i % trueV.length], 'alibi', killer.slot, true))

    // False: vague testimony pointing to innocent（ミスリード）
    if (innocentSlots.length > 0) {
      const innocentSlot = innocentSlots[i % innocentSlots.length]
      const innocentName = CHARACTERS[innocentSlot].name
      const falseVariants = [
        `${npc.role}は「${innocentName}が夜中に何度も廊下を行き来していた」と証言している。`,
        `${npc.role}によれば、21時頃に${innocentName}が落ち着かない様子で部屋の外をのぞいていたのを見たという。`,
      ]
      cards.push(makeCard(falseVariants[i % falseVariants.length], 'alibi', innocentSlot, false))
    } else {
      cards.push(makeCard(`${npc.role}は、21時前後に廊下で誰かと誰かが口論しているのを聞いたというが、声の主は特定できていない。`, 'alibi', null, false))
    }
  })

  // 殺されたNPCの手記：そのNPCを"実際に殺した犯人"（秘密を目撃された相手）の癖を記す。
  // 暗号カード（癖の描写・名前なし）＋解読カード（名前＋同じ癖）の2枚で犯人を特定できる。
  npcVictims.filter(v => v.isRelatedToCase).forEach((victim) => {
    const killerSlot = victim.killerSlot ?? testimonyKillers[0]?.slot ?? killers[0].slot
    const killerName = CHARACTERS[killerSlot]?.name ?? killerSlot
    const place = victim.deathLocation || '館の一角'
    const profId = assignedProfessions[killerSlot]
    const prof = profId ? PAST_PROFESSIONS.find(p => p.id === profId) : undefined

    if (prof) {
      const hint = prof.observableHint.replace(/。$/, '')
      // Cipher: 癖の描写のみ（名前なし）。「秘密を見てしまった」文脈を添える。
      const cipherVariants = [
        `死亡した${victim.role}の手帳に走り書きが残されていた。『あの夜、${hint}人物の秘密を見てしまった。気づかれていないといいが』——誰のことを指しているのか。`,
        `死亡した${victim.role}の遺品にメモがあった。『${hint}者の、人に言えない行いを${place}の近くで目にした』とだけ記されていた。人物は特定されていない。`,
      ]
      cards.push(makeCard(cipherVariants[hint.length % cipherVariants.length], 'alibi', killerSlot, true))
      // Decoder: 名前＋同じ癖
      const decoderVariants = [
        `周囲の者は${killerName}についてこう語る——「${hint}のが気になる。昔から染み付いた習慣なのかもしれない」。`,
        `館の滞在者数名が${killerName}の独特の癖を指摘している。${hint}という。本人は意識していないようだ。`,
      ]
      cards.push(makeCard(decoderVariants[place.length % decoderVariants.length], 'background', killerSlot, true))
    } else {
      cards.push(makeCard(
        `死亡した${victim.role}の手帳の最終ページに断片的な記録があった。『あの夜、見てはいけない秘密を目にしてしまった。相手は気づいただろうか』——読み取れるのはそれだけだ。`,
        'alibi', killerSlot, true,
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
      // 1枚目: 遺体の状況（＝偽装。単体では事故・病死に見える → ミスリード）
      cards.push(makeCard(`【遺体の状況】${v.role}（${where}）。${finding}`, 'victim', null, false))
      // 2枚目: 状況と矛盾する事実（真の手がかり）。2枚を突き合わせて初めて他殺と分かる
      if (v.causeContradiction) {
        cards.push(makeCard(`【関係者の証言・記録】${v.role}について——${v.causeContradiction}`, 'psychology', null, true))
      }
    } else {
      // 自然死: 状況のみ（真）。矛盾する事実は存在しない
      cards.push(makeCard(`【遺体の状況】${v.role}（${where}）。${finding}争った跡や不審な点は見当たらず、事故・病死とみて矛盾はない。`, 'victim', null, true))
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
  const misdir = makeCard(t.misdirection, 'alibi', null, false)
  const cards = [eye, sound, trace, misdir]
  const decisive = new Set<string>([eye.id])

  // 移動経路の手がかり（空間モデルから導出。廊下でのモブ目撃・階段の足音・秘密通路）。
  // 目撃証言を"どの経路で現場へ来たか"の面から裏づける真の手がかり。
  if (t.routeClue) {
    cards.push(makeCard(`【移動の跡】${t.routeClue}`, 'alibi', null, true))
  }

  // トリック（事前の仕掛け／犯行後の即席工作）があるときだけ、
  // その錯覚（ミスリード）と綻び（決定的な真）を配る。ただ逃げただけの犯行には無い。
  if (t.appearance && t.flaw) {
    const appearance = makeCard(`【一見の状況】${t.appearance}`, 'alibi', null, false)
    const flaw = makeCard(`【トリックの綻び】${t.flaw}`, 'technical', null, true)
    cards.push(appearance, flaw)
    decisive.add(flaw.id)
  }

  // 変装による濡れ衣トリックがある場合：
  // 現場付近での「目撃」（ミスリード）と、その人物の本当のアリバイ（決定的な真）を配る。
  if (t.framedName && t.framedSighting && t.framedAlibi) {
    const framedSight = makeCard(t.framedSighting, 'alibi', null, false)
    const framedAlibi = makeCard(`【裏づけ】${t.framedAlibi}`, 'alibi', null, true)
    cards.push(framedSight, framedAlibi)
    decisive.add(framedAlibi.id)
  }

  // 死体移動：1カード1情報に分割。①発見場所の見かけ（ミスリード）②死斑＝動かされた事実（真）
  // ③付着物＝真の犯行現場を指す痕跡（真）。②と③を突き合わせて真の現場が分かる。
  if (t.movedApparent && t.movedReveal) {
    cards.push(makeCard(`【遺体の状況】${t.movedApparent}`, 'victim', null, false))
    const reveal = makeCard(`【遺体の状況】${t.movedReveal}`, 'physical', null, true)
    cards.push(reveal)
    decisive.add(reveal.id)
    if (t.movedTrace) {
      const trace2 = makeCard(`【遺体の状況】${t.movedTrace}`, 'physical', null, true)
      cards.push(trace2)
      decisive.add(trace2.id)
    }
  }

  return { cards, decisive }
}

// 現場に残った痕跡（庭の花・血痕の付いた品など）から犯人を割り出す決定的手がかり。
// 「痕跡カード」＋「その品の出所＝犯人を名指す解読カード」の2枚で成立する（暗号・解読方式）。
// 犯人が現場にいた前提を、目撃証言とは別の形で担保する（決定的手がかりの多様化）。
const SPOT_TRACE: Partial<Record<Location, string>> = {
  study: '万年筆の青いインクの染み',
  library: '古い蔵書票の切れ端と黴の匂い',
  gallery: '乾いた絵の具と画溶液の匂い',
  secret_passage: '通路にしか積もらない特有の埃と蜘蛛の糸',
  safe_room: '金属の錆と機械油の匂い',
  hidden_room: 'この館では珍しい草花の花弁',
  greenhouse: '温室にしか咲かない花の花弁',
  basement: '地下室の黴と湿った土の匂い',
  master_bedroom: '当主の私室でしか焚かれない香の移り香',
  dining: '食堂の燭台の蝋の垂れ跡',
  guest_room: '客間にだけ置かれた便箋の繊維',
}

function generateSceneTraceCards(killers: KillerInfo[]): { cards: EvidenceCard[]; decisive: Set<string> } {
  const mainKiller = killers.find(k => k.victimName === MAIN_VICTIM.name && !k.isDualKiller)
  if (!mainKiller) return { cards: [], decisive: new Set() }
  // 毎回は出さない（目撃証言型の事件も残す）。約半数で採用。
  if (Math.random() < 0.5) return { cards: [], decisive: new Set() }

  const killerName = CHARACTERS[mainKiller.slot].name
  const spot = CHARACTERS[mainKiller.slot].t2Location   // 犯人が20時台に秘密行動をしていた部屋
  const spotName = LOCATION_NAMES[spot]
  const traceThing = SPOT_TRACE[spot] ?? `${spotName}特有の匂い`

  if (Math.random() < 0.5) {
    // 血痕の付いた品：犯人が返り血を拭って隠した物が、犯人の部屋の物陰から出る
    const trace = makeCard(
      `源太郎の血が付いた布切れが、遺体のある部屋から少し離れた物陰に隠すように捨てられていた。犯人が返り血や手を拭ったものらしい。`,
      'physical', mainKiller.slot, true,
    )
    const decoder = makeCard(
      `その血の付いた布が見つかったのは${spotName}の物陰だった。事件の夜、そこにひそかに出入りしていたのは${killerName}である。`,
      'background', mainKiller.slot, true,
    )
    return { cards: [trace, decoder], decisive: new Set([trace.id, decoder.id]) }
  }

  // 場所固有の痕跡（庭の花など）が現場に持ち込まれている
  const trace = makeCard(
    `源太郎の遺体のそばに、${traceThing}が残されていた。この館の中でも、限られた者しか立ち入らない一室から持ち込まれたものだ。`,
    'physical', mainKiller.slot, true,
  )
  const decoder = makeCard(
    `${traceThing}の出どころは${spotName}だ。事件の夜、そこにひそかに出入りしていたのは${killerName}——遺体のそばに残された痕跡は、そこから運ばれたものと符合する。`,
    'background', mainKiller.slot, true,
  )
  return { cards: [trace, decoder], decisive: new Set([trace.id, decoder.id]) }
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
  const npcCards = generateNpcTestimonyCards(npcSurvivors, npcVictims, killers, slots, assignedProfessions, mainTrick)
  // NPC cause-of-death finding cards (gradual death-cause reveal)
  const npcCauseCards = generateNpcCauseCards(npcVictims)
  // secret passage / hidden room discovery hints
  const secretRouteCards = generateSecretRouteCards()
  // コナン風トリック＋現場の手がかり（事件データから生成）
  const trickResult = generateTrickCards(mainTrick)
  // 現場に残った痕跡（庭の花・血痕の付いた品など）＝目撃証言とは別型の決定的手がかり
  const traceResult = generateSceneTraceCards(killers)

  // 決定的な真の手がかり（条件成立カード・犯人関連・NPC証言の真・死因の矛盾・トリックの綻び・現場痕跡）
  const keyIds = new Set<string>(decisiveIds)
  for (const c of npcCards) if (c.isTrue) keyIds.add(c.id)
  for (const c of npcCauseCards) if (c.isTrue && c.category === 'psychology') keyIds.add(c.id)
  for (const id of trickResult.decisive) keyIds.add(id)
  for (const id of traceResult.decisive) keyIds.add(id)

  const allCards = [...resolved, ...professionCards, ...npcCards, ...npcCauseCards, ...secretRouteCards, ...trickResult.cards, ...traceResult.cards]
  const handCapacity = playerIds.length * cardsPerPlayer
  const totalNeeded = handCapacity + deckSize

  const keyCards = allCards.filter(c => keyIds.has(c.id))
  const restCards = allCards.filter(c => !keyIds.has(c.id))

  // ── フェアプレイ担保（ミステリーの鉄則：完全犯罪はない）──────────────────
  //  ① 決定的な真の手がかり（痕跡・綻び・目撃・死斑など）は一枚残らず必ず場に出す。
  //     山札に回ることはあっても、"配られず捨てられる"ことは絶対にない（＝解けない事件を作らない）。
  //  ② そのうち相応の枚数は最初から手札に配り、鍵が山札に埋もれて解けない事態も防ぐ。
  const shuffledKeys = shuffle(keyCards)
  const guaranteeN = Math.min(shuffledKeys.length, handCapacity, Math.max(2, Math.ceil(playerIds.length * 0.75)))
  const handKeys = shuffledKeys.slice(0, guaranteeN)   // 手札へ確実に配る鍵
  const deckKeys = shuffledKeys.slice(guaranteeN)      // 残りの鍵は山札へ（＝ドロップしない）
  const filler = shuffle(restCards)
  const handFill = filler.slice(0, Math.max(0, handCapacity - handKeys.length))
  const usedFiller = handFill.length
  // 山札は通常 deckSize 枚だが、鍵カードは必ず全部収めるため下限を deckKeys.length に引き上げる
  const deckCapacity = Math.max(deckKeys.length, totalNeeded - handCapacity)
  const deckFill = filler.slice(usedFiller, usedFiller + Math.max(0, deckCapacity - deckKeys.length))
  const hands = shuffle([...handKeys, ...handFill])    // ちょうど handCapacity 枚
  const deck = shuffle([...deckKeys, ...deckFill])
  const pool = [...hands, ...deck]                     // 鍵カードは一枚も欠けない

  const cards: Record<string, EvidenceCard> = {}
  pool.forEach((card, i) => {
    const playerIndex = Math.floor(i / cardsPerPlayer)
    if (playerIndex < playerIds.length) card.ownerId = playerIds[playerIndex]
    cards[card.id] = card
  })

  return cards
}
