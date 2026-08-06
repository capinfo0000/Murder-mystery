import type { NpcVictim } from '../types/game'
import { MAIN_VICTIM } from '../data/characters'

// 死亡場所（deathLocation 文字列）→ 図面上の座標
const PIN_COORDS: Record<string, { x: number; y: number }> = {
  '調理場': { x: 251, y: 326 },
  '大階段の下': { x: 239, y: 436 },
  '使用人棟の自室': { x: 300, y: 58 },
  '裏庭の物置小屋': { x: 89, y: 484 },
  '書斎脇の小部屋': { x: 158, y: 330 },
  '使用人用食堂': { x: 174, y: 411 },
  '二階 主寝室付近の廊下': { x: 140, y: 120 },
  '車庫（ガレージ）': { x: 286, y: 484 },
  '自室': { x: 300, y: 92 },
  '地下へ続く廊下': { x: 149, y: 648 },
}

export default function ManorMap({
  onClose,
  npcVictims = [],
}: {
  onClose: () => void
  npcVictims?: NpcVictim[]
}) {
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
        className="bg-[#efe7d6] border border-[#5b4327] rounded-xl w-full max-w-sm overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#c9b892] bg-[#e4d8bd] shrink-0">
          <h3 className="text-[#4a3b1e] font-bold text-sm" style={{ fontFamily: 'serif' }}>
            紫苑館 館内図（3階層）
          </h3>
          <button onClick={onClose} className="text-[#8a6d3b] hover:text-[#4a3b1e] text-lg leading-none">✕</button>
        </div>

        {/* Scroll area: floors + death list */}
        <div className="overflow-y-auto">
          <div className="px-3 py-3">
            <svg viewBox="0 0 344 720" width="100%" xmlns="http://www.w3.org/2000/svg">
              {/* ══════════ 2F ══════════ */}
              <text x="10" y="18" fontSize="11" fill="#5b4327" fontWeight="bold">2F ｜ 寝室・客室階</text>
              <rect x="8" y="26" width="328" height="200" fill="#f3ecda" stroke="#5b4327" strokeWidth="4" rx="2" />
              {/* corridor */}
              <rect x="14" y="110" width="316" height="20" fill="#e7dcc2" />
              <text x="172" y="124" fontSize="8" fill="#a08a5e" textAnchor="middle" letterSpacing="1">廊 下</text>

              <Room x={14} y={40} w={76} h={62} name="客室" floor="2F" />
              <Room x={94} y={40} w={116} h={62} name="主寝室" sub="当主の自室" floor="2F" fill="#f6e0c8" stroke="#b5852f" />
              <Room x={214} y={40} w={52} h={62} name="浴室" floor="2F" fill="#dfeaf0" stroke="#5f8aa0" />
              <Room x={270} y={40} w={60} h={62} name="使用人室" floor="2F" />
              <Room x={14} y={134} w={76} h={60} name="客室" floor="2F" />
              <StairBox x={94} y={134} w={84} h={60} label="大階段" dest="↓ 1Fへ" />
              <Room x={182} y={134} w={60} h={60} name="予備室" floor="2F" />
              <Room x={246} y={134} w={84} h={60} name="物置" floor="2F" fill="#eee6d2" />

              {/* windows 2F */}
              <Win x1={34} y1={26} x2={54} y2={26} />
              <Win x1={130} y1={26} x2={154} y2={26} />
              <Win x1={286} y1={26} x2={310} y2={26} />
              <Win x1={8} y1={52} x2={8} y2={72} v />
              <Win x1={336} y1={52} x2={336} y2={72} v />
              <Win x1={8} y1={150} x2={8} y2={170} v />

              {/* doors 2F (rooms → corridor) */}
              <Door hx={52} hy={110} r={13} a0={0} sweep={0} />
              <Door hx={150} hy={110} r={13} a0={180} sweep={1} />
              <Door hx={240} hy={110} r={13} a0={0} sweep={0} />
              <Door hx={52} hy={130} r={13} a0={0} sweep={1} />

              {/* ══════════ 1F ══════════ */}
              <text x="10" y="268" fontSize="11" fill="#5b4327" fontWeight="bold">1F ｜ 玄関・主要階・庭</text>
              <rect x="8" y="280" width="328" height="248" fill="#f3ecda" stroke="#5b4327" strokeWidth="4" rx="2" />
              {/* corridor */}
              <rect x="14" y="360" width="258" height="18" fill="#e7dcc2" />
              <text x="143" y="373" fontSize="8" fill="#a08a5e" textAnchor="middle" letterSpacing="1">廊 下</text>

              {/* entrance wing */}
              <Room x={278} y={294} w={52} h={150} name="玄関" sub="ホール" floor="1F" fill="#d7e0ea" stroke="#5f728a" />
              <Room x={278} y={448} w={52} h={40} name="ポーチ" floor="1F" fill="#d7e0ea" stroke="#5f728a" />

              {/* top row */}
              <Room x={14} y={294} w={58} h={62} name="図書室" floor="1F" />
              <Room x={76} y={294} w={58} h={62} name="書斎" floor="1F" />
              <Room x={138} y={294} w={40} h={62} name="書斎脇" floor="1F" fill="#eee6d2" />
              <Room x={182} y={294} w={44} h={62} name="食堂" floor="1F" />
              <Room x={230} y={294} w={42} h={62} name="調理場" floor="1F" fill="#f6ead0" />

              {/* mid row */}
              <Room x={14} y={382} w={58} h={58} name="絵画室" floor="1F" />
              <Room x={76} y={382} w={66} h={58} name="温室" floor="1F" fill="#dcefcf" stroke="#4f7a3a" />
              <Room x={146} y={382} w={56} h={58} name="使用人食堂" floor="1F" />
              <StairBox x={206} y={382} w={66} h={58} label="大階段" dest="↑2F ↓B1" />

              {/* outdoor bottom */}
              <Room x={14} y={446} w={150} h={76} name="裏庭・物置小屋" floor="屋外" fill="#dbead9" stroke="#6f8f5f" />
              <Room x={168} y={446} w={70} h={76} name="庭" floor="屋外" fill="#dbead9" stroke="#6f8f5f" />
              <Room x={242} y={446} w={88} h={76} name="車庫" floor="屋外" fill="#e3ddcb" stroke="#8a7a52" />

              {/* windows 1F (temp room heavily glazed) */}
              <Win x1={8} y1={306} x2={8} y2={326} v />
              <Win x1={30} y1={280} x2={54} y2={280} />
              <Win x1={90} y1={440} x2={110} y2={440} />
              <Win x1={76} y1={382} x2={76} y2={402} v />
              <Win x1={142} y1={392} x2={142} y2={412} v />
              <Win x1={336} y1={330} x2={336} y2={352} v />

              {/* doors 1F */}
              <Door hx={43} hy={360} r={12} a0={180} sweep={1} />
              <Door hx={105} hy={360} r={12} a0={180} sweep={1} />
              <Door hx={239} hy={378} r={13} a0={180} sweep={0} />
              <Door hx={278} hy={368} r={14} a0={90} sweep={0} />

              {/* ══════════ B1 ══════════ */}
              <text x="10" y="548" fontSize="11" fill="#5b4327" fontWeight="bold">B1 ｜ 地下階</text>
              <rect x="8" y="558" width="328" height="150" fill="#f3ecda" stroke="#5b4327" strokeWidth="4" rx="2" />
              {/* corridor */}
              <rect x="14" y="638" width="270" height="20" fill="#e7dcc2" />
              <text x="149" y="651" fontSize="8" fill="#a08a5e" textAnchor="middle" letterSpacing="1">地下へ続く廊下</text>

              <Room x={14} y={572} w={94} h={62} name="地下室" floor="B1" />
              <Room x={112} y={572} w={94} h={62} name="金庫室" floor="B1" />
              <Room x={210} y={572} w={74} h={62} name="隠し部屋" floor="B1" fill="#f0d9e6" stroke="#a0417a" dashed italic />
              <StairBox x={288} y={572} w={42} h={62} label="階段" dest="↑1F" small />
              <Room x={14} y={662} w={270} h={38} name="秘密通路" sub="各階へ通じる" floor="" fill="#e7d6f0" stroke="#7e4fb0" dashed italic />

              {/* doors B1 */}
              <Door hx={61} hy={638} r={12} a0={180} sweep={1} />
              <Door hx={159} hy={638} r={12} a0={180} sweep={1} />

              {/* ══════════ pins ══════════ */}
              {/* main victim */}
              <Pin x={152} y={71} label="★" star />
              {/* npc death pins */}
              {pins.map(p => p.coord && (
                <Pin key={p.n} x={p.coord.x} y={p.coord.y} label={String(p.n)} />
              ))}
            </svg>
          </div>

          {/* death location list */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <PinChip star />
              <span className="text-[#5b4327] text-xs">{MAIN_VICTIM.name}（当主）— 主寝室で発見</span>
            </div>
            {pins.length > 0 ? (
              <div className="space-y-1">
                {pins.map(p => (
                  <div key={p.n} className="flex items-start gap-2">
                    <PinChip n={p.n} />
                    <span className="text-[#5b4327] text-xs leading-snug">
                      {p.role} — {p.loc}
                      <span className="text-[#8a7a52]">／{p.time}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#8a7a52] text-xs">館内の死亡者はいません。</p>
            )}
          </div>

          {/* legend */}
          <div className="px-4 py-3 border-t border-[#c9b892] flex flex-wrap gap-x-3 gap-y-1.5 bg-[#e9dfc6]">
            <LegendItem color="#c8a24a" fill="#f7e9c9" label="部屋" />
            <LegendItem color="#4f7a3a" fill="#dcefcf" label="温室" />
            <LegendItem color="#5f728a" fill="#d7e0ea" label="玄関・浴室" />
            <LegendItem color="#6f8f5f" fill="#dbead9" label="屋外" />
            <LegendItem color="#7e4fb0" fill="#e7d6f0" dashed label="秘密通路" />
            <LegendItem color="#a0417a" fill="#f0d9e6" dashed label="隠し部屋" />
            <div className="flex items-center gap-1.5">
              <svg width="18" height="10"><line x1="1" y1="5" x2="17" y2="5" stroke="#5aa0d0" strokeWidth="3" /></svg>
              <span className="text-[#5b4327] text-xs">窓</span>
            </div>
            <div className="flex items-center gap-1.5">
              <PinChip n={0} plain />
              <span className="text-[#5b4327] text-xs">死亡者の発見場所</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Room({
  x, y, w, h, name, sub, floor, fill = '#f7e9c9', stroke = '#c8a24a', dashed, italic,
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
        x={x + w / 2} y={sub ? cy + 1 : cy + 4} fontSize="11" fill="#4a3b1e"
        textAnchor="middle" fontWeight="bold" fontStyle={italic ? 'italic' : undefined}
      >
        {name}
      </text>
      {sub && (
        <text x={x + w / 2} y={cy + 12} fontSize="7.5" fill="#8a7a52" textAnchor="middle">{sub}</text>
      )}
      {floor && (
        <text x={x + 5} y={y + 12} fontSize="7" fill="#b09a6a" fontWeight="bold">{floor}</text>
      )}
    </g>
  )
}

// Window: thick light-blue segment on an outer wall (v = vertical)
function Win({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number; v?: boolean }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5aa0d0" strokeWidth="4" strokeLinecap="round" />
}

// Door: quarter-circle swing arc + leaf
function Door({ hx, hy, r = 14, a0, sweep = 0 }: { hx: number; hy: number; r?: number; a0: number; sweep?: 0 | 1 }) {
  const rad = (d: number) => (d * Math.PI) / 180
  const p1 = [hx + r * Math.cos(rad(a0)), hy + r * Math.sin(rad(a0))]
  const a1 = a0 + (sweep ? 90 : -90)
  const p2 = [hx + r * Math.cos(rad(a1)), hy + r * Math.sin(rad(a1))]
  return (
    <g stroke="#8a6d3b" strokeWidth="1.1" fill="none">
      <line x1={hx} y1={hy} x2={p1[0]} y2={p1[1]} />
      <path d={`M ${p1[0]} ${p1[1]} A ${r} ${r} 0 0 ${sweep} ${p2[0]} ${p2[1]}`} />
    </g>
  )
}

// Staircase with tread lines + destination label
function StairBox({
  x, y, w, h, label, dest, small,
}: {
  x: number; y: number; w: number; h: number; label: string; dest: string; small?: boolean
}) {
  const treads = 5
  const gap = (h - 28) / treads
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="1.5" fill="#eadfc2" stroke="#c8a24a" strokeWidth="2" />
      {Array.from({ length: treads + 1 }).map((_, i) => (
        <line key={i} x1={x + 6} y1={y + 8 + i * gap} x2={x + w - 6} y2={y + 8 + i * gap} stroke="#b09a6a" strokeWidth="1" />
      ))}
      {!small && <text x={x + w / 2} y={y + h - 14} fontSize="9" fill="#6b5424" textAnchor="middle" fontWeight="bold">{label}</text>}
      <text x={x + w / 2} y={y + h - 4} fontSize="7.5" fill="#8a6d3b" textAnchor="middle">{dest}</text>
    </g>
  )
}

// Map pin: numbered disc (or star for the main victim)
function Pin({ x, y, label, star }: { x: number; y: number; label: string; star?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill={star ? '#7c2d12' : '#b91c1c'} stroke="#fff" strokeWidth="1.5" />
      <text x={x} y={y + 3.5} fontSize={star ? 11 : 9.5} fill="#fff" textAnchor="middle" fontWeight="bold">{label}</text>
    </g>
  )
}

function PinChip({ n, star, plain }: { n?: number; star?: boolean; plain?: boolean }) {
  const bg = star ? '#7c2d12' : '#b91c1c'
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white text-[10px] font-bold shrink-0"
      style={{ width: 18, height: 18, backgroundColor: bg }}
    >
      {star ? '★' : plain ? '#' : n}
    </span>
  )
}

function LegendItem({ color, fill, label, dashed }: { color: string; fill?: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="18" height="12">
        <rect x="1" y="1" width="16" height="10" rx="1.5" fill={fill ?? 'none'} stroke={color} strokeWidth="1.5" strokeDasharray={dashed ? '3,2' : undefined} />
      </svg>
      <span className="text-[#5b4327] text-xs">{label}</span>
    </div>
  )
}
