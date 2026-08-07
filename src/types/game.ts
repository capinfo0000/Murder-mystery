export type CharacterSlot = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export type GameMode = 'normal' | 'hard' | 'puzzle'

export type GamePhase =
  | 'lobby'
  | 'handout'
  | 'round1'
  | 'secret_talk'
  | 'round2'
  | 'round3'
  | 'voting'
  | 'result'

export type CardCategory =
  | 'physical'    // 物的証拠
  | 'alibi'       // アリバイ証言
  | 'psychology'  // 心理・感情
  | 'background'  // 背景情報
  | 'victim'      // 被害者情報
  | 'motive'      // 動機
  | 'technical'   // 技術情報

export type Location =
  | 'study'       // 書斎
  | 'library'     // 図書室
  | 'dining'      // 食堂
  | 'basement'    // 地下室
  | 'gallery'     // 絵画室
  | 'greenhouse'  // 温室
  | 'guest_room'  // 客室
  | 'secret_passage' // 秘密通路
  | 'safe_room'   // 金庫室
  | 'hidden_room' // 隠し部屋
  | 'master_bedroom' // 主寝室（当主の自室・遺体発見場所）

export interface CharacterDef {
  slot: CharacterSlot
  name: string
  role: string
  background: string
  secretAction: string
  t2Location: Location
  killerMotive: string
  relationships: Partial<Record<CharacterSlot, string>>
}

export interface Weapon {
  id: string
  name: string
  disguisedAs: string
  howHint?: string          // 「どう殺し、どう偽装したか」の具体的な手口（凶器→偽装死因の橋渡し）
  isPoison?: boolean        // true for poison/drug weapons
  isEnvironmental?: boolean // true for environmental traps (arson, stair tampering, etc.)
}

export interface VictimInfo {
  slot: CharacterSlot
  background: string
}

// Non-playable NPC who survived and can testify
export interface NpcSurvivor {
  role: string
}

// Non-playable NPC who died during the story
export interface NpcVictim {
  name: string
  role: string
  apparentCause: string      // official recorded cause (may disguise murder as natural death)
  deathLocation: string      // estimated place of death — shown to all players
  deathTime: string          // estimated time of death — shown to all players
  causeFinding?: string      // 遺体の状況の見立て（偽装・単体では事故/病死に見える）
  causeContradiction?: string // 所見と突き合わせて他殺と分かる矛盾した事実
  isRelatedToCase: boolean   // truth: was this actually murder?
  trueMurderDetail?: string  // revealed at result when isRelatedToCase=true
  killerSlot?: CharacterSlot // which player killed them (poison killer for dual scenarios)
  dualKillerPattern?: DualKillerPattern
  secondKillerSlot?: CharacterSlot  // weapon killer in dual scenarios
}

export interface KillerInfo {
  slot: CharacterSlot
  victimSlot?: CharacterSlot  // set only in puzzle mode (player victim)
  victimName?: string         // set in normal/hard mode (NPC victim name)
  weapon: Weapon
  location: Location
  method?: 'weapon' | 'poison' | 'environmental'  // dual killer scenarios only
  isDualKiller?: boolean        // true when part of a dual-killer pair
}

export type DualKillerPattern =
  | 'poison_then_weapon'          // 毒→凶器: 遅効性毒の後に凶器犯が止めを刺す
  | 'weapon_found_dead'           // 凶器到着時に毒で既死: 凶器未使用
  | 'weapon_then_poison'          // 凶器→毒: 凶器で傷を負わせ立ち去る→毒犯が止めを刺す
  | 'poison_failed_weapon_killed' // 毒失敗→凶器: 毒の量が足りず、凶器犯が独立に殺害
  | 'double_weapon_first_failed'  // 凶器犯2人: 先の攻撃が致命傷にならず後から別の凶器で止め
  | 'double_weapon_overlap'       // 凶器犯2人: ほぼ同時に別々の凶器で攻撃、どちらが致命傷か不明
  | 'environment_then_weapon'     // 罠→凶器: 環境的手段で負傷させた後、別人が凶器で止め

// killers[0] = "first" dual killer (poison / environmental / first weapon attacker)
// killers[1] = "second" dual killer (weapon / second weapon attacker)
export interface DualKillerInfo {
  type: DualKillerPattern
  poisonKillerSlot: CharacterSlot  // killers[0].slot; name kept for backward compat
  weaponKillerSlot: CharacterSlot  // killers[1].slot; name kept for backward compat
  victimName: string
}

export type ConnectionType =
  | 'lookout'           // 見張り番
  | 'preparation'       // 準備の手伝い
  | 'silence_deal'      // 口止め取引
  | 'weapon_supply'     // 凶器・毒物の調達
  | 'victim_lure'       // 被害者を特定場所へ誘導
  | 'map_provision'     // 館の見取り図・通路情報の提供
  | 'false_alibi'       // 偽アリバイの口裏合わせ
  | 'distraction'       // 別場所での陽動・騒ぎ
  | 'evidence_disposal' // 証拠品の密かな処分
  | 'key_provision'     // 施錠された部屋の合鍵の提供

export interface PlayerConnection {
  fromSlot: CharacterSlot   // the player with leverage / who benefits
  toSlot: CharacterSlot     // the player who provides help
  type: ConnectionType
  fromText: string          // shown only to fromSlot
  toText: string            // shown only to toSlot
}

// Anonymous chain coordination — killers coerced/organized without knowing each other's identity
export type ChainContactMethod =
  | 'anonymous_phone'   // 声を変えた電話（送り主不明）
  | 'anonymous_letter'  // 差出人不明の手紙（送り主不明）
  | 'blackmail_face'    // 直接対面での脅迫（送り主は特定される）

export interface ChainLink {
  fromSlot: CharacterSlot
  toSlot: CharacterSlot
  method: ChainContactMethod
  senderKnown: boolean          // toSlotは送り主がfromSlotだと知っているか
  relayToSlot?: CharacterSlot   // toSlotが次の人物へ中継するよう命じられている場合
  relayMethod?: ChainContactMethod
  fromText: string              // fromSlotのハンドアウト用テキスト
  toText: string                // toSlotのハンドアウト用テキスト
}

export interface CooperationChain {
  mastermindSlot: CharacterSlot
  links: ChainLink[]
}

// 事件当日の一連の行動（時系列）。全キャラ共通のこの記録を"唯一の真実"とし、
// ヒントカードはここから導出するので、カードと行動が矛盾しない。
export interface TimelineEntry {
  period: string    // 20時台 / 21時台(事件) / 22時台
  location: string  // 場所（部屋名など）
  action: string    // その時間に何をしていたか（本人の真実）
}

// コナン風トリック：犯人がアリバイ工作に使った手口と、その綻び（手がかり）。
// すべて事件の実データ（犯人・場所・凶器・タイムライン）から生成し、矛盾させない。
export interface MainTrick {
  name: string                 // トリック名（計画外の犯行では「計画外の犯行」等）
  premeditated: boolean        // true=計画的犯行（事前トリックあり） / false=目撃されての衝動的口封じ（トリックなし）
  killerSlots: CharacterSlot[] // 実行した犯人
  killerNote: string           // 犯人ハンドアウトに表示する説明
  eyewitness: string           // 真・決定的：犯行時刻に犯人を現場付近で目撃
  sound: string                // 真：物音・におい（凶器の手口に一致）
  trace: string                // 真：物的痕跡（凶器の手口に一致）
  appearance?: string          // ミスリード：トリックが作り出した錯覚（計画的犯行のみ）
  flaw?: string                // 真・決定的：トリックの綻び（計画的犯行のみ）
  misdirection: string         // ミスリード：無実の人物を指す目撃証言
  // ── 濡れ衣（変装）トリックのとき ──
  framedName?: string          // 濡れ衣を着せられた人物
  framedSighting?: string      // ミスリード：濡れ衣の人物を現場付近で目撃（実は変装）
  framedAlibi?: string         // 真：濡れ衣の人物の本当の居場所（変装目撃と矛盾）
  // ── 死体移動（発見場所≠犯行現場）のとき ── ※1カード1情報で分割
  movedApparent?: string       // ミスリード：発見場所で絶命したように見える
  movedReveal?: string         // 真：死斑の向きから「別の場所で死に、運ばれた」と分かる（場所は特定しない）
  movedTrace?: string          // 真：遺体に付着した痕跡（真の犯行現場を指す）。movedRevealと合わせて現場が分かる
  // ── 遠隔・自動殺人装置（犯人は犯行時刻に不在）のとき ──
  remote?: boolean             // true=犯人は20時台に罠を設置し、犯行時刻(21時台)は別室にいた
}

export interface Scenario {
  victims: VictimInfo[]        // player victims (puzzle mode only)
  npcVictims: NpcVictim[]      // NPC deaths: murder victims + natural death noise
  killers: KillerInfo[]
  roles: Partial<Record<CharacterSlot, 'killer' | 'innocent'>>
  alibis: Partial<Record<CharacterSlot, { T1: Location; T2: Location; T3: Location }>>
  secretActions: Partial<Record<CharacterSlot, string>>
  puzzleTargets?: Partial<Record<CharacterSlot, CharacterSlot>>
  outsideKiller?: boolean      // true when a hired hitman (not any player) committed all murders
  suicide?: boolean            // true when the main victim took their own life
  connections?: PlayerConnection[]  // optional inter-player secret arrangements
  dualKillerInfo?: DualKillerInfo  // set when two killers independently targeted the same victim
  cooperationChain?: CooperationChain  // anonymous chain coordination between killers
  assignedProfessions?: Partial<Record<CharacterSlot, string>>  // past profession id per slot
  synopsis?: string  // auto-generated narrative summary shown to all players
  npcSurvivors?: NpcSurvivor[]  // NPCs present in the manor who survived
  mainVictimLocation?: Location  // 当主の遺体が発見された場所（マップの★位置）
  mainTrick?: MainTrick          // コナン風アリバイ工作（プレイヤー犯の場合）
  timelines?: Record<CharacterSlot, TimelineEntry[]>  // 各キャラの事件当日の行動（時系列）
  stories?: Record<CharacterSlot, string>  // 各キャラの個別ハンドアウトを物語として綴った文章
  discoveredBy?: string  // 第一発見者（遺体を最初に見つけた人物の役職・名前）
  crimeTime?: string     // 当主殺しの犯行時刻（例「21時25分」）。目撃・時系列・凶行欄で共通に使う
}

export interface EvidenceCard {
  id: string
  content: string
  category: CardCategory
  relatedSlot: CharacterSlot | null
  isTrue: boolean
  ownerId: string | 'deck'
  sharedWith: string[]
}

export interface SecretMessage {
  id: string
  fromPlayerId: string
  toPlayerId: string
  cardIds: string[]
  note: string
  timestamp: number
  read: boolean
}

export interface Player {
  id: string
  name: string
  characterSlot: CharacterSlot | null
  isNPC: boolean
  isReady: boolean
  hasDrawn: boolean
}

export interface VoteData {
  killerSlots: CharacterSlot[]
  suicideVote?: boolean
  puzzleAnswer?: Record<CharacterSlot, CharacterSlot>
  submittedAt?: number
}

export interface ScoreBreakdown {
  base: number
  tachimawari: number
  bonus: number
  total: number
}

export interface GameResult {
  mainKillerCaught: boolean
  outsideKillerCase?: boolean  // true when the scenario was an outside killer
  suicideCase?: boolean        // true when the scenario was a suicide
  scores: Record<string, ScoreBreakdown>
  winnerIds: string[]
  trueScenario: Scenario
}

export interface GameState {
  id: string
  hostId: string
  playerCount: number
  mode: GameMode
  phase: GamePhase
  hasGM: boolean
  totalRounds: number
  roundStartAt: number | null
  roundDurationMinutes: number
  secretTalkDurationMinutes: number
  players: Record<string, Player>
  scenario: Scenario | null
  cards: Record<string, EvidenceCard>
  secretMessages: Record<string, SecretMessage>
  votes: Record<string, VoteData>
  result: GameResult | null
}
