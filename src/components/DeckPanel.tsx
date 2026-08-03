import type { EvidenceCard } from '../types/game'

interface Props {
  deckCards: EvidenceCard[]
  isHost: boolean
  hasDrawn: boolean
  onGmReveal: () => void
  onPlayerDraw: () => void
}

export default function DeckPanel({ deckCards, isHost, hasDrawn, onGmReveal, onPlayerDraw }: Props) {
  return (
    <div className="bg-[#1a0f2e] border border-purple-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-purple-300 text-sm font-medium">山札</h3>
        <span className="text-purple-500 text-xs">{deckCards.length}枚</span>
      </div>

      {deckCards.length === 0 ? (
        <p className="text-purple-600 text-xs text-center py-2">山札が空です</p>
      ) : (
        <div className="space-y-2">
          {isHost && (
            <button
              onClick={onGmReveal}
              className="w-full bg-purple-800/40 hover:bg-purple-700/40 border border-purple-700 text-purple-200 text-xs rounded-lg py-2.5 transition-colors"
            >
              GM: 山札から1枚全体公開
            </button>
          )}
          {!hasDrawn && (
            <button
              onClick={onPlayerDraw}
              className="w-full bg-[#2a1040]/50 hover:bg-[#3a1550]/50 border border-purple-800 text-purple-300 text-xs rounded-lg py-2.5 transition-colors"
            >
              山札から1枚引く（1回限り）
            </button>
          )}
          {hasDrawn && (
            <p className="text-center text-purple-600 text-xs py-1">このラウンドのドロー済み</p>
          )}
        </div>
      )}
    </div>
  )
}
