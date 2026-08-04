import type {
  CharacterSlot,
  GameState,
  ScoreBreakdown,
  VoteData,
} from '../types/game'

function mostVotedKillerSlot(votes: Record<string, VoteData>): CharacterSlot | null {
  const counts: Record<string, number> = {}
  for (const [, vote] of Object.entries(votes)) {
    for (const slot of vote.killerSlots ?? []) {
      counts[slot] = (counts[slot] || 0) + 1
    }
  }
  if (Object.keys(counts).length === 0) return null
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as CharacterSlot
}

export function computeScores(state: GameState): Record<string, ScoreBreakdown> {
  const { scenario, votes, players, cards } = state
  if (!scenario) return {}

  const scores: Record<string, ScoreBreakdown> = {}
  const isOutsideKiller = scenario.outsideKiller === true
  const mainKillerSlot = scenario.killers[0]?.slot ?? null

  const mv = mostVotedKillerSlot(votes)
  // Group verdict: outside killer correct if majority voted nobody; normal correct if majority named the actual killer
  const mainKillerCaught = isOutsideKiller ? mv === null : mv === mainKillerSlot

  for (const [playerId, player] of Object.entries(players)) {
    if (player.isNPC || !player.characterSlot) continue
    const slot = player.characterSlot
    const role = scenario.roles[slot] ?? 'innocent'
    const vote = votes[playerId]

    // 1. base score — group verdict determines outcome; wrong majority → 0 for everyone
    let base: number
    if (mainKillerCaught) {
      base = role === 'innocent' ? 5 : 1
    } else {
      base = 0
    }

    // 2. tachimawari bonus (+2) — has secret action and no related card was publicly revealed
    const hasSecret = !!scenario.secretActions[slot]
    const secretExposed = Object.values(cards ?? {}).some(
      c => c.relatedSlot === slot && c.sharedWith.includes('all')
    )
    const tachimawari = hasSecret && !secretExposed ? 2 : 0

    // 3. special bonuses
    let bonus = 0

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
