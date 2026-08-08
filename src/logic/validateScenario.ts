// ════════════════════════════════════════════════════════════════════════
// 登場人物ハーネス：生成テキストに「キャストにいない人物」が現れないか検査する。
//
// 規約（HandoutPage）：ヒントカードは使用人・関係者を"役職名"で呼ぶ。個人名を
// 持つのはプレイヤーキャラと当主だけ。したがって目撃者・証言者として現れてよい
// のは「既知の役職名」または「既知の人名」に限られる。routeClue などの生成文が
// うっかり新しい人物（例：下男の三次）を作っていないかを、目撃・証言の節を
// 抜き出して照合することで検出する。
// ════════════════════════════════════════════════════════════════════════
import type { Scenario, EvidenceCard, CharacterSlot } from '../types/game'
import { CHARACTERS, MAIN_VICTIM } from '../data/characters'
import { EXTRA_NPCS } from '../data/extraNpcs'
import { LOCATION_NAMES } from '../data/locations'
import { PIN_COORDS, MAIN_LOC_COORDS, routeInfo } from '../data/manor'
import { isBloodPlausible } from '../data/weapons'
import { CANONICAL_SLOT_PROFESSION } from '../data/pastProfessions'
import { deriveFacts } from './scenarioFacts'

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
  // 協力犯の密約・指令文（プレイヤーに直接表示される）も検査対象に含める
  for (const link of scenario.cooperationChain?.links ?? []) {
    if (link.fromText) texts.push(link.fromText)
    if (link.toText) texts.push(link.toText)
  }
  // 各キャラの一人称物語もプレイヤー向け。走査対象に含める。
  for (const story of Object.values(scenario.stories ?? {})) {
    if (story) texts.push(story)
  }
  // 二重犯行の真相文
  if (scenario.dualKillerInfo?.detail) texts.push(scenario.dualKillerInfo.detail)
  return texts
}

// プレイヤー向けテキストに、名前へ解決されなかった生のスロット記号(A〜G)が
// 紛れていないか。孤立した1文字のA〜Gはテンプレートのトークン漏れの兆候。
function checkRawSlotTokens(texts: (string | undefined)[]): string[] {
  const out: string[] = []
  // resolveNames と同じ判定：ASCII英数字に挟まれていない孤立した A〜G は
  // 名前へ解決されるはずのトークン。最終テキストに残っていれば漏れ。
  const RAW = /(^|[^A-Za-z0-9])([A-G])(?![A-Za-z0-9])/
  for (const t of texts) {
    if (!t) continue
    const m = t.match(RAW)
    if (m) out.push(`生のスロット記号「${m[2]}」がテキストに露出: ${t.slice(0, 44)}…`)
  }
  return out
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

// 犯行時刻(21時台)に、犯人以外のプレイヤーが犯行現場と同じ部屋にいないか。
// いると「無実の者が犯行を目撃していたはず」という論理矛盾になる（複数カード＝
// アリバイ表＋犯行現場を突き合わせて初めて分かる矛盾）。
function checkNoCoLocatedWitness(scenario: Scenario): string[] {
  const out: string[] = []
  const killers = scenario.killers ?? []
  const mainKillers = killers.filter(k => k.victimName === MAIN_VICTIM.name)
  // 犯行現場（21時台に源太郎が殺された部屋）
  const scene = mainKillers[0]?.location ?? scenario.mainVictimLocation
  if (!scene) return out
  const bodyLoc = scenario.mainVictimLocation // 遺体が最終的に発見される部屋
  const perps = new Set(killers.map(k => k.slot))
  for (const [slot, a] of Object.entries(scenario.alibis ?? {}) as [string, { T2: string; T3: string } | undefined][]) {
    if (!a || perps.has(slot as never)) continue
    if (a.T2 === scene) {
      out.push(`無実の${slot}が犯行時刻に現場(${LOCATION_NAMES[scene]})と同室——目撃者矛盾`)
    }
    // 22時台(T3)に遺体のある部屋にいる無実の者 → 深夜の発見前に遺体を見つけるはず
    if (bodyLoc && a.T3 === bodyLoc) {
      out.push(`無実の${slot}が22時台に遺体のある部屋(${LOCATION_NAMES[bodyLoc]})にいる——発見時期の矛盾`)
    }
  }
  return out
}

// 「計画外の衝動的犯行」に、事前準備の要る手口（毒殺・放火や階段の仕掛け）が
// 使われていないか。とっさに毒を盛ったり放火装置を組むことはできない。
function checkImprovisedMethod(scenario: Scenario): string[] {
  const t = scenario.mainTrick
  if (!t || t.premeditated) return []
  const mk = (scenario.killers ?? []).find(k => k.victimName === MAIN_VICTIM.name && !k.isDualKiller)
  if (!mk) return []
  if (mk.weapon.isPoison || mk.weapon.isEnvironmental) {
    return [`計画外の犯行なのに事前準備の要る手口(${mk.weapon.name})が使われている`]
  }
  return []
}

// 犯人の到達経路（廊下／秘密通路／遠隔）と、配布される目撃証言が矛盾しないか。
//  passage: 秘密通路で廊下を通らなかったのに「廊下で犯人を目撃」する証言が混じっていないか
//  remote : 犯行時刻に現場不在なのに、その時刻に現場付近で犯人を見た証言が混じっていないか
function checkApproachConsistency(scenario: Scenario, texts: (string | undefined)[]): string[] {
  const out: string[] = []
  const t = scenario.mainTrick
  if (!t) return out
  const mk = (scenario.killers ?? []).find(k => t.killerSlots.includes(k.slot))
  if (!mk) return out
  const killerName = CHARACTERS[mk.slot]?.name
  const sceneName = LOCATION_NAMES[mk.location]
  if (!killerName) return out
  // あらすじは容疑をほのめかす地の文であり、犯行時刻の目撃主張ではない。対象外。
  const synopsis = scenario.synopsis
  // 20時台（事件前）の目撃は経路と無関係なので対象外。犯行時刻付近の主張だけを見る。
  const isPreCrime = (txt: string) => /20時/.test(txt)
  // 犯人が現場（sceneName）へ向かう／現場付近にいたとする"接近目撃"に限定する。
  const approachSighting = /(現場|そば|付近|方向|の方へ).{0,10}(急ぎ足|向かう|目撃)|(急ぎ足|向かう).{0,6}(現場|付近|方)|付近で立ち止まって/

  for (const txt of texts) {
    if (!txt || txt === synopsis || !txt.includes(killerName) || !txt.includes(sceneName)) continue
    if (isPreCrime(txt)) continue
    if (t.killerApproach === 'passage') {
      // 通路経路：廊下で犯人が現場へ向かうのを見た、という肯定的目撃は矛盾。
      if (/廊下/.test(txt) && approachSighting.test(txt) && !/見当たらなかった|どこにもなかった|姿がない/.test(txt)) {
        out.push(`秘密通路経路なのに廊下での接近目撃が混在: ${txt.slice(0, 44)}…`)
      }
    }
    if (t.remote) {
      // 遠隔犯：犯行時刻に現場付近で動いていたとする目撃は矛盾（不在が鉄則）。
      if (approachSighting.test(txt)) {
        out.push(`遠隔犯なのに犯行時刻の現場付近目撃が混在: ${txt.slice(0, 44)}…`)
      }
    }
  }
  return out
}

// 凶器の性質と物的手がかりが整合するか（真の手がかりのみ対象）。
//  ・出血のない死因（毒殺・絞殺・焼死）なのに血痕・返り血の手がかりがある
//  ・遠隔犯（現場不在）なのに、犯人が遺体のそばで残した痕跡がある
const BLOOD_RE = /血痕|返り血|血の付いた|血が付いた|血を洗|血の跡/
// ワイン等への毒物混入を"死因として"断定する手がかり（被害者の恐怖・警戒の描写は除く）
const POISON_ASSERT_RE = /舌を刺すような|苦味のありそうな沈殿|毒のような後味|いつもの銘柄にはない妙な後味/
function checkPhysicalPlausibility(scenario: Scenario, trueTexts: (string | undefined)[]): string[] {
  const out: string[] = []
  const mk = (scenario.killers ?? []).find(k => k.victimName === MAIN_VICTIM.name && !k.isDualKiller)
  if (!mk) return out
  const bloodOK = isBloodPlausible(mk.weapon.id)
  const poisonMurder = !!mk.weapon.isPoison
  const remote = !!scenario.mainTrick?.remote
  for (const txt of trueTexts) {
    if (!txt) continue
    if (!bloodOK && BLOOD_RE.test(txt)) {
      out.push(`出血のない死因(${mk.weapon.disguisedAs})なのに血の手がかり: ${txt.slice(0, 40)}…`)
    }
    if (!poisonMurder && POISON_ASSERT_RE.test(txt)) {
      out.push(`毒殺でない死因(${mk.weapon.disguisedAs})なのに毒物混入を断定する手がかり: ${txt.slice(0, 40)}…`)
    }
    if (remote && /返り血|遺体のそばに.{0,20}(残されて|持ち込|符合)|遺体のある部屋から.{0,10}物陰/.test(txt)) {
      out.push(`遠隔犯（現場不在）なのに犯人が残した現場痕跡: ${txt.slice(0, 40)}…`)
    }
  }
  return out
}

// 当主殺しの犯人を、犯行時刻(21時台)に現場以外の部屋へ置く"真の手がかり"がないか。
// （犯人の秘密行動は20時台なので、21時台に別室にいる真クルーは現場での犯行と矛盾）
function checkKillerAtSceneAtCrimeTime(scenario: Scenario, trueCards: EvidenceCard[]): string[] {
  const out: string[] = []
  const t = scenario.mainTrick
  if (!t || t.remote) return out // 遠隔犯は別ロジック（不在が正）
  const mainKillers = (scenario.killers ?? []).filter(k => k.victimName === MAIN_VICTIM.name)
  for (const mk of mainKillers) {
    const sceneName = LOCATION_NAMES[mk.location]
    for (const c of trueCards) {
      if (c.relatedSlot !== mk.slot) continue
      // 21時台(犯行時刻)を指し、かつ現場以外の部屋名を含む真クルーは矛盾
      if (!/21時|事件のあった時間/.test(c.content) || /20時/.test(c.content)) continue
      const otherRoom = (Object.values(LOCATION_NAMES) as string[])
        .find(name => name !== sceneName && c.content.includes(name))
      if (otherRoom) {
        out.push(`犯人を犯行時刻に現場外(${otherRoom})へ置く真クルー: ${c.content.slice(0, 40)}…`)
      }
    }
  }
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

// 過去職業が各スロットの"正体"に対応しているか（ヒントカードの素性と一致するか）。
// ずれると同一人物に別々の隠れた過去が割り当てられ矛盾する。
function checkProfessionConsistency(scenario: Scenario): string[] {
  const out: string[] = []
  const assigned = scenario.assignedProfessions ?? {}
  for (const slot of Object.keys(assigned) as (keyof typeof assigned)[]) {
    const got = assigned[slot]
    const want = CANONICAL_SLOT_PROFESSION[slot]
    if (got && got !== want) {
      out.push(`${slot} の過去職業(${got})が正体(${want})と不一致——素性ヒントと矛盾`)
    }
  }
  return out
}

// ① 可解性と一意性：真の手がかりだけで各犯人が特定でき、無実の者が殺人の証拠で
//    名指されないこと。犯人を指し示す"決め手"の目印（現場へ向かう目撃・通路の気配・
//    遠隔の仕込み・凶行・死斑・綻び・癖の解読 等）で名前が挙がるかを見る。
const CULPRIT_CLUE = /急ぎ足で.{0,6}向かう|向かうのを.{0,8}目撃|付近で立ち止まって|見当たらなかった|隠し通路のあたり|壁の奥で衣擦れ|仕掛けるように屈み込|別室で他の者と一緒|手にかけ|殺害|止めを刺|致命傷|返り血|死斑|トリックの綻び|独特の癖|癖を指摘|習慣なのかもしれない/
const MURDER_ACT = /手にかけ|殺害|返り血|死斑/
function checkSolvability(scenario: Scenario, trueCards: EvidenceCard[]): string[] {
  const out: string[] = []
  if (scenario.outsideKiller || scenario.suicide || scenario.puzzleTargets) return out
  const killers = scenario.killers ?? []
  // 各犯人に、名前を挙げる"決め手"の真クルーがあるか（＝特定可能／可解）
  for (const k of killers) {
    const name = CHARACTERS[k.slot]?.name
    if (!name) continue
    const identified = trueCards.some(c =>
      (c.content.includes(name) || c.relatedSlot === k.slot) && CULPRIT_CLUE.test(c.content))
    if (!identified) out.push(`犯人 ${name} を特定できる決定的な真クルーが無い（可解性の欠落）`)
  }
  // 無実の者が殺人そのものの証拠で名指されていないか（一意性）
  for (const [slot, role] of Object.entries(scenario.roles ?? {}) as [string, string][]) {
    if (role !== 'innocent') continue
    const name = CHARACTERS[slot as never]?.name
    if (!name) continue
    const framed = trueCards.find(c => c.content.includes(name) && MURDER_ACT.test(c.content))
    if (framed) out.push(`無実の ${name} が殺人の証拠で名指されている（一意性の破れ）: ${framed.content.slice(0, 36)}…`)
  }
  return out
}

// ④ 因果整合：協力連鎖・口封じ・NPC死亡時刻の筋が通っているか。
function checkCausalIntegrity(scenario: Scenario): string[] {
  const out: string[] = []
  const killerSlots = new Set((scenario.killers ?? []).map(k => k.slot))
  // 協力連鎖の参加者は全員"犯人"であること
  const cc = scenario.cooperationChain
  if (cc) {
    if (!killerSlots.has(cc.mastermindSlot)) out.push(`協力連鎖の首謀者 ${cc.mastermindSlot} が犯人でない`)
    for (const l of cc.links) {
      for (const s of [l.fromSlot, l.toSlot, l.relayToSlot]) {
        if (s && !killerSlots.has(s)) out.push(`協力連鎖の参加者 ${s} が犯人でない`)
      }
    }
  }
  // 口封じされたNPCには、そのNPCを手にかけた犯人が実在すること／殺害は犯行(21時)より後
  for (const v of scenario.npcVictims ?? []) {
    if (!v.isRelatedToCase) continue
    if (v.killerSlot !== undefined) {
      const hit = (scenario.killers ?? []).some(k => k.slot === v.killerSlot && k.victimName === v.role)
      if (!hit) out.push(`口封じ被害者「${v.role}」に対応する犯人がいない（killerSlot=${v.killerSlot}）`)
    }
    if (/20時|21時/.test(v.deathTime ?? '')) {
      out.push(`口封じ被害者「${v.role}」の死亡時刻が犯行時刻帯(${v.deathTime})——口封じは犯行後のはず`)
    }
  }
  return out
}

// ⑤(バランス) 退化防止：無実が最低1人いること（全員犯人だと事件が成立しない）。
function checkBalance(scenario: Scenario): string[] {
  if (scenario.outsideKiller || scenario.suicide || scenario.puzzleTargets) return []
  const roles = Object.values(scenario.roles ?? {})
  if (roles.length > 0 && !roles.includes('innocent')) {
    return ['無実のプレイヤーが一人もいない（全員犯人＝事件として退化）']
  }
  return []
}

// ⑤(公平性) 「プレイヤーは誰も殺していない」事件（外部犯・自殺）の内部整合を
//    積極的に検査する。ここが崩れると、正解が「外部犯／自殺」なのにプレイヤーが
//    犯人としてカードで名指しされる等の不公平が生じる（無実の断罪）。
function checkNoPlayerKiller(scenario: Scenario): string[] {
  const out: string[] = []
  const outside = !!scenario.outsideKiller
  const suicide = !!scenario.suicide
  if (!outside && !suicide) return out

  if (outside && suicide) out.push('外部犯と自殺が同時に立っている（相互排他のはず）')

  // プレイヤー犯人は一人も存在しない
  if ((scenario.killers ?? []).length > 0) {
    out.push(`プレイヤーが誰も殺していない事件なのに killers が空でない（${scenario.killers.length}名）`)
  }
  const killerRoles = (Object.entries(scenario.roles ?? {}) as [CharacterSlot, string][]).filter(([, r]) => r === 'killer')
  if (killerRoles.length > 0) {
    out.push(`プレイヤーが誰も殺していない事件なのに role=killer のプレイヤーがいる: ${killerRoles.map(([s]) => s).join(',')}`)
  }
  // プレイヤー犯を前提とする構造物は付いていてはならない
  if (scenario.mainTrick) out.push('プレイヤーが誰も殺していない事件なのにプレイヤー犯のトリック(mainTrick)が付いている')
  if (scenario.dualKillerInfo) out.push('プレイヤーが誰も殺していない事件なのに二重犯行情報(dualKillerInfo)が付いている')
  if (scenario.cooperationChain) out.push('プレイヤーが誰も殺していない事件なのに協力連鎖(cooperationChain)が付いている')

  // NPCの他殺は「プレイヤー犯」に紐づいていてはならない（外部犯＝殺し屋 / 自殺＝他殺なし）
  const murdered = (scenario.npcVictims ?? []).filter(v => v.isRelatedToCase)
  for (const v of murdered) {
    if (v.killerSlot) out.push(`外部犯/自殺事件なのに口封じ被害者「${v.role}」がプレイヤー(${v.killerSlot})に紐づいている`)
  }
  if (suicide && murdered.length > 0) {
    out.push(`自殺事件なのに他殺（口封じ）の死亡者が${murdered.length}件ある——自殺なら他殺は生じないはず`)
  }
  if (outside && murdered.length === 0) {
    out.push('外部犯事件なのに殺し屋による口封じ被害者が一人もいない（外部犯である手がかりが皆無）')
  }
  // 動機（＝当主が組織に消される背景）が提示されていること
  if (!scenario.victimBackground) {
    out.push(`外部犯/自殺事件なのに当主の背景(victimBackground)が設定されていない`)
  }
  return out
}

// ② 構造版：アリバイ系の真カードが、名指しした人物を"その者の居場所でない部屋"に
//    置いていないか（al_006/007型の場所ズレの一般化）。真相ファクトと突き合わせる。
function checkCardPresence(scenario: Scenario, trueCards: EvidenceCard[]): string[] {
  const out: string[] = []
  const facts = deriveFacts(scenario)
  const inPlaySlots = Object.keys(scenario.roles ?? {}) as CharacterSlot[]
  const killerSlots = new Set((scenario.killers ?? []).map(k => k.slot))
  const locEntries = Object.entries(LOCATION_NAMES) as [string, string][]
  for (const c of trueCards) {
    if (c.category !== 'alibi') continue        // 在室を主張するのはアリバイ系カード
    if (/変装|裏づけ/.test(c.content)) continue // 濡れ衣の否定文（現場を"否定"するため場所を挙げる）は対象外
    // カードが名指しする在席キャラ（ちょうど一人のとき）。犯人は経路上で複数の部屋を
    // 通るため対象外——無実の者は自分の居場所以外に置かれてはならない、を検査する。
    const named = inPlaySlots.filter(s => c.content.includes(CHARACTERS[s].name))
    if (named.length !== 1) continue
    const slot = named[0]
    if (killerSlots.has(slot)) continue
    const rooms = facts.roomsBySlot.get(slot) ?? new Set<string>()
    for (const [, roomName] of locEntries) {
      if (roomName === '食堂' || roomName === '主寝室') continue // 夕食は全員共有／主寝室は当主private
      if (!c.content.includes(roomName)) continue
      if (rooms.has(roomName)) continue                         // 本人の居場所ならOK
      out.push(`カードが無実の${CHARACTERS[slot].name}を居場所にない「${roomName}」へ置いている: ${c.content.slice(0, 40)}…`)
      break
    }
  }
  return out
}

// 時系列(timeline)とアリバイ表の居場所が完全一致するか。ハンドアウトは両方を
// 同時に見せるため、ズレれば本人の記録同士が食い違って見える。
function checkTimelineAlibiAgreement(scenario: Scenario): string[] {
  const out: string[] = []
  for (const [slotKey, a] of Object.entries(scenario.alibis ?? {})) {
    const slot = slotKey as CharacterSlot
    const tl = scenario.timelines?.[slot]
    if (!a || !tl) continue
    const expect = [LOCATION_NAMES[a.T1], LOCATION_NAMES[a.T2], LOCATION_NAMES[a.T3]]
    for (let p = 0; p < 3 && p < tl.length; p++) {
      if (tl[p].location !== expect[p]) {
        out.push(`${CHARACTERS[slot]?.name ?? slot} の時系列(${tl[p].location})とアリバイ(${expect[p]})が不一致[T${p + 1}]`)
      }
    }
  }
  return out
}

// 時間の前後関係の整合：犯行は21時台、口封じはその後（深夜）、遠隔の罠は犯行前(20時台)。
function checkTemporalConsistency(scenario: Scenario): string[] {
  const out: string[] = []
  const facts = deriveFacts(scenario)
  // 犯行時刻ラベルが21時台であること（分単位でも21時始まり）
  const ct = facts.scene?.crimeTime
  if (ct && !/^21時/.test(ct)) out.push(`犯行時刻(${ct})が21時台でない`)
  // 遠隔装置：罠設置(20時台)→作動(21時台)の順。目撃文が20時の設置に言及するはず。
  if (facts.scene?.remote) {
    const eye = scenario.mainTrick?.eyewitness ?? ''
    if (eye && !/20時/.test(eye)) out.push('遠隔装置なのに設置目撃(20時台)への言及がない')
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
  for (const p of checkRawSlotTokens(allTexts)) problems.push(p)
  for (const p of checkTextResidue(allTexts)) problems.push(p)
  for (const p of checkLocationsMapped(scenario)) problems.push(p)
  for (const p of checkRouteClue(scenario)) problems.push(p)
  for (const p of checkApproachConsistency(scenario, allTexts)) problems.push(p)
  for (const p of checkCrimeTime(scenario)) problems.push(p)
  // 血痕・返り血の整合は"真の手がかり"のみで判定（偽の赤ニシンは対象外）
  const trueCards = (opts?.cards ?? []).filter(c => c.isTrue)
  const trueTexts = [...narrative, ...trueCards.map(c => c.content)]
  for (const p of checkPhysicalPlausibility(scenario, trueTexts)) problems.push(p)
  if (opts?.cards) for (const p of checkKillerAtSceneAtCrimeTime(scenario, trueCards)) problems.push(p)
  if (opts?.cards) for (const p of checkSolvability(scenario, trueCards)) problems.push(p)
  if (opts?.cards) for (const p of checkCardPresence(scenario, trueCards)) problems.push(p)
  for (const p of checkProfessionConsistency(scenario)) problems.push(p)
  for (const p of checkImprovisedMethod(scenario)) problems.push(p)
  for (const p of checkNoCoLocatedWitness(scenario)) problems.push(p)
  for (const p of checkCausalIntegrity(scenario)) problems.push(p)
  for (const p of checkBalance(scenario)) problems.push(p)
  for (const p of checkNoPlayerKiller(scenario)) problems.push(p)
  for (const p of checkTimelineAlibiAgreement(scenario)) problems.push(p)
  for (const p of checkTemporalConsistency(scenario)) problems.push(p)

  // 決定的手がかり（目撃証言）が配布カードに含まれているか（cards指定時のみ）
  if (opts?.cards && scenario.mainTrick?.eyewitness) {
    const present = cardTexts.some(c => c.includes(scenario.mainTrick!.eyewitness))
    if (!present) problems.push('決定的手がかり（目撃証言）が配布カードに含まれていない')
  }
  return problems
}
