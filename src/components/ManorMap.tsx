export default function ManorMap({ onClose }: { onClose: () => void }) {
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#c9b892] bg-[#e4d8bd]">
          <h3 className="text-[#4a3b1e] font-bold text-sm" style={{ fontFamily: 'serif' }}>
            紫苑館 館内図
          </h3>
          <button
            onClick={onClose}
            className="text-[#8a6d3b] hover:text-[#4a3b1e] text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Map SVG */}
        <div className="px-3 py-3 overflow-y-auto">
          <svg viewBox="0 0 360 470" width="100%" xmlns="http://www.w3.org/2000/svg">
            {/* corridor (drawn first, behind rooms) */}
            <rect x="18" y="208" width="256" height="34" fill="#e7dcc2" stroke="none" />
            <text x="146" y="229" fontSize="9" fill="#a08a5e" textAnchor="middle" letterSpacing="2">廊 下</text>

            {/* ── main block rooms ── */}
            {/* 2F */}
            <Room x={18} y={18} w={82} h={96} name="客室" floor="2F" />
            {/* 1F upper */}
            <Room x={100} y={18} w={88} h={96} name="書斎" floor="1F" />
            <Room x={188} y={18} w={86} h={96} name="食堂" floor="1F" />
            {/* 1F lower (corridor-facing) */}
            <Room x={18} y={114} w={82} h={94} name="図書室" floor="1F" />
            <Room x={100} y={114} w={88} h={94} name="絵画室" floor="1F" />
            <Room x={188} y={114} w={86} h={94} name="温室" floor="1F" fill="#dcefcf" stroke="#4f7a3a" />

            {/* B1 */}
            <Room x={18} y={242} w={82} h={92} name="地下室" floor="B1" />
            <Room x={100} y={242} w={88} h={92} name="金庫室" floor="B1" />
            <Room x={188} y={242} w={86} h={92} name="隠し部屋" floor="B1" fill="#f0d9e6" stroke="#a0417a" dashed italic />

            {/* secret passage */}
            <Room x={18} y={334} w={256} h={44} name="秘密通路" fill="#e7d6f0" stroke="#7e4fb0" dashed italic />

            {/* stairs + storage */}
            <Stairs x={18} y={378} w={150} h={74} />
            <Room x={168} y={378} w={106} h={74} name="物置" fill="#efe7d6" />

            {/* ── right wing: porch / entrance ── */}
            <Room x={276} y={18} w={66} h={92} name="ポーチ" fill="#d7e0ea" stroke="#5f728a" />
            <Room x={276} y={110} w={66} h={190} name="玄関" fill="#d7e0ea" stroke="#5f728a" />
            <Room x={276} y={300} w={66} h={152} name="物入" fill="#efe7d6" />

            {/* ── doors (swing arcs) ── */}
            <Door hx={52} hy={208} r={14} a0={180} sweep={1} />   {/* 図書室 → 廊下 */}
            <Door hx={146} hy={208} r={14} a0={180} sweep={1} />  {/* 絵画室 → 廊下 */}
            <Door hx={232} hy={208} r={14} a0={0} sweep={0} />    {/* 温室 → 廊下 */}
            <Door hx={52} hy={242} r={14} a0={180} sweep={0} />   {/* 地下室 → 廊下 */}
            <Door hx={146} hy={242} r={14} a0={180} sweep={0} />  {/* 金庫室 → 廊下 */}
            <Door hx={276} hy={226} r={16} a0={90} sweep={0} />   {/* 玄関 → 廊下 */}
            <Door hx={342} hy={64} r={16} a0={270} sweep={0} />   {/* ポーチ → 外 */}

            {/* outer wall (drawn last, on top) */}
            <rect x="16" y="16" width="328" height="438" fill="none" stroke="#5b4327" strokeWidth="5" rx="2" />
          </svg>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-[#c9b892] flex flex-wrap gap-x-4 gap-y-1.5 bg-[#e9dfc6]">
          <LegendItem color="#c8a24a" fill="#f7e9c9" label="部屋" />
          <LegendItem color="#4f7a3a" fill="#dcefcf" label="温室" />
          <LegendItem color="#5f728a" fill="#d7e0ea" label="玄関・ポーチ" />
          <LegendItem color="#7e4fb0" fill="#e7d6f0" dashed label="秘密通路" />
          <LegendItem color="#a0417a" fill="#f0d9e6" dashed label="隠し部屋（場所非公開）" />
        </div>
      </div>
    </div>
  )
}

function Room({
  x, y, w, h, name, floor, fill = '#f7e9c9', stroke = '#c8a24a', dashed, italic,
}: {
  x: number; y: number; w: number; h: number; name: string; floor?: string
  fill?: string; stroke?: string; dashed?: boolean; italic?: boolean
}) {
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx="1.5"
        fill={fill} stroke={stroke}
        strokeWidth={dashed ? 1.6 : 2}
        strokeDasharray={dashed ? '6,4' : undefined}
      />
      <text
        x={x + w / 2} y={y + h / 2 + 5} fontSize="13" fill="#4a3b1e"
        textAnchor="middle" fontWeight="bold" fontStyle={italic ? 'italic' : undefined}
      >
        {name}
      </text>
      {floor && (
        <text x={x + 6} y={y + 14} fontSize="7.5" fill="#b09a6a" fontWeight="bold">{floor}</text>
      )}
    </g>
  )
}

// Door drawn as a quarter-circle swing arc + door leaf, architectural style.
function Door({
  hx, hy, r = 15, a0, sweep = 0,
}: {
  hx: number; hy: number; r?: number; a0: number; sweep?: 0 | 1
}) {
  const rad = (d: number) => (d * Math.PI) / 180
  const p1 = [hx + r * Math.cos(rad(a0)), hy + r * Math.sin(rad(a0))]
  const a1 = a0 + (sweep ? 90 : -90)
  const p2 = [hx + r * Math.cos(rad(a1)), hy + r * Math.sin(rad(a1))]
  return (
    <g stroke="#8a6d3b" strokeWidth="1.2" fill="none">
      <line x1={hx} y1={hy} x2={p1[0]} y2={p1[1]} />
      <path d={`M ${p1[0]} ${p1[1]} A ${r} ${r} 0 0 ${sweep} ${p2[0]} ${p2[1]}`} />
    </g>
  )
}

// Staircase with tread lines and an "上り" arrow.
function Stairs({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const treads = 6
  const step = (h - 16) / treads
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="1.5" fill="#efe7d6" stroke="#c8a24a" strokeWidth="2" />
      {Array.from({ length: treads + 1 }).map((_, i) => (
        <line
          key={i}
          x1={x + 10} y1={y + 8 + i * step}
          x2={x + w - 42} y2={y + 8 + i * step}
          stroke="#b09a6a" strokeWidth="1"
        />
      ))}
      <line x1={x + w - 26} y1={y + h - 12} x2={x + w - 26} y2={y + 12} stroke="#8a6d3b" strokeWidth="1.2" />
      <path d={`M ${x + w - 30} ${y + 18} L ${x + w - 26} ${y + 10} L ${x + w - 22} ${y + 18}`} fill="none" stroke="#8a6d3b" strokeWidth="1.2" />
      <text x={x + w - 26} y={y + h - 4} fontSize="8.5" fill="#8a6d3b" textAnchor="middle" fontWeight="bold">上り</text>
    </g>
  )
}

function LegendItem({ color, fill, label, dashed }: { color: string; fill?: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="18" height="12">
        <rect
          x="1" y="1" width="16" height="10" rx="1.5"
          fill={fill ?? 'none'}
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={dashed ? '3,2' : undefined}
        />
      </svg>
      <span className="text-[#5b4327] text-xs">{label}</span>
    </div>
  )
}
