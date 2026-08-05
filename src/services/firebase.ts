import { initializeApp } from 'firebase/app'
import {
  getDatabase,
  ref,
  set,
  push,
  update,
  onValue,
  get,
} from 'firebase/database'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { v4 as uuid } from 'uuid'
import type { EvidenceCard, GamePhase, GameState, VoteData } from '../types/game'
import { generateScenario } from '../logic/scenarioGenerator'
import { dealCards } from '../logic/cardDealer'
import { computeScores, determineWinners, determineMainKillerCaught } from '../logic/gameLogic'
import { getSlotsForCount } from '../data/characters'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
export const auth = getAuth(app)

export async function signIn(): Promise<string> {
  const result = await signInAnonymously(auth)
  return result.user.uid
}

// ── game creation ───────────────────────────────────────────────────────────

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
  const gameRef = ref(db, `games/${gameId}`)

  await set(gameRef, {
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
  })

  return gameId
}

export async function updateGameSettings(
  gameId: string,
  hostId: string,
  settings: {
    playerCount?: number
    mode?: import('../types/game').GameMode
    hasGM?: boolean
    roundDurationMinutes?: number
    secretTalkDurationMinutes?: number
    totalRounds?: number
  }
): Promise<void> {
  const snap = await get(ref(db, `games/${gameId}/hostId`))
  if (snap.val() !== hostId) return
  const updates: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(settings)) {
    if (v !== undefined) updates[`games/${gameId}/${k}`] = v
  }
  await update(ref(db), updates)
}

export async function joinGame(
  gameId: string,
  playerId: string,
  name: string,
  isNPC: boolean
): Promise<void> {
  await set(ref(db, `games/${gameId}/players/${playerId}`), {
    name,
    characterSlot: null,
    isNPC,
    isReady: false,
    hasDrawn: false,
  })
}

// ── lobby ───────────────────────────────────────────────────────────────────

export async function startGame(gameId: string, hostId: string): Promise<void> {
  const snap = await get(ref(db, `games/${gameId}`))
  const state = snap.val() as GameState
  if (!state || state.hostId !== hostId) return

  const playersMap = state.players ?? {}
  const humanPlayers = Object.entries(playersMap).filter(([, p]) => !p.isNPC)
  const humanCount = humanPlayers.length
  const totalCount = state.playerCount
  const isDebug = totalCount < 4
  const needed = Math.max(0, totalCount - humanCount)
  const npcCount = isDebug ? needed : Math.min(needed, 3)

  // fill missing slots with NPCs (debug: all slots, production: max 3)
  const existingNPCs = Object.keys(playersMap).filter(id => playersMap[id].isNPC).length
  for (let i = existingNPCs; i < npcCount; i++) {
    await joinGame(gameId, `npc_${uuid().slice(0, 6)}`, `NPC${i + 1}`, true)
  }

  // assign character slots
  const allPlayers = (await get(ref(db, `games/${gameId}/players`))).val() as GameState['players']
  const slots = getSlotsForCount(totalCount)
  const shuffledSlots = [...slots].sort(() => Math.random() - 0.5)
  const playerIds = Object.keys(allPlayers)

  const updates: Record<string, unknown> = {}
  playerIds.forEach((pid, i) => {
    if (shuffledSlots[i] !== undefined) {
      updates[`games/${gameId}/players/${pid}/characterSlot`] = shuffledSlots[i]
    }
  })

  // generate scenario
  const scenario = generateScenario(totalCount, state.mode)

  // deal cards
  const humanIds = playerIds.filter(id => !allPlayers[id].isNPC)
  const npcIds = playerIds.filter(id => allPlayers[id].isNPC)
  const cards = dealCards(
    [...humanIds, ...npcIds],
    slots,
    scenario.killers,
    scenario.victims,
    5,
    25,
    scenario.assignedProfessions ?? {},
    scenario.npcSurvivors ?? [],
    scenario.npcVictims ?? [],
    scenario.outsideKiller ?? false,
    scenario.suicide ?? false,
  )

  const cardUpdates: Record<string, EvidenceCard> = {}
  for (const [cardId, card] of Object.entries(cards)) {
    cardUpdates[cardId] = card
  }
  updates[`games/${gameId}/scenario`] = scenario
  updates[`games/${gameId}/phase`] = 'handout'
  await update(ref(db), updates)
  await set(ref(db, `games/${gameId}/cards`), cardUpdates)
}

// ── phase transitions ───────────────────────────────────────────────────────

export async function advancePhase(
  gameId: string,
  hostId: string,
  nextPhase: GamePhase
): Promise<void> {
  const snap = await get(ref(db, `games/${gameId}`))
  const state = snap.val() as GameState
  if (!state || state.hostId !== hostId) return

  const updates: Record<string, unknown> = {
    [`games/${gameId}/phase`]: nextPhase,
    [`games/${gameId}/roundStartAt`]: Date.now(),
  }

  // when entering a new discussion round, auto-reveal NPC cards
  if (['round1', 'round2', 'round3'].includes(nextPhase)) {
    const roundNumber = parseInt(nextPhase.replace('round', ''))
    await autoRevealNpcCards(gameId, state, roundNumber, updates)
  }

  await update(ref(db), updates)
}

// NPCs auto-reveal up to 3 cards per round
async function autoRevealNpcCards(
  gameId: string,
  state: GameState,
  _roundNumber: number,
  updates: Record<string, unknown>
): Promise<void> {
  const npcIds = Object.entries(state.players)
    .filter(([, p]) => p.isNPC)
    .map(([id]) => id)

  for (const npcId of npcIds) {
    const npcCards = Object.entries(state.cards || {})
      .filter(([, c]) => c.ownerId === npcId && !c.sharedWith.includes('all'))
      .map(([id]) => id)
      .slice(0, 3)

    for (const cardId of npcCards) {
      updates[`games/${gameId}/cards/${cardId}/sharedWith`] = ['all']
    }
  }
}

export async function setReady(gameId: string, playerId: string): Promise<void> {
  await set(ref(db, `games/${gameId}/players/${playerId}/isReady`), true)
}

// ── card actions ────────────────────────────────────────────────────────────

export async function shareCardWithAll(
  gameId: string,
  cardId: string
): Promise<void> {
  await set(ref(db, `games/${gameId}/cards/${cardId}/sharedWith`), ['all'])
}

export async function sendCardToPlayer(
  gameId: string,
  fromPlayerId: string,
  toPlayerId: string,
  cardIds: string[],
  note: string
): Promise<void> {
  const msgRef = push(ref(db, `games/${gameId}/secretMessages`))
  await set(msgRef, {
    fromPlayerId,
    toPlayerId,
    cardIds,
    note,
    timestamp: Date.now(),
    read: false,
  })
  // also share cards with the recipient
  const updates: Record<string, unknown> = {}
  for (const cardId of cardIds) {
    updates[`games/${gameId}/cards/${cardId}/sharedWith/${toPlayerId}`] = true
  }
  // sharedWith is an array; append recipient
  for (const cardId of cardIds) {
    const snap = await get(ref(db, `games/${gameId}/cards/${cardId}/sharedWith`))
    const existing: string[] = snap.val() || []
    if (!existing.includes(toPlayerId)) {
      await set(
        ref(db, `games/${gameId}/cards/${cardId}/sharedWith`),
        [...existing, toPlayerId]
      )
    }
  }
}

export async function drawFromDeck(
  gameId: string,
  playerId: string
): Promise<string | null> {
  const snap = await get(ref(db, `games/${gameId}/cards`))
  const cards = snap.val() as Record<string, EvidenceCard> | null
  if (!cards) return null

  const deckCards = Object.entries(cards).filter(([, c]) => c.ownerId === 'deck')
  if (deckCards.length === 0) return null

  const [cardId] = deckCards[Math.floor(Math.random() * deckCards.length)]
  await set(ref(db, `games/${gameId}/cards/${cardId}/ownerId`), playerId)
  await set(ref(db, `games/${gameId}/players/${playerId}/hasDrawn`), true)
  return cardId
}

// ── voting ───────────────────────────────────────────────────────────────────

export async function submitVote(
  gameId: string,
  playerId: string,
  vote: VoteData
): Promise<void> {
  await set(ref(db, `games/${gameId}/votes/${playerId}`), {
    ...vote,
    submittedAt: Date.now(),
  })
}

export async function finalizeResult(gameId: string, hostId: string): Promise<void> {
  const snap = await get(ref(db, `games/${gameId}`))
  const state = snap.val() as GameState
  if (!state || state.hostId !== hostId) return

  const scores = computeScores(state)
  const winnerIds = determineWinners(scores)
  const mainKillerCaught = determineMainKillerCaught(state)
  const outsideKillerCase = state.scenario?.outsideKiller === true
  const suicideCase = state.scenario?.suicide === true

  await update(ref(db), {
    [`games/${gameId}/result`]: {
      mainKillerCaught,
      outsideKillerCase,
      suicideCase,
      scores,
      winnerIds,
      trueScenario: state.scenario,
    },
    [`games/${gameId}/phase`]: 'result',
  })
}

// ── realtime listener ────────────────────────────────────────────────────────

export function subscribeGame(
  gameId: string,
  callback: (state: GameState | null) => void
): () => void {
  const gameRef = ref(db, `games/${gameId}`)
  return onValue(gameRef, snap => {
    callback(snap.val() as GameState | null)
  })
}

export async function renamePlayer(gameId: string, playerId: string, name: string): Promise<void> {
  await set(ref(db, `games/${gameId}/players/${playerId}/name`), name)
}

export function markMessageRead(gameId: string, msgId: string): void {
  set(ref(db, `games/${gameId}/secretMessages/${msgId}/read`), true)
}
