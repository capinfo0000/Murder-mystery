import { useState } from 'react'
import type { EvidenceCard } from '../types/game'
import { CHARACTERS } from '../data/characters'

const CATEGORY_LABELS: Record<string, string> = {
  physical: '物的証拠',
  alibi: 'アリバイ',
  psychology: '心理・感情',
  background: '背景情報',
  victim: '被害者情報',
  motive: '動機',
  technical: '技術情報',
}

const CATEGORY_COLORS: Record<string, string> = {
  physical: 'bg-amber-900/30 text-amber-300 border-amber-800/50',
  alibi: 'bg-blue-900/30 text-blue-300 border-blue-800/50',
  psychology: 'bg-pink-900/30 text-pink-300 border-pink-800/50',
  background: 'bg-slate-800/50 text-slate-300 border-slate-700/50',
  victim: 'bg-red-900/30 text-red-300 border-red-800/50',
  motive: 'bg-orange-900/30 text-orange-300 border-orange-800/50',
  technical: 'bg-cyan-900/30 text-cyan-300 border-cyan-800/50',
}

interface Props {
  card: EvidenceCard
  showActions?: boolean
  onShareAll?: (cardId: string) => void
  onSecretSend?: (cardId: string) => void
  gameId?: string
  playerId?: string
}

export default function EvidenceCardView({
  card,
  showActions = true,
  onShareAll,
  onSecretSend,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const colorClass = CATEGORY_COLORS[card.category] ?? 'bg-purple-900/30 text-purple-300 border-purple-800/50'
  const isPublic = (card.sharedWith ?? []).includes('all')
  const characterName = card.relatedSlot ? CHARACTERS[card.relatedSlot]?.name : null

  return (
    <div
      className={`bg-[#1a0f2e] border rounded-xl overflow-hidden transition-all ${isPublic ? 'border-purple-600' : 'border-purple-900'}`}
    >
      <div
        className="px-4 py-3 flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClass}`}>
              {CATEGORY_LABELS[card.category] ?? card.category}
            </span>
            {characterName && (
              <span className="text-xs text-purple-500">関係: {characterName}</span>
            )}
            {isPublic && (
              <span className="text-xs text-green-400">公開済み</span>
            )}
          </div>
          <p className={`text-sm text-purple-200 leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
            {card.content}
          </p>
          {!expanded && card.content.length > 80 && (
            <span className="text-purple-500 text-xs">…続きを読む</span>
          )}
        </div>
        <span className="text-purple-600 text-xs mt-1">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Actions */}
      {expanded && showActions && !isPublic && (
        <div className="px-4 pb-3 flex gap-2">
          {onShareAll && (
            <button
              onClick={() => onShareAll(card.id)}
              className="flex-1 bg-purple-800/50 hover:bg-purple-700/50 text-purple-200 text-xs rounded-lg py-2 border border-purple-700 transition-colors"
            >
              全体に公開
            </button>
          )}
          {onSecretSend && (
            <button
              onClick={() => onSecretSend(card.id)}
              className="flex-1 bg-[#2a1040]/50 hover:bg-[#3a1550]/50 text-purple-300 text-xs rounded-lg py-2 border border-purple-800 transition-colors"
            >
              密談で送る
            </button>
          )}
        </div>
      )}
    </div>
  )
}
