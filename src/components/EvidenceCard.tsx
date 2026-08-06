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

// Top accent strip color per category
const CATEGORY_ACCENT: Record<string, string> = {
  physical: '#d97706',
  alibi: '#2563eb',
  psychology: '#db2777',
  background: '#64748b',
  victim: '#dc2626',
  motive: '#ea580c',
  technical: '#0891b2',
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
  const [open, setOpen] = useState(false)
  const colorClass = CATEGORY_COLORS[card.category] ?? 'bg-purple-900/30 text-purple-300 border-purple-800/50'
  const accent = CATEGORY_ACCENT[card.category] ?? '#7c3aed'
  const isPublic = (card.sharedWith ?? []).includes('all')
  const characterName = card.relatedSlot ? CHARACTERS[card.relatedSlot]?.name : null
  const label = CATEGORY_LABELS[card.category] ?? card.category

  return (
    <>
      {/* ── Card face (grid tile) ── */}
      <button
        onClick={() => setOpen(true)}
        className={`relative flex flex-col text-left bg-[#1a0f2e] border rounded-xl overflow-hidden aspect-[3/4] transition-all hover:brightness-110 ${isPublic ? 'border-purple-500' : 'border-purple-900'}`}
      >
        {/* accent strip */}
        <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: accent }} />
        <div className="flex flex-col flex-1 min-h-0 p-2.5">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${colorClass}`}>{label}</span>
            {isPublic && <span className="text-[9px] text-green-400 shrink-0">公開</span>}
          </div>
          <p className="text-[11px] text-purple-200 leading-snug flex-1 min-h-0 overflow-hidden line-clamp-6">
            {card.content}
          </p>
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-purple-900/60">
            {characterName ? (
              <span className="text-[9px] text-purple-500 truncate">関係: {characterName}</span>
            ) : <span />}
            <span className="text-purple-600 text-[9px] shrink-0">詳細 ›</span>
          </div>
        </div>
      </button>

      {/* ── Detail modal ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5"
          onClick={() => setOpen(false)}
        >
          <div
            className={`bg-[#1a0f2e] border rounded-2xl w-full max-w-xs overflow-hidden ${isPublic ? 'border-purple-500' : 'border-purple-800'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="h-2 w-full" style={{ backgroundColor: accent }} />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClass}`}>{label}</span>
                {characterName && <span className="text-xs text-purple-500">関係: {characterName}</span>}
                {isPublic && <span className="text-xs text-green-400">公開済み</span>}
              </div>
              <p className="text-sm text-purple-100 leading-relaxed">{card.content}</p>

              {showActions && !isPublic && (onShareAll || onSecretSend) && (
                <div className="flex gap-2 mt-4">
                  {onShareAll && (
                    <button
                      onClick={() => { onShareAll(card.id); setOpen(false) }}
                      className="flex-1 bg-purple-800/50 hover:bg-purple-700/50 text-purple-200 text-xs rounded-lg py-2 border border-purple-700 transition-colors"
                    >
                      全体に公開
                    </button>
                  )}
                  {onSecretSend && (
                    <button
                      onClick={() => { onSecretSend(card.id); setOpen(false) }}
                      className="flex-1 bg-[#2a1040]/50 hover:bg-[#3a1550]/50 text-purple-300 text-xs rounded-lg py-2 border border-purple-800 transition-colors"
                    >
                      密談で送る
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => setOpen(false)}
                className="w-full mt-3 text-purple-500 hover:text-purple-300 text-xs py-1"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
