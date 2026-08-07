// ════════════════════════════════════════════════════════════════════════
// 紫苑館の空間モデル（見取り図＝ManorMap.tsx と一致）
//
// 部屋を階（2F/1F/B1）ごとに廊下ハブ・階段踊り場でつないだグラフ。
// これを唯一の基準として「A から B まで徒歩何分か」「その経路でどの廊下を
// 通り、どの階段を使うか」「秘密通路で人目を避けられるか」を導出する。
// 目撃・物音・移動可能性の手がかりはすべてこの経路計算から作るので、
// 「5分では現場まで行けない」「走れば足音が響く」等が物理的に矛盾しない。
// ════════════════════════════════════════════════════════════════════════
import type { Location } from '../types/game'
import { LOCATION_NAMES } from './locations'

export type Floor = '2F' | '1F' | 'B1'

// 各プレイアブル地点の所在階（秘密通路・隠し部屋は階をまたぐ特殊ノード）
export const LOCATION_FLOOR: Record<Location, Floor> = {
  master_bedroom: '2F',
  guest_room: '2F',
  study: '1F',
  library: '1F',
  dining: '1F',
  gallery: '1F',
  greenhouse: '1F',
  basement: 'B1',
  safe_room: 'B1',
  secret_passage: 'B1', // 通路自体はB1〜1Fを貫く。表示上の所属としてB1扱い
  hidden_room: 'B1',
}

// グラフのノード：地点 + 廊下ハブ + 階段踊り場
type Node = Location | 'corr_2F' | 'corr_1F' | 'corr_B1' | 'stair_2F' | 'stair_1F' | 'stair_B1'

// 無向辺（分）。徒歩での所要時間。走ると RUN_FACTOR 倍に短縮されるが足音が出る。
const RUN_FACTOR = 0.6

// 階ごとの部屋（廊下ハブに接続する）
const FLOOR_ROOMS: Record<Floor, Location[]> = {
  '2F': ['master_bedroom', 'guest_room'],
  '1F': ['study', 'library', 'dining', 'gallery', 'greenhouse'],
  'B1': ['basement', 'safe_room'],
}

// 隣接リスト（分）を組み立てる
const adj: Map<Node, Array<{ to: Node; min: number }>> = new Map()
function link(a: Node, b: Node, min: number) {
  if (!adj.has(a)) adj.set(a, [])
  if (!adj.has(b)) adj.set(b, [])
  adj.get(a)!.push({ to: b, min })
  adj.get(b)!.push({ to: a, min })
}

// 部屋 ↔ 同じ階の廊下ハブ
for (const floor of ['2F', '1F', 'B1'] as Floor[]) {
  const corr = `corr_${floor}` as Node
  const stair = `stair_${floor}` as Node
  for (const room of FLOOR_ROOMS[floor]) link(room, corr, 1.2)
  link(corr, stair, 0.8) // 廊下 ↔ 階段口
}
// 大階段の縦移動（1フロア上り下り＝2.0分）
link('stair_2F', 'stair_1F', 2.0)
link('stair_1F', 'stair_B1', 2.0)

// 秘密通路：書斎(1F) と 地下室(B1) を直結し、隠し部屋へ通じる。
// 廊下を通らないので誰にも見られずに階をまたげる——通路を知る者だけの近道。
link('study', 'secret_passage', 1.0)
link('secret_passage', 'basement', 1.0)
link('secret_passage', 'hidden_room', 0.6)

// ── Dijkstra：最短徒歩経路（ノード列）と所要分を返す ──────────────────
function dijkstra(from: Node, to: Node): { path: Node[]; min: number } {
  const dist = new Map<Node, number>()
  const prev = new Map<Node, Node | null>()
  const visited = new Set<Node>()
  dist.set(from, 0)
  prev.set(from, null)
  // ノード数が小さいので単純な線形取り出しで十分
  const nodes = new Set<Node>([from])
  for (const [n] of adj) nodes.add(n)
  while (visited.size < nodes.size) {
    let u: Node | null = null
    let best = Infinity
    for (const n of nodes) {
      if (visited.has(n)) continue
      const d = dist.get(n) ?? Infinity
      if (d < best) { best = d; u = n }
    }
    if (u == null || best === Infinity) break
    if (u === to) break
    visited.add(u)
    for (const e of adj.get(u) ?? []) {
      const nd = best + e.min
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd)
        prev.set(e.to, u)
      }
    }
  }
  const min = dist.get(to) ?? Infinity
  if (min === Infinity) return { path: [], min }
  const path: Node[] = []
  let cur: Node | null = to
  while (cur != null) { path.unshift(cur); cur = prev.get(cur) ?? null }
  return { path, min }
}

const FLOOR_LABEL: Record<Floor, string> = { '2F': '2階', '1F': '1階', 'B1': '地下' }

export interface RouteInfo {
  from: Location
  to: Location
  walkMin: number          // 徒歩の所要分（四捨五入前の生値）
  walkMinRounded: number   // 表示用に丸めた分
  runMin: number           // 走った場合の所要分
  reachableWalkIn5: boolean // 5分以内に歩いて到達できるか
  mustRun: boolean          // 5分に間に合わせるには走る必要があるか（＝足音が出る）
  corridorFloors: Floor[]   // 経路上で通過する廊下（＝そこにいる者に見られうる）
  usesStairs: boolean       // 大階段を使うか（＝階段で足音・すれ違い）
  usesSecretPassage: boolean // 秘密通路を使うか（＝廊下を通らず人目を避けられる）
  floorsSpanned: Floor[]     // またぐ階
}

// A→B の徒歩最短経路の情報。目撃・物音・移動可能性の手がかりの単一の根拠。
export function routeInfo(from: Location, to: Location): RouteInfo {
  const { path, min } = dijkstra(from, to)
  const walkMin = min
  const runMin = walkMin * RUN_FACTOR
  const corridorFloors: Floor[] = []
  const floorsSet = new Set<Floor>()
  let usesStairs = false
  let usesSecretPassage = false
  for (const n of path) {
    if (n === 'corr_2F') corridorFloors.push('2F')
    else if (n === 'corr_1F') corridorFloors.push('1F')
    else if (n === 'corr_B1') corridorFloors.push('B1')
    else if (n === 'stair_2F' || n === 'stair_1F' || n === 'stair_B1') usesStairs = true
    else if (n === 'secret_passage' || n === 'hidden_room') usesSecretPassage = true
    // 階の集合（部屋ノードのみ）
    if (n in LOCATION_FLOOR) floorsSet.add(LOCATION_FLOOR[n as Location])
  }
  // 階段を挟むだけの縦移動は corridorFloors に両端の階を含めて数えない場合があるため補完
  return {
    from,
    to,
    walkMin,
    walkMinRounded: Math.max(1, Math.round(walkMin)),
    runMin,
    reachableWalkIn5: walkMin <= 5,
    mustRun: walkMin > 5 && runMin <= 5,
    corridorFloors,
    usesStairs,
    usesSecretPassage,
    floorsSpanned: [...floorsSet],
  }
}

export function floorLabel(f: Floor): string {
  return FLOOR_LABEL[f]
}

// 経路説明の短文（GM・解説用）。例「1階の廊下と大階段を通り、地下へ下りる」
export function describeRoute(from: Location, to: Location): string {
  const r = routeInfo(from, to)
  if (r.usesSecretPassage) {
    return `${LOCATION_NAMES[from]}から${LOCATION_NAMES[to]}へは秘密通路で直接通じており、廊下を通らずに移動できる`
  }
  const parts: string[] = []
  const floors = [...new Set(r.corridorFloors)]
  if (floors.length) parts.push(`${floors.map(floorLabel).join('・')}の廊下`)
  if (r.usesStairs) parts.push('大階段')
  const via = parts.length ? parts.join('と') + 'を通る' : '同じ区画内で移動できる'
  return `${LOCATION_NAMES[from]}から${LOCATION_NAMES[to]}へは${via}（徒歩およそ${r.walkMinRounded}分）`
}
