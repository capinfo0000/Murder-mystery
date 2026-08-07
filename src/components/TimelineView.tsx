import type { TimelineEntry } from '../types/game'

interface Props {
  entries: TimelineEntry[]
}

// 事件当日の行動を時系列で表示する（本人だけが見る真実）。
// 事件発生の時間帯（21時台）は赤で強調する。
export default function TimelineView({ entries }: Props) {
  if (!entries || entries.length === 0) {
    return <p className="text-purple-500 text-sm">行動記録なし</p>
  }
  return (
    <ol className="relative border-l border-purple-800/60 ml-2 space-y-4">
      {entries.map((e, i) => {
        const isIncident = e.period.includes('事件') || e.period.includes('21時台')
        return (
          <li key={i} className="ml-4">
            <span
              className={`absolute -left-[7px] w-3 h-3 rounded-full border-2 ${
                isIncident
                  ? 'bg-red-500 border-red-300'
                  : 'bg-purple-600 border-purple-400'
              }`}
            />
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className={`text-xs font-bold ${isIncident ? 'text-red-300' : 'text-purple-300'}`}>
                {e.period}
              </span>
              <span className="text-purple-400 text-xs">
                📍 {e.location}
              </span>
            </div>
            <p className={`text-sm leading-relaxed mt-1 ${isIncident ? 'text-red-100' : 'text-purple-200'}`}>
              {e.action}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
