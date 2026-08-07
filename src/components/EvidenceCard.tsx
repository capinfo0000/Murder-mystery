import { useState } from 'react'
import type { EvidenceCard } from '../types/game'

// カードの種類（カテゴリ）はプレイヤーに一切見せない。色でも判別できないよう、
// アクセント帯は全カード共通の白で固定する。
const ACCENT = '#e8e8ea'

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
  const accent = ACCENT
  const isPublic = (card.sharedWith ?? []).includes('all')

  return (
    <>
      {/* ── Card face (grid tile) ── */}
      <button
        onClick={() => setOpen(true)}
        className={`relative flex flex-col text-left bg-[#1a0f2e] border rounded-xl overflow-hidden min-h-[7rem] transition-all hover:brightness-110 ${isPublic ? 'border-purple-500' : 'border-purple-900'}`}
      >
        {/* accent strip */}
        <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: accent }} />
        <div className="flex flex-col flex-1 p-3">
          {isPublic && (
            <div className="flex items-center justify-end mb-2">
              <span className="text-[10px] text-green-400 shrink-0">公開</span>
            </div>
          )}
          {/* 本文は全文表示（切り詰めない） */}
          <p className="text-[13px] text-purple-200 leading-relaxed break-words whitespace-pre-wrap flex-1">
            {card.content}
          </p>
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
              {isPublic && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-green-400">公開済み</span>
                </div>
              )}
              <p className="text-[15px] text-purple-100 leading-relaxed break-words">{card.content}</p>

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
