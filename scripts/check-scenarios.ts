// シナリオ整合ハーネス：多数のシナリオを生成し、不変条件（キャスト外の人物・
// 時刻残骸・未マップ場所・経路矛盾・決定的手がかりの配布など）を検査する。
//
//   npm run check            … 既定 8000 件
//   npm run check -- 20000   … 件数を指定
//
// 問題が1件でもあれば終了コード1で落ちる（CI・回帰検出用）。
import { generateScenario } from '../src/logic/scenarioGenerator'
import { dealCards } from '../src/logic/cardDealer'
import { getSlotsForCount } from '../src/data/characters'
import { validateScenario } from '../src/logic/validateScenario'
import type { GameMode } from '../src/types/game'

const N = Number(process.argv[2]) || 8000
const MODES: GameMode[] = ['normal', 'hard', 'puzzle']

// 決定的なシャッフルのため簡易LCG（Math.randomを差し替え）。
let seed = 0x9e3779b9
const origRandom = Math.random
Math.random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 0x100000000
}

const counts: Record<string, number> = {}
let failed = 0
let firstFailures = 0

for (let i = 0; i < N; i++) {
  const pc = 3 + (i % 5) // 3..7 を均等に
  const mode = MODES[i % MODES.length]
  const s = generateScenario(pc, mode)
  const slots = getSlotsForCount(pc)
  const playerIds = slots.map((_, j) => `p${j}`)
  const cards = dealCards(
    playerIds, slots, s.killers ?? [], s.victims ?? [], 5, 25,
    s.assignedProfessions ?? {}, s.npcSurvivors ?? [], s.npcVictims ?? [],
    !!s.outsideKiller, !!s.suicide, s.mainTrick,
  )
  const issues = validateScenario(s, { cards: Object.values(cards) })
  if (issues.length) {
    failed++
    for (const issue of issues) counts[issue.replace(/[:：].*$/, '')] = (counts[issue.replace(/[:：].*$/, '')] ?? 0) + 1
    if (firstFailures < 10) {
      firstFailures++
      console.error(`❌ [pc${pc} ${mode}] ${issues.join(' / ')}`)
    }
  }
}

Math.random = origRandom

console.log(`\n検査したシナリオ: ${N}`)
if (failed === 0) {
  console.log('✅ 不変条件の違反なし')
  process.exit(0)
} else {
  console.log(`\n違反のあったシナリオ: ${failed} 件`)
  console.log('種類別:')
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${v.toString().padStart(6)}  ${k}`)
  process.exit(1)
}
