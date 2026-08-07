import { LOCATION_NAMES } from '../data/locations'
import type { Location } from '../types/game'

interface Props {
  alibis: { T1: Location; T2: Location; T3: Location }
}

const TIME_SLOTS = [
  { key: 'T1', label: '20:00〜21:00' },
  { key: 'T2', label: '21:00〜22:00（事件発生）⚠️' },
  { key: 'T3', label: '22:00〜23:00' },
] as const

export default function AlibiMatrix({ alibis }: Props) {
  return (
    <div className="bg-[#1a0f2e] border border-purple-900 rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-purple-950/50 border-b border-purple-900">
        <h3 className="text-purple-300 text-xs font-medium">アリバイ表（真実）</h3>
      </div>
      <div className="divide-y divide-purple-900/50">
        {TIME_SLOTS.map(({ key, label }) => (
          <div key={key} className={`flex items-center px-4 py-3 ${key === 'T2' ? 'bg-red-950/20' : ''}`}>
            <div className="w-36 shrink-0">
              <span className={`text-xs font-medium ${key === 'T2' ? 'text-red-300' : 'text-purple-400'}`}>
                {label}
              </span>
            </div>
            <div className="flex-1">
              <span className={`text-sm ${key === 'T2' ? 'text-red-200' : 'text-purple-200'}`}>
                {LOCATION_NAMES[alibis[key]]}
              </span>
              {key === 'T2' && (
                <p className="text-red-400/70 text-xs mt-0.5">事件発生時刻帯</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
