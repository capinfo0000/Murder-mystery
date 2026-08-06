// In-memory Firebase mock for local UI testing
import type { EvidenceCard, GamePhase, GameState, VoteData } from '../types/game'
import { generateScenario } from '../logic/scenarioGenerator'
import { dealCards } from '../logic/cardDealer'
import { computeScores, determineWinners, determineMainKillerCaught } from '../logic/gameLogic'
import { getSlotsForCount } from '../data/characters'
import { v4 as uuid } from 'uuid'

const games: Record<string, GameState> = {}
const listeners: Record<string, ((state: GameState | null) => void)[]> = {}

let _uid = 'mock-user-' + Math.random().toString(36).slice(2, 6)

function notify(gameId: string) {
  const snap = games[gameId] ? { ...games[gameId], players: { ...games[gameId].players } } : null
  for (const cb of listeners[gameId] ?? []) cb(snap)
}

export const db = null
export const auth = null

export async function signIn(): Promise<string> {
  return _uid
}

export async function createGame(
  hostId: string,
  settings?: {
    playerCount?: number
    mode?: import('../types/game').GameMode
    hasGM?: boolean
    roundDurationMinutes?: number
    totalRounds?: number
  }
): Promise<string> {
  const gameId = Math.random().toString(36).slice(2, 8).toUpperCase()
  games[gameId] = {
    id: gameId,
    hostId,
    playerCount: settings?.playerCount ?? 5,
    mode: settings?.mode ?? (['normal', 'hard', 'puzzle'] as const)[Math.floor(Math.random() * 3)],
    phase: 'lobby',
    hasGM: settings?.hasGM ?? false,
    totalRounds: settings?.totalRounds ?? 3,
    roundStartAt: null,
    roundDurationMinutes: settings?.roundDurationMinutes ?? 20,
    secretTalkDurationMinutes: 10,
    players: {},
    scenario: null,
    cards: {},
    secretMessages: {},
    votes: {},
    result: null,
  }
  return gameId
}

export async function updateGameSettings(
  gameId: string,
  hostId: string,
  settings: Partial<Pick<GameState, 'playerCount' | 'mode' | 'hasGM' | 'roundDurationMinutes' | 'secretTalkDurationMinutes' | 'totalRounds'>>
): Promise<void> {
  if (games[gameId]?.hostId !== hostId) return
  games[gameId] = { ...games[gameId], ...settings }
  notify(gameId)
}

export async function joinGame(gameId: string, playerId: string, name: string, isNPC: boolean): Promise<void> {
  if (!games[gameId]) return
  games[gameId].players[playerId] = { id: playerId, name, characterSlot: null, isNPC, isReady: false, hasDrawn: false }
  notify(gameId)
}

export async function startGame(gameId: string, hostId: string): Promise<void> {
  const state = games[gameId]
  if (!state || state.hostId !== hostId) return

  const playersMap = state.players ?? {}
  const humanPlayers = Object.entries(playersMap).filter(([, p]) => !p.isNPC)
  const totalCount = state.playerCount
  const npcCount = Math.min(totalCount - humanPlayers.length, 3)
  const existingNPCs = Object.values(playersMap).filter(p => p.isNPC).length
  for (let i = existingNPCs; i < npcCount; i++) {
    const npcId = `npc_${uuid().slice(0, 6)}`
    state.players[npcId] = { id: npcId, name: `NPC${i + 1}`, characterSlot: null, isNPC: true, isReady: false, hasDrawn: false }
  }

  const allIds = Object.keys(state.players)
  const slots = getSlotsForCount(totalCount)
  const shuffled = [...slots].sort(() => Math.random() - 0.5)
  allIds.forEach((pid, i) => { state.players[pid].characterSlot = shuffled[i] })

  const scenario = generateScenario(totalCount, state.mode)
  state.scenario = scenario

  const humanIds = allIds.filter(id => !state.players[id].isNPC)
  const npcIds = allIds.filter(id => state.players[id].isNPC)
  const cards = dealCards([...humanIds, ...npcIds], slots, scenario.killers, scenario.victims, 5, 25, scenario.assignedProfessions ?? {}, scenario.npcSurvivors ?? [], scenario.npcVictims ?? [], scenario.outsideKiller ?? false)
  state.cards = cards as Record<string, EvidenceCard>
  state.phase = 'handout'
  notify(gameId)
}

export async function advancePhase(gameId: string, hostId: string, nextPhase: GamePhase): Promise<void> {
  const state = games[gameId]
  if (!state || state.hostId !== hostId) return
  state.phase = nextPhase
  state.roundStartAt = Date.now()
  if (['round1', 'round2', 'round3'].includes(nextPhase)) {
    const npcIds = Object.entries(state.players).filter(([, p]) => p.isNPC).map(([id]) => id)
    for (const npcId of npcIds) {
      const npcCardIds = Object.entries(state.cards ?? {})
        .filter(([, c]) => c.ownerId === npcId && !c.sharedWith.includes('all'))
        .map(([id]) => id).slice(0, 3)
      for (const cid of npcCardIds) state.cards[cid].sharedWith = ['all']
    }
  }
  notify(gameId)
}

export async function setReady(gameId: string, playerId: string): Promise<void> {
  if (games[gameId]?.players[playerId]) {
    games[gameId].players[playerId].isReady = true
    notify(gameId)
  }
}

export async function shareCardWithAll(gameId: string, cardId: string): Promise<void> {
  if (games[gameId]?.cards[cardId]) {
    games[gameId].cards[cardId].sharedWith = ['all']
    notify(gameId)
  }
}

export async function sendCardToPlayer(gameId: string, fromPlayerId: string, toPlayerId: string, cardIds: string[], note: string): Promise<void> {
  const state = games[gameId]
  if (!state) return
  const msgId = uuid()
  state.secretMessages[msgId] = { id: msgId, fromPlayerId, toPlayerId, cardIds, note, timestamp: Date.now(), read: false }
  for (const cid of cardIds) {
    if (!state.cards[cid].sharedWith.includes(toPlayerId)) state.cards[cid].sharedWith.push(toPlayerId)
  }
  notify(gameId)
}

export async function drawFromDeck(gameId: string, playerId: string): Promise<string | null> {
  const state = games[gameId]
  if (!state) return null
  const deck = Object.entries(state.cards).filter(([, c]) => c.ownerId === 'deck')
  if (!deck.length) return null
  const [cid] = deck[Math.floor(Math.random() * deck.length)]
  state.cards[cid].ownerId = playerId
  state.players[playerId].hasDrawn = true
  notify(gameId)
  return cid
}

export async function submitVote(gameId: string, playerId: string, vote: VoteData): Promise<void> {
  if (!games[gameId]) return
  games[gameId].votes[playerId] = { ...vote, submittedAt: Date.now() }
  notify(gameId)
}

export async function finalizeResult(gameId: string, hostId: string): Promise<void> {
  const state = games[gameId]
  if (!state || state.hostId !== hostId) return
  const scores = computeScores(state)
  const winnerIds = determineWinners(scores)
  const mainKillerCaught = determineMainKillerCaught(state)
  const outsideKillerCase = state.scenario?.outsideKiller === true
  state.result = { mainKillerCaught, outsideKillerCase, scores, winnerIds, trueScenario: state.scenario! }
  state.phase = 'result'
  notify(gameId)
}

export function subscribeGame(gameId: string, callback: (state: GameState | null) => void): () => void {
  if (!listeners[gameId]) listeners[gameId] = []
  listeners[gameId].push(callback)
  setTimeout(() => callback(games[gameId] ?? null), 50)
  return () => { listeners[gameId] = listeners[gameId].filter(cb => cb !== callback) }
}

export async function renamePlayer(gameId: string, playerId: string, name: string): Promise<void> {
  if (games[gameId]?.players[playerId]) {
    games[gameId].players[playerId].name = name
    notify(gameId)
  }
}

export function markMessageRead(gameId: string, msgId: string): void {
  if (games[gameId]?.secretMessages[msgId]) games[gameId].secretMessages[msgId].read = true
}
