// ════════════════════════════════════════════════════════════════════════
// 登場人物ハーネス：生成テキストに「キャストにいない人物」が現れないか検査する。
//
// 規約（HandoutPage）：ヒントカードは使用人・関係者を"役職名"で呼ぶ。個人名を
// 持つのはプレイヤーキャラと当主だけ。したがって目撃者・証言者として現れてよい
// のは「既知の役職名」または「既知の人名」に限られる。routeClue などの生成文が
// うっかり新しい人物（例：下男の三次）を作っていないかを、目撃・証言の節を
// 抜き出して照合することで検出する。
// ════════════════════════════════════════════════════════════════════════
import type { Scenario, EvidenceCard } from '../types/game'
import { CHARACTERS, MAIN_VICTIM } from '../data/characters'
import { EXTRA_NPCS } from '../data/extraNpcs'
import { LOCATION_NAMES } from '../data/locations'
import { PIN_COORDS, MAIN_LOC_COORDS, routeInfo } from '../data/manor'

// テンプレートで使われる一般名詞（役割・集合・関係を表す語）。個人名ではない。
const GENERIC_PERSONS = [
  '使用人', '使用人頭', '使用人の一人', '居合わせた使用人', '別の使用人', '館の使用人',
  '女中', '女中頭', '下男', '下働き', '小間使い', 'メイド', '庭師', '料理人', '専属料理人',
  '執事', '家政婦', '運転手', '秘書', '書生', '門番', '番頭', '助手',
  '関係者', '一同', '主人', '当主', '家人', '家族', '親族', '客', '来客', '賓客',
  '第一発見者', '発見者', '早くに目を覚ました使用人',
  '者', '複数の者', '多くの者', '者たち', 'ある者', '何者か', '誰か', '何者', '人物', '人影',
  '皆', '全員', '面々', '一部の者', '幾人か', '数名', '目撃者', '証人',
]

// 目撃・証言を導く述語。この直前の主語（名前・役職）を検査対象として取り出す。
// 「が」で主語をとる述語のみ。「を見た」等は目的語（見られた側）なので主語検査には使わない。
const WITNESS_MARKERS = [
  'が見た', 'が見ている', 'が見かけた', 'が見つけ',
  'が聞いた', 'が聞いている', 'が耳にした', 'の耳に残っている', 'の耳に届いた',
  'が話している', 'が証言している', 'が目撃した', 'が目撃している',
]

// 主語として成立する文字（漢字・カナ・英数・括弧・空白）の末尾ラン。
// 助詞（ひらがな）や句読点はここに含めないので、それらが自然な区切りになる。
const NAME_RUN = /[一-龥々ァ-ヶーＡ-Ｚａ-ｚA-Za-z０-９0-9（）()　 ]+$/

function sanitize(s: string): string {
  return s.replace(/（.*?）/g, '').replace(/\(.*?\)/g, '')
}

export interface Roster {
  names: Set<string>  // 個人名（プレイヤー・当主）とその分割片
  roles: Set<string>  // 役職名・一般名詞
}

// シナリオから「現れてよい人物」の集合を組み立てる。
export function rosterOf(scenario: Scenario): Roster {
  const names = new Set<string>()
  const addName = (n?: string) => {
    if (!n) return
    const t = n.trim()
    names.add(t)
    names.add(t.replace(/\s+/g, ''))
    for (const p of t.split(/\s+/)) if (p) names.add(p)
  }
  for (const slot of Object.keys(CHARACTERS) as (keyof typeof CHARACTERS)[]) addName(CHARACTERS[slot].name)
  addName(MAIN_VICTIM.name)
  names.add('源太郎')

  const roles = new Set<string>()
  const addRole = (r?: string) => {
    if (!r) return
    roles.add(r)
    roles.add(sanitize(r))
  }
  // EXTRA_NPCS は館の使用人・関係者プール全体（＝正規のキャスト）
  EXTRA_NPCS.forEach(n => addRole(n.role))
  scenario.npcVictims?.forEach(v => addRole(v.role))
  scenario.npcSurvivors?.forEach(s => addRole(s.role))
  if (scenario.discoveredBy) addRole(scenario.discoveredBy)
  GENERIC_PERSONS.forEach(g => roles.add(g))

  return { names, roles }
}

function isKnown(subject: string, roster: Roster): boolean {
  if (!subject) return true
  const s = subject.trim()
  const bare = s.replace(/\s+/g, '')
  if (roster.names.has(s) || roster.names.has(bare)) return true
  if (roster.roles.has(s) || roster.roles.has(bare) || roster.roles.has(sanitize(s))) return true
  // 「〇〇の使用人」のように末尾が既知の役職で終わるものは可
  for (const role of roster.roles) if (role.length >= 2 && bare.endsWith(role)) return true
  return false
}

// テキスト群を走査し、目撃・証言の主語がキャスト外の人物なら列挙して返す。
export function findUnknownPersons(texts: (string | undefined)[], scenario: Scenario): string[] {
  const roster = rosterOf(scenario)
  const unknown = new Set<string>()
  for (const raw of texts) {
    if (!raw) continue
    for (const marker of WITNESS_MARKERS) {
      let from = 0
      for (;;) {
        const idx = raw.indexOf(marker, from)
        if (idx < 0) break
        from = idx + marker.length
        const pre = raw.slice(0, idx)
        const m = pre.match(NAME_RUN)
        const subject = (m?.[0] ?? '').trim().replace(/\s+/g, '')
        if (!subject) continue
        // 「〜らしい人影」等、既知の人名＋修飾で終わる主語は既知扱い（人影/人物はGENERIC）
        if (!isKnown(subject, roster)) unknown.add(subject)
      }
    }
  }
  return [...unknown]
}

// シナリオ本体（カード配布前）の生成テキストを集めて検査する簡易版。
export function scenarioNarrativeTexts(scenario: Scenario): string[] {
  const texts: string[] = []
  if (scenario.synopsis) texts.push(scenario.synopsis)
  const t = scenario.mainTrick
  if (t) {
    for (const f of [t.eyewitness, t.sound, t.trace, t.appearance, t.flaw, t.misdirection,
      t.killerNote, t.framedSighting, t.framedAlibi, t.movedApparent, t.movedReveal, t.movedTrace, t.routeClue]) {
      if (f) texts.push(f)
    }
  }
  if (scenario.timelines) {
    for (const entries of Object.values(scenario.timelines)) {
      for (const e of entries) texts.push(e.action)
    }
  }
  return texts
}

// ── 追加の不変条件チェック ───────────────────────────────────────────────

// 孤立した館に検死官・鑑識・研究所は存在しない。専門機関前提の表現は禁止。
const FORENSIC_RE = /検死官|検死担当|検死所見|検視|監察医|法医|鑑識|指紋|筆跡鑑定|DNA|成分が検出|毒物検査|血液型|解剖(?!学)/
// 曖昧な時刻表現（分単位化・自然文化の後に残ってはいけない残骸）
const VAGUE_TIME_RE = /T[123]\b|夜更け|宵のうち|事件のあった時間帯|しかるべき時刻/

// 生成テキスト全体に、専門機関前提の表現や時刻の残骸が混じっていないか。
function checkTextResidue(texts: (string | undefined)[]): string[] {
  const out: string[] = []
  for (const t of texts) {
    if (!t) continue
    const f = t.match(FORENSIC_RE)
    if (f) out.push(`専門機関前提の表現「${f[0]}」: ${t.slice(0, 40)}…`)
    const v = t.match(VAGUE_TIME_RE)
    if (v) out.push(`曖昧な時刻/トークン残骸「${v[0]}」: ${t.slice(0, 40)}…`)
  }
  return out
}

// すべてのNPC死亡場所と当主の発見場所が、見取り図に座標を持つか
// （持たないとマップにピンが出ず、場所が"存在しない"ことになる）。
function checkLocationsMapped(scenario: Scenario): string[] {
  const out: string[] = []
  for (const v of scenario.npcVictims ?? []) {
    if (v.deathLocation && !(v.deathLocation in PIN_COORDS)) {
      out.push(`NPC死亡場所「${v.deathLocation}」に見取り図の座標がない（ピンが出ない）`)
    }
  }
  const mv = scenario.mainVictimLocation
  if (mv && !(mv in MAIN_LOC_COORDS)) {
    out.push(`当主の発見場所「${LOCATION_NAMES[mv] ?? mv}」に見取り図の座標がない`)
  }
  return out
}

// 移動経路の手がかり(routeClue)が、館の空間モデルと物理的に一致しているか。
// 「廊下を通らず」と言いつつ実際は廊下/階段を通る、等の矛盾を検出する。
function checkRouteClue(scenario: Scenario): string[] {
  const out: string[] = []
  const t = scenario.mainTrick
  if (!t?.routeClue) return out
  const mk = (scenario.killers ?? []).find(k => t.killerSlots.includes(k.slot))
  const home = mk ? scenario.alibis[mk.slot]?.T1 : undefined
  if (!mk || !home) return out
  const ri = routeInfo(home, mk.location)
  const avoided = ri.corridorFloors.length === 0 && !ri.usesStairs
  const claimsUnseen = t.routeClue.includes('廊下を通らず') || t.routeClue.includes('廊下に出ずに')
  const claimsStairs = t.routeClue.includes('大階段')
  if (claimsUnseen && !avoided) out.push('routeClueが「廊下を通らず」と述べるが、経路は実際に廊下/階段を通る')
  if (!claimsUnseen && avoided) out.push('routeClueが経路の廊下回避（秘密通路）を反映していない')
  if (claimsStairs && !ri.usesStairs) out.push('routeClueが「大階段」を述べるが、経路は階段を使わない')
  return out
}

// 犯行時刻が設定され、目撃・時系列で共通に使われているか。
function checkCrimeTime(scenario: Scenario): string[] {
  const out: string[] = []
  const ct = scenario.crimeTime
  const t = scenario.mainTrick
  // 遠隔装置は犯行時刻に犯人不在のため目撃文の時刻規約が異なる。それ以外で確認。
  if (ct && t && !t.remote && t.eyewitness && !t.eyewitness.includes(ct)) {
    out.push(`目撃証言が犯行時刻(${ct})を参照していない`)
  }
  return out
}

// シナリオ全体の不変条件をまとめて検査する統合ハーネス。
// cards を渡すと配布カードの内容も対象に含める。
export function validateScenario(scenario: Scenario, opts?: { cards?: EvidenceCard[] }): string[] {
  const problems: string[] = []
  const narrative = scenarioNarrativeTexts(scenario)
  const cardTexts = (opts?.cards ?? []).map(c => c.content)
  const allTexts = [...narrative, ...cardTexts]

  for (const p of findUnknownPersons(allTexts, scenario)) problems.push(`未知の人物参照: ${p}`)
  for (const p of checkTextResidue(allTexts)) problems.push(p)
  for (const p of checkLocationsMapped(scenario)) problems.push(p)
  for (const p of checkRouteClue(scenario)) problems.push(p)
  for (const p of checkCrimeTime(scenario)) problems.push(p)

  // 決定的手がかり（目撃証言）が配布カードに含まれているか（cards指定時のみ）
  if (opts?.cards && scenario.mainTrick?.eyewitness) {
    const present = cardTexts.some(c => c.includes(scenario.mainTrick!.eyewitness))
    if (!present) problems.push('決定的手がかり（目撃証言）が配布カードに含まれていない')
  }
  return problems
}
