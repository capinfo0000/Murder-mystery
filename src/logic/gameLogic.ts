import type {
  CharacterSlot,
  GameState,
  ScoreBreakdown,
  VoteData,
} from '../types/game'

// Which killer slots were identified by a strict majority of the given votes?
function caughtSlots(killerSlots: CharacterSlot[], votes: Record<string, VoteData>): CharacterSlot[] {
  const totalVoters = Object.keys(votes).length
  if (totalVoters === 0) return []
  return killerSlots.filter(slot => {
    const count = Object.values(votes).filter(v => (v.killerSlots ?? []).includes(slot)).length
    return count * 2 > totalVoters
  })
}

// Returns only the votes cast by non-killer players (killers excluded from majority in non-puzzle mode)
function innocentVotes(state: GameState): Record<string, VoteData> {
  const { scenario, players, votes, mode } = state
  if (!scenario || mode === 'puzzle') return votes ?? {}
  const killerPlayerIds = new Set(
    Object.entries(players).flatMap(([pid, p]) =>
      p.characterSlot && scenario.roles[p.characterSlot] === 'killer' ? [pid] : []
    )
  )
  return Object.fromEntries(
    Object.entries(votes ?? {}).filter(([pid]) => !killerPlayerIds.has(pid))
  )
}

// True when the group's collective verdict (innocents only) matches the truth
export function determineMainKillerCaught(state: GameState): boolean {
  const { scenario } = state
  if (!scenario) return false
  const iVotes = innocentVotes(state)
  const allVotes = Object.values(iVotes)
  const totalVoters = allVotes.length

  if (scenario.outsideKiller) {
    const emptyCount = allVotes.filter(v => (v.killerSlots ?? []).length === 0).length
    return totalVoters > 0 && emptyCount * 2 > totalVoters
  }

  const allKillerSlots = scenario.killers.map(k => k.slot)
  if (allKillerSlots.length === 0) return false
  const caught = caughtSlots(allKillerSlots, iVotes)
  return caught.length === allKillerSlots.length
}

export function computeScores(state: GameState): Record<string, ScoreBreakdown> {
  const { scenario, players, cards } = state
  if (!scenario) return {}

  const scores: Record<string, ScoreBreakdown> = {}
  const isOutsideKiller = scenario.outsideKiller === true

  // Killers excluded from majority in non-puzzle mode
  const iVotes = innocentVotes(state)
  const allIVotes = Object.values(iVotes)
  const totalIVoters = allIVotes.length

  // Per-killer caught status
  const allKillerSlots = scenario.killers.map(k => k.slot)
  const caught = isOutsideKiller ? [] : caughtSlots(allKillerSlots, iVotes)
  const allCaught = !isOutsideKiller && allKillerSlots.length > 0 && caught.length === allKillerSlots.length
  const numCaught = caught.length

  // Outside killer: did majority of innocent-voters vote nobody?
  const outsideCaught = isOutsideKiller &&
    totalIVoters > 0 &&
    allIVotes.filter(v => (v.killerSlots ?? []).length === 0).length * 2 > totalIVoters

  for (const [playerId, player] of Object.entries(players)) {
    if (player.isNPC || !player.characterSlot) continue
    const slot = player.characterSlot
    const role = scenario.roles[slot] ?? 'innocent'
    const vote = state.votes?.[playerId]

    // 1. base score
    let base: number
    if (state.mode === 'puzzle') {
      base = 1  // puzzle: base is minimal; +10 bonus drives the outcome
    } else if (isOutsideKiller) {
      base = outsideCaught ? 5 : 0
    } else if (role === 'killer') {
      base = caught.includes(slot) ? 0 : 5  // caught → 0, escaped → 5
    } else {
      // innocent player
      if (allCaught) {
        base = 5           // full success
      } else if (numCaught > 0) {
        base = numCaught   // 1 pt per caught killer
      } else {
        base = 0           // all escaped
      }
    }

    // 2. tachimawari bonus (+2) — none of the player's related cards publicly revealed
    const hasSecret = !!scenario.secretActions[slot]
    const secretExposed = Object.values(cards ?? {}).some(
      c => c.relatedSlot === slot && c.sharedWith.includes('all')
    )
    const tachimawari = hasSecret && !secretExposed ? 2 : 0

    // 3. special bonuses
    let bonus = 0
    if (state.mode === 'puzzle' && vote?.puzzleAnswer && scenario.puzzleTargets) {
      const perfect = Object.entries(scenario.puzzleTargets).every(
        ([killerSlot, victimSlot]) =>
          vote.puzzleAnswer![killerSlot as CharacterSlot] === victimSlot
      )
      if (perfect) bonus += 10
    }

    scores[playerId] = { base, tachimawari, bonus, total: base + tachimawari + bonus }
  }

  return scores
}

export function determineWinners(scores: Record<string, ScoreBreakdown>): string[] {
  if (Object.keys(scores).length === 0) return []
  const max = Math.max(...Object.values(scores).map(s => s.total))
  return Object.entries(scores)
    .filter(([, s]) => s.total === max)
    .map(([id]) => id)
}
