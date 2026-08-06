export default function ManorMap({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#100820] border border-purple-800 rounded-xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-900">
          <h3 className="text-purple-200 font-bold text-sm" style={{ fontFamily: 'serif' }}>
            🗺 紫苑館 館内図
          </h3>
          <button
            onClick={onClose}
            className="text-purple-500 hover:text-purple-300 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Map SVG */}
        <div className="px-3 py-3">
          <svg viewBox="0 0 280 440" width="100%" xmlns="http://www.w3.org/2000/svg">
            {/* ── 2F ───────────────────────────────────── */}
            <text x="4" y="48" fontSize="9" fill="#9333ea" fontWeight="bold">2F</text>

            {/* 客室 */}
            <rect x="38" y="10" width="234" height="60" rx="3"
              fill="#1a0d35" stroke="#7c3aed" strokeWidth="1.2" />
            <text x="155" y="36" fontSize="12" fill="#c4b5fd" textAnchor="middle" fontWeight="bold">客室</text>
            <text x="155" y="52" fontSize="8" fill="#6d28d9" textAnchor="middle">Guest Room</text>

            {/* divider */}
            <line x1="38" y1="78" x2="272" y2="78" stroke="#4c1d95" strokeWidth="0.8" strokeDasharray="4,3" />

            {/* ── 1F ───────────────────────────────────── */}
            <text x="4" y="167" fontSize="9" fill="#9333ea" fontWeight="bold">1F</text>

            {/* 書斎 */}
            <rect x="38" y="86" width="108" height="65" rx="3"
              fill="#1a0d35" stroke="#7c3aed" strokeWidth="1.2" />
            <text x="92" y="114" fontSize="11" fill="#c4b5fd" textAnchor="middle" fontWeight="bold">書斎</text>
            <text x="92" y="128" fontSize="7.5" fill="#6d28d9" textAnchor="middle">Study</text>

            {/* 食堂 */}
            <rect x="154" y="86" width="118" height="65" rx="3"
              fill="#1a0d35" stroke="#7c3aed" strokeWidth="1.2" />
            <text x="213" y="114" fontSize="11" fill="#c4b5fd" textAnchor="middle" fontWeight="bold">食堂</text>
            <text x="213" y="128" fontSize="7.5" fill="#6d28d9" textAnchor="middle">Dining Room</text>

            {/* 図書室 */}
            <rect x="38" y="159" width="108" height="60" rx="3"
              fill="#1a0d35" stroke="#7c3aed" strokeWidth="1.2" />
            <text x="92" y="184" fontSize="11" fill="#c4b5fd" textAnchor="middle" fontWeight="bold">図書室</text>
            <text x="92" y="198" fontSize="7.5" fill="#6d28d9" textAnchor="middle">Library</text>

            {/* 絵画室 */}
            <rect x="154" y="159" width="118" height="60" rx="3"
              fill="#1a0d35" stroke="#7c3aed" strokeWidth="1.2" />
            <text x="213" y="184" fontSize="11" fill="#c4b5fd" textAnchor="middle" fontWeight="bold">絵画室</text>
            <text x="213" y="198" fontSize="7.5" fill="#6d28d9" textAnchor="middle">Gallery</text>

            {/* 温室 (greenish tint) */}
            <rect x="38" y="227" width="234" height="46" rx="3"
              fill="#071f12" stroke="#15803d" strokeWidth="1.2" />
            <text x="155" y="246" fontSize="11" fill="#86efac" textAnchor="middle" fontWeight="bold">温室</text>
            <text x="155" y="260" fontSize="7.5" fill="#166534" textAnchor="middle">Greenhouse</text>

            {/* 秘密通路 (dashed) */}
            <rect x="38" y="281" width="234" height="34" rx="3"
              fill="#1a0a30" stroke="#a855f7" strokeWidth="1.2" strokeDasharray="5,3" />
            <text x="155" y="294" fontSize="10" fill="#d8b4fe" textAnchor="middle" fontStyle="italic">秘密通路</text>
            <text x="155" y="308" fontSize="7.5" fill="#7e22ce" textAnchor="middle" fontStyle="italic">Secret Passage</text>

            {/* divider */}
            <line x1="38" y1="323" x2="272" y2="323" stroke="#4c1d95" strokeWidth="0.8" strokeDasharray="4,3" />

            {/* ── B1 ───────────────────────────────────── */}
            <text x="4" y="355" fontSize="9" fill="#9333ea" fontWeight="bold">B1</text>

            {/* 地下室 */}
            <rect x="38" y="330" width="108" height="58" rx="3"
              fill="#130c28" stroke="#6d28d9" strokeWidth="1.2" />
            <text x="92" y="355" fontSize="11" fill="#c4b5fd" textAnchor="middle" fontWeight="bold">地下室</text>
            <text x="92" y="369" fontSize="7.5" fill="#5b21b6" textAnchor="middle">Basement</text>

            {/* 金庫室 */}
            <rect x="154" y="330" width="118" height="58" rx="3"
              fill="#130c28" stroke="#6d28d9" strokeWidth="1.2" />
            <text x="213" y="355" fontSize="11" fill="#c4b5fd" textAnchor="middle" fontWeight="bold">金庫室</text>
            <text x="213" y="369" fontSize="7.5" fill="#5b21b6" textAnchor="middle">Safe Room</text>

            {/* 隠し部屋 (dashed, fuchsia) */}
            <rect x="38" y="396" width="150" height="38" rx="3"
              fill="#1a0820" stroke="#c026d3" strokeWidth="1" strokeDasharray="4,2" />
            <text x="113" y="410" fontSize="10" fill="#f0abfc" textAnchor="middle" fontStyle="italic">隠し部屋</text>
            <text x="113" y="424" fontSize="7.5" fill="#86198f" textAnchor="middle" fontStyle="italic">Hidden Room</text>

            {/* question mark for hidden room — implying unknown location */}
            <text x="215" y="418" fontSize="18" fill="#6b21a8" textAnchor="middle" opacity="0.5">?</text>
          </svg>
        </div>

        {/* Legend */}
        <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1.5">
          <LegendItem color="#7c3aed" label="通常の部屋" />
          <LegendItem color="#15803d" label="温室" />
          <LegendItem dashed color="#a855f7" label="秘密通路" />
          <LegendItem dashed color="#c026d3" label="隠し部屋（場所非公開）" />
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="18" height="10">
        <rect
          x="1" y="1" width="16" height="8" rx="1.5"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={dashed ? '4,2' : undefined}
        />
      </svg>
      <span className="text-purple-400 text-xs">{label}</span>
    </div>
  )
}
