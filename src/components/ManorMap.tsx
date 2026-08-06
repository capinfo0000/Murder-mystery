import type { NpcVictim, Location } from '../types/game'
import { MAIN_VICTIM } from '../data/characters'
import { LOCATION_NAMES } from '../data/locations'

// 当主の遺体発見場所（Location）→ 図面上の座標
const MAIN_LOC_COORDS: Partial<Record<Location, { x: number; y: number }>> = {
  master_bedroom: { x: 152, y: 71 },
  guest_room: { x: 52, y: 71 },
  study: { x: 105, y: 325 },
  library: { x: 43, y: 325 },
  dining: { x: 204, y: 325 },
  gallery: { x: 43, y: 411 },
  greenhouse: { x: 109, y: 411 },
  basement: { x: 78, y: 607 },
}

// 死亡場所（deathLocation 文字列）→ 図面上の座標
const PIN_COORDS: Record<string, { x: number; y: number }> = {
  '調理場': { x: 251, y: 326 },
  '大階段の下': { x: 239, y: 436 },
  '使用人棟の自室': { x: 300, y: 58 },
  '裏庭の物置小屋': { x: 55, y: 492 },
  '書斎脇の小部屋': { x: 158, y: 326 },
  '使用人用食堂': { x: 174, y: 411 },
  '二階 主寝室付近の廊下': { x: 140, y: 120 },
  '車庫（ガレージ）': { x: 286, y: 492 },
  '自室': { x: 300, y: 92 },
  '地下へ続く廊下': { x: 150, y: 660 },
}

// grayscale investigation-diagram palette
const C = {
  panel: '#e7e7e2',
  headerBg: '#dcdcd6',
  border: '#b9b9b2',
  wall: '#55554f',
  text: '#33332f',
  label: '#4a4a44',
  faint: '#9a9a90',
  room: '#d9d9d4',
  roomStroke: '#8f8f8a',
  corridor: '#d0d0cb',
  key: '#e6e0d2',        // 主寝室 highlight
  keyStroke: '#9e9788',
  cool: '#cdd3d8',       // 玄関・浴室
  coolStroke: '#7d8794',
  garden: '#c3d9b8',
  gardenStroke: '#6f8f5f',
  green: '#cfe3c4',      // 温室
  greenStroke: '#6f8f5f',
}

export default function ManorMap({
  onClose,
  npcVictims = [],
  mainVictimLocation,
}: {
  onClose: () => void
  npcVictims?: NpcVictim[]
  mainVictimLocation?: Location
}) {
  const mainCoord = (mainVictimLocation && MAIN_LOC_COORDS[mainVictimLocation]) || { x: 152, y: 71 }
  const mainLocName = mainVictimLocation ? LOCATION_NAMES[mainVictimLocation] : '主寝室'
  const pins = npcVictims.map((v, i) => ({
    n: i + 1,
    role: v.role,
    loc: v.deathLocation,
    time: v.deathTime,
    coord: PIN_COORDS[v.deathLocation],
  }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="border rounded-xl w-full max-w-sm overflow-hidden max-h-[92vh] flex flex-col"
        style={{ backgroundColor: C.panel, borderColor: C.wall }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ backgroundColor: C.headerBg, borderColor: C.border }}>
          <h3 className="font-bold text-sm" style={{ fontFamily: 'serif', color: C.text }}>
            紫苑館 見取り図（3階層）
          </h3>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: C.label }}>✕</button>
        </div>

        <div className="overflow-y-auto">
          {/* marker legend box (investigation-report style) */}
          <div className="mx-3 mt-3 mb-1 inline-flex flex-col gap-1 border rounded px-3 py-2" style={{ borderColor: C.wall, backgroundColor: '#f3f3ef' }}>
            <div className="flex items-center gap-2">
              <MarkerGlyph kind="main" />
              <span className="text-xs" style={{ color: C.text }}>当主の発見位置</span>
            </div>
            <div className="flex items-center gap-2">
              <MarkerGlyph kind="npc" n={1} />
              <span className="text-xs" style={{ color: C.text }}>関係者（死亡）の発見位置</span>
            </div>
          </div>

          <div className="px-3 pt-1 pb-2">
            <svg viewBox="0 0 344 720" width="100%" xmlns="http://www.w3.org/2000/svg">
              {/* ══════════ 2F ══════════ */}
              <text x="10" y="18" fontSize="11" fill={C.label} fontWeight="bold">2F ｜ 寝室・客室階</text>
              <rect x="8" y="26" width="328" height="200" fill="#eeeeea" stroke={C.wall} strokeWidth="4" rx="2" />
              <rect x="14" y="110" width="316" height="20" fill={C.corridor} />
              <text x="172" y="124" fontSize="8" fill={C.faint} textAnchor="middle" letterSpacing="1">廊 下</text>

              <Room x={14} y={40} w={76} h={62} name="客室" floor="2F" />
              <Room x={94} y={40} w={116} h={62} name="主寝室" sub="当主の自室" floor="2F" fill={C.key} stroke={C.keyStroke} />
              <Room x={214} y={40} w={52} h={62} name="浴室" floor="2F" fill={C.cool} stroke={C.coolStroke} />
              <Room x={270} y={40} w={60} h={62} name="使用人室" floor="2F" />
              <Room x={14} y={134} w={76} h={60} name="客室" floor="2F" />
              <StairBox x={94} y={134} w={84} h={60} label="大階段" dest="↓ 1Fへ" />
              <Room x={182} y={134} w={60} h={60} name="予備室" floor="2F" />
              <Room x={246} y={134} w={84} h={60} name="物置" floor="2F" />

              <Win x1={34} y1={26} x2={54} y2={26} />
              <Win x1={130} y1={26} x2={154} y2={26} />
              <Win x1={286} y1={26} x2={310} y2={26} />
              <Win x1={8} y1={52} x2={8} y2={72} />
              <Win x1={336} y1={52} x2={336} y2={72} />
              <Win x1={8} y1={150} x2={8} y2={170} />

              <Door hx={52} hy={110} r={13} a0={0} sweep={0} />
              <Door hx={150} hy={110} r={13} a0={180} sweep={1} />
              <Door hx={240} hy={110} r={13} a0={0} sweep={0} />
              <Door hx={52} hy={130} r={13} a0={0} sweep={1} />

              {/* ══════════ 1F ══════════ */}
              <text x="10" y="268" fontSize="11" fill={C.label} fontWeight="bold">1F ｜ 玄関・主要階</text>

              {/* 屋外の敷地（建物の外・破線で敷地境界） */}
              <rect x="8" y="456" width="328" height="70" fill={C.garden} stroke={C.gardenStroke} strokeWidth="1.4" strokeDasharray="7,4" rx="2" />
              <text x="150" y="474" fontSize="9" fill="#4c6a3c" textAnchor="middle" fontWeight="bold">庭・敷地（屋外）</text>
              {/* 屋外の建物（離れ）はグレーの塊で表現 */}
              <Room x={20} y={480} w={72} h={40} name="物置小屋" fill="#c9c9c3" stroke={C.roomStroke} />
              <Room x={246} y={480} w={80} h={40} name="車庫" fill="#c9c9c3" stroke={C.roomStroke} />
              <text x="160" y="504" fontSize="8" fill="#4c6a3c" textAnchor="middle">裏庭</text>

              {/* 建物本体（1F）— 外壁の中が屋内 */}
              <rect x="8" y="280" width="328" height="168" fill="#eeeeea" stroke={C.wall} strokeWidth="4" rx="2" />
              <rect x="14" y="360" width="258" height="18" fill={C.corridor} />
              <text x="143" y="373" fontSize="8" fill={C.faint} textAnchor="middle" letterSpacing="1">廊 下</text>

              <Room x={278} y={294} w={52} h={148} name="玄関" sub="ホール" floor="1F" fill={C.cool} stroke={C.coolStroke} />

              <Room x={14} y={294} w={58} h={62} name="図書室" floor="1F" />
              <Room x={76} y={294} w={58} h={62} name="書斎" floor="1F" />
              <Room x={138} y={294} w={40} h={62} name="書斎脇" floor="1F" />
              <Room x={182} y={294} w={44} h={62} name="食堂" floor="1F" />
              <Room x={230} y={294} w={42} h={62} name="調理場" floor="1F" />

              <Room x={14} y={382} w={58} h={58} name="絵画室" floor="1F" />
              <Room x={76} y={382} w={66} h={58} name="温室" floor="1F" fill={C.green} stroke={C.greenStroke} />
              <Room x={146} y={382} w={56} h={58} name="使用人食堂" floor="1F" />
              <StairBox x={206} y={382} w={66} h={58} label="大階段" dest="↑2F ↓B1" />

              {/* ポーチ（玄関前・屋外の張り出し） */}
              <rect x="278" y="456" width="52" height="30" fill={C.cool} stroke={C.coolStroke} strokeWidth="1.6" rx="1.5" />
              <text x="304" y="475" fontSize="9" fill={C.text} textAnchor="middle" fontWeight="bold">ポーチ</text>

              <Win x1={8} y1={306} x2={8} y2={326} />
              <Win x1={30} y1={280} x2={54} y2={280} />
              <Win x1={76} y1={382} x2={76} y2={402} />
              <Win x1={142} y1={392} x2={142} y2={412} />
              <Win x1={336} y1={330} x2={336} y2={352} />

              <Door hx={43} hy={360} r={12} a0={180} sweep={1} />
              <Door hx={105} hy={360} r={12} a0={180} sweep={1} />
              <Door hx={239} hy={378} r={13} a0={180} sweep={0} />
              <Door hx={278} hy={368} r={14} a0={90} sweep={0} />

              {/* ══════════ B1 ══════════ */}
              <text x="10" y="548" fontSize="11" fill={C.label} fontWeight="bold">B1 ｜ 地下階</text>
              <rect x="8" y="558" width="328" height="150" fill="#eeeeea" stroke={C.wall} strokeWidth="4" rx="2" />
              <rect x="14" y="650" width="316" height="20" fill={C.corridor} />
              <text x="150" y="663" fontSize="8" fill={C.faint} textAnchor="middle" letterSpacing="1">地下へ続く廊下</text>

              <Room x={14} y={572} w={128} h={70} name="地下室" floor="B1" />
              <Room x={148} y={572} w={124} h={70} name="金庫室" floor="B1" />
              <StairBox x={278} y={572} w={52} h={70} label="階段" dest="↑1F" small />

              <Door hx={78} hy={650} r={12} a0={180} sweep={1} />
              <Door hx={210} hy={650} r={12} a0={180} sweep={1} />

              {/* ══════════ markers ══════════ */}
              <Pin x={mainCoord.x} y={mainCoord.y} kind="main" />
              {pins.map(p => p.coord && (
                <Pin key={p.n} x={p.coord.x} y={p.coord.y} kind="npc" n={p.n} />
              ))}
            </svg>
          </div>

          {/* death location list */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <MarkerGlyph kind="main" />
              <span className="text-xs" style={{ color: C.text }}>{MAIN_VICTIM.name}（当主）— {mainLocName}で発見</span>
            </div>
            {pins.length > 0 ? (
              <div className="space-y-1">
                {pins.map(p => (
                  <div key={p.n} className="flex items-start gap-2">
                    <MarkerGlyph kind="npc" n={p.n} />
                    <span className="text-xs leading-snug" style={{ color: C.text }}>
                      {p.role} — {p.loc}
                      <span style={{ color: C.faint }}>／{p.time}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: C.faint }}>館内の死亡者はいません。</p>
            )}
          </div>

          {/* legend */}
          <div className="px-4 py-3 border-t flex flex-wrap gap-x-3 gap-y-1.5" style={{ borderColor: C.border, backgroundColor: '#dedeD8' }}>
            <LegendItem color={C.roomStroke} fill={C.room} label="部屋（屋内）" />
            <LegendItem color={C.greenStroke} fill={C.green} label="温室" />
            <LegendItem color={C.coolStroke} fill={C.cool} label="玄関・浴室" />
            <LegendItem color={C.gardenStroke} fill={C.garden} dashed label="屋外・庭（敷地）" />
            <div className="flex items-center gap-1.5">
              <svg width="18" height="10"><line x1="1" y1="5" x2="17" y2="5" stroke="#5aa0d0" strokeWidth="3" /></svg>
              <span className="text-xs" style={{ color: C.text }}>窓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Room({
  x, y, w, h, name, sub, floor, fill = C.room, stroke = C.roomStroke, dashed, italic,
}: {
  x: number; y: number; w: number; h: number; name: string; sub?: string; floor?: string
  fill?: string; stroke?: string; dashed?: boolean; italic?: boolean
}) {
  const cy = y + h / 2
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx="1.5"
        fill={fill} stroke={stroke}
        strokeWidth={dashed ? 1.6 : 2}
        strokeDasharray={dashed ? '6,4' : undefined}
      />
      <text
        x={x + w / 2} y={sub ? cy + 1 : cy + 4} fontSize="11" fill={C.text}
        textAnchor="middle" fontWeight="bold" fontStyle={italic ? 'italic' : undefined}
      >
        {name}
      </text>
      {sub && <text x={x + w / 2} y={cy + 12} fontSize="7.5" fill={C.faint} textAnchor="middle">{sub}</text>}
      {floor && <text x={x + 5} y={y + 12} fontSize="7" fill={C.faint} fontWeight="bold">{floor}</text>}
    </g>
  )
}

function Win({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5aa0d0" strokeWidth="4" strokeLinecap="round" />
}

function Door({ hx, hy, r = 14, a0, sweep = 0 }: { hx: number; hy: number; r?: number; a0: number; sweep?: 0 | 1 }) {
  const rad = (d: number) => (d * Math.PI) / 180
  const p1 = [hx + r * Math.cos(rad(a0)), hy + r * Math.sin(rad(a0))]
  const a1 = a0 + (sweep ? 90 : -90)
  const p2 = [hx + r * Math.cos(rad(a1)), hy + r * Math.sin(rad(a1))]
  return (
    <g stroke="#8f8f8a" strokeWidth="1.1" fill="none">
      <line x1={hx} y1={hy} x2={p1[0]} y2={p1[1]} />
      <path d={`M ${p1[0]} ${p1[1]} A ${r} ${r} 0 0 ${sweep} ${p2[0]} ${p2[1]}`} />
    </g>
  )
}

function StairBox({
  x, y, w, h, label, dest, small,
}: {
  x: number; y: number; w: number; h: number; label: string; dest: string; small?: boolean
}) {
  const treads = 5
  const gap = (h - 28) / treads
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="1.5" fill="#cfcfca" stroke={C.roomStroke} strokeWidth="2" />
      {Array.from({ length: treads + 1 }).map((_, i) => (
        <line key={i} x1={x + 6} y1={y + 8 + i * gap} x2={x + w - 6} y2={y + 8 + i * gap} stroke={C.faint} strokeWidth="1" />
      ))}
      {!small && <text x={x + w / 2} y={y + h - 14} fontSize="9" fill={C.text} textAnchor="middle" fontWeight="bold">{label}</text>}
      <text x={x + w / 2} y={y + h - 4} fontSize="7.5" fill={C.label} textAnchor="middle">{dest}</text>
    </g>
  )
}

// Map marker: ○ (open circle) for 当主, ▲ (triangle) + number for NPC
function Pin({ x, y, kind, n }: { x: number; y: number; kind: 'main' | 'npc'; n?: number }) {
  if (kind === 'main') {
    return (
      <g>
        <circle cx={x} cy={y} r={8.5} fill="#f5f5f2" stroke="#2a2a28" strokeWidth="2.2" />
        <text x={x} y={y + 3.5} fontSize="9" fill="#2a2a28" textAnchor="middle" fontWeight="bold">主</text>
      </g>
    )
  }
  return (
    <g>
      <polygon points={`${x},${y - 9} ${x - 8},${y + 6} ${x + 8},${y + 6}`} fill="#33332f" stroke="#fff" strokeWidth="1.2" />
      <circle cx={x + 11} cy={y - 8} r={6.5} fill="#b91c1c" stroke="#fff" strokeWidth="1" />
      <text x={x + 11} y={y - 5} fontSize="9" fill="#fff" textAnchor="middle" fontWeight="bold">{n}</text>
    </g>
  )
}

// small inline glyph used in legend / list rows
function MarkerGlyph({ kind, n }: { kind: 'main' | 'npc'; n?: number }) {
  if (kind === 'main') {
    return (
      <svg width="20" height="20" className="shrink-0">
        <circle cx="10" cy="10" r="7.5" fill="#f5f5f2" stroke="#2a2a28" strokeWidth="2" />
        <text x="10" y="13.5" fontSize="8" fill="#2a2a28" textAnchor="middle" fontWeight="bold">主</text>
      </svg>
    )
  }
  return (
    <svg width="20" height="20" className="shrink-0">
      <polygon points="10,3 2,17 18,17" fill="#33332f" stroke="#fff" strokeWidth="1" />
      {n != null && <text x="10" y="16" fontSize="8" fill="#fff" textAnchor="middle" fontWeight="bold">{n}</text>}
    </svg>
  )
}

function LegendItem({ color, fill, label, dashed }: { color: string; fill?: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="18" height="12">
        <rect x="1" y="1" width="16" height="10" rx="1.5" fill={fill ?? 'none'} stroke={color} strokeWidth="1.5" strokeDasharray={dashed ? '3,2' : undefined} />
      </svg>
      <span className="text-xs" style={{ color: C.text }}>{label}</span>
    </div>
  )
}
