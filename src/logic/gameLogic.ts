import type {
  CharacterSlot,
  GameState,
  Player,
  ScoreBreakdown,
  VoteData,
} from '../types/game'

function mostVotedSlot(
  votes: Record<string, VoteData>,
  _players: Record<string, Player>
): CharacterSlot | null {
  const counts: Record<string, number> = {}
  for (const [, vote] of Object.entries(votes)) {
    if (!vote.targetSlot) continue
    counts[vote.targetSlot] = (counts[vote.targetSlot] || 0) + 1
  }
  if (Object.keys(counts).length === 0) return null
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as CharacterSlot
}

function getVotesAgainst(
  playerId: string,
  characterSlot: CharacterSlot,
  votes: Record<string, VoteData>
): number {
  return Object.entries(votes).filter(
    ([voterId, v]) => voterId !== playerId && v.targetSlot === characterSlot
  ).length
}

export function computeScores(state: GameState): Record<string, ScoreBreakdown> {
  const { scenario, votes, players } = state
  if (!scenario) return {}

  const scores: Record<string, ScoreBreakdown> = {}
  const mainKillerSlot = scenario.killers[0]?.slot ?? null

  // was the main killer caught?
  const mv = mostVotedSlot(votes, players)
  const mainKillerCaught = mv === mainKillerSlot

  for (const [playerId, player] of Object.entries(players)) {
    if (player.isNPC || !player.characterSlot) continue
    const slot = player.characterSlot
    const role = scenario.roles[slot] ?? 'innocent'
    const vote = votes[playerId]

    // 1. base score
    let base = 0
    if (mainKillerCaught) {
      base = role === 'innocent' ? 5 : 1
    } else {
      base = role === 'innocent' ? 1 : 5
    }

    // 2. tachimawari bonus (+2) — has secret action and received 0 votes
    const hasSecret = !!scenario.secretActions[slot]
    const votesAgainst = getVotesAgainst(playerId, slot, votes)
    const tachimawari = hasSecret && votesAgainst === 0 ? 2 : 0

    // 3. special bonuses
    let bonus = 0

    // "accuse all" bonus: a completely innocent player (innocent, no secret motive used)
    // who accuses everyone else of being bad actors — if correct
    if (vote?.accuseAll && role === 'innocent') {
      const allOthersGuilty = Object.entries(players).every(([pid, p]) => {
        if (pid === playerId || p.isNPC) return true
        const s = p.characterSlot
        if (!s) return true
        return (scenario.roles[s] === 'killer') || !!scenario.secretActions[s]
      })
      if (allOthersGuilty) bonus += 7
    }

    // puzzle mode perfect match (+10)
    if (state.mode === 'puzzle' && vote?.puzzleAnswer && scenario.puzzleTargets) {
      const perfect = Object.entries(scenario.puzzleTargets).every(
        ([killerSlot, victimSlot]) =>
          vote.puzzleAnswer![killerSlot as CharacterSlot] === victimSlot
      )
      if (perfect) bonus += 10
    }

    scores[playerId] = {
      base,
      tachimawari,
      bonus,
      total: base + tachimawari + bonus,
    }
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
