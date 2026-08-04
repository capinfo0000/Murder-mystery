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
}

export interface VictimInfo {
  slot: CharacterSlot
  background: string
}

// Non-playable NPC who died during the story
export interface NpcVictim {
  name: string
  role: string
  apparentCause: string      // shown during game (may disguise murder as natural death)
  isRelatedToCase: boolean   // truth: was this actually murder?
  trueMurderDetail?: string  // revealed at result when isRelatedToCase=true
  killerSlot?: CharacterSlot // which player killed them
}

export interface KillerInfo {
  slot: CharacterSlot
  victimSlot?: CharacterSlot  // set only in puzzle mode (player victim)
  victimName?: string         // set in normal/hard mode (NPC victim name)
  weapon: Weapon
  location: Location
}

export interface Scenario {
  victims: VictimInfo[]        // player victims (puzzle mode only)
  npcVictims: NpcVictim[]      // NPC deaths: murder victims + natural death noise
  killers: KillerInfo[]
  roles: Partial<Record<CharacterSlot, 'killer' | 'innocent'>>
  alibis: Partial<Record<CharacterSlot, { T1: Location; T2: Location; T3: Location }>>
  secretActions: Partial<Record<CharacterSlot, string>>
  puzzleTargets?: Partial<Record<CharacterSlot, CharacterSlot>>
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
