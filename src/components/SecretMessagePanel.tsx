import { useState } from 'react'
import type { EvidenceCard, GameState } from '../types/game'
import { sendCardToPlayer, markMessageRead } from '../services/firebase'
import EvidenceCardView from './EvidenceCard'

interface Props {
  game: GameState
  gameId: string
  uid: string
  myCards: EvidenceCard[]
}

export default function SecretMessagePanel({ game, gameId, uid, myCards }: Props) {
  const [view, setView] = useState<'send' | 'inbox'>('inbox')
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const otherPlayers = Object.entries(game.players).filter(
    ([pid, p]) => pid !== uid && !p.isNPC
  )

  const inbox = Object.entries(game.secretMessages ?? {}).filter(
    ([, msg]) => msg.toPlayerId === uid
  )
  const unread = inbox.filter(([, msg]) => !msg.read).length

  function toggleCard(cardId: string) {
    setSelectedCardIds(ids =>
      ids.includes(cardId) ? ids.filter(id => id !== cardId) : [...ids, cardId]
    )
  }

  async function handleSend() {
    if (!selectedTarget || selectedCardIds.length === 0) return
    setSending(true)
    try {
      await sendCardToPlayer(gameId, uid, selectedTarget, selectedCardIds, note)
      setSent(true)
      setSelectedCardIds([])
      setNote('')
      setTimeout(() => setSent(false), 2000)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-[#1a0f2e] border border-purple-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-purple-900">
        <button
          onClick={() => setView('inbox')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${view === 'inbox' ? 'text-purple-200 bg-purple-950/50' : 'text-purple-600'}`}
        >
          受信
          {unread > 0 && (
            <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unread}</span>
          )}
        </button>
        <button
          onClick={() => setView('send')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${view === 'send' ? 'text-purple-200 bg-purple-950/50' : 'text-purple-600'}`}
        >
          密談送信
        </button>
      </div>

      {/* INBOX */}
      {view === 'inbox' && (
        <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
          {inbox.length === 0 ? (
            <p className="text-purple-600 text-xs text-center py-4">受信メッセージなし</p>
          ) : (
            inbox.map(([msgId, msg]) => {
              const senderName = game.players[msg.fromPlayerId]?.name ?? '不明'
              const sentCards = msg.cardIds.map(id => game.cards?.[id]).filter(Boolean) as EvidenceCard[]
              return (
                <div
                  key={msgId}
                  className={`rounded-lg p-3 border ${msg.read ? 'border-purple-900/50' : 'border-purple-600'}`}
                  onClick={() => markMessageRead(gameId, msgId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-300 text-xs font-medium">{senderName} から</span>
                    {!msg.read && <span className="text-purple-400 text-[10px] bg-purple-900/50 px-1.5 py-0.5 rounded">未読</span>}
                  </div>
                  {msg.note && (
                    <p className="text-purple-400 text-xs mb-2 italic">"{msg.note}"</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {sentCards.map(card => (
                      <EvidenceCardView key={card.id} card={card} showActions={false} />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* SEND */}
      {view === 'send' && (
        <div className="p-3 space-y-3">
          <div>
            <label className="text-purple-400 text-xs mb-1 block">送り先</label>
            <select
              value={selectedTarget}
              onChange={e => setSelectedTarget(e.target.value)}
              className="w-full bg-[#120a22] border border-purple-800 text-purple-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
            >
              <option value="">選択してください</option>
              {otherPlayers.map(([pid, p]) => (
                <option key={pid} value={pid}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-purple-400 text-xs mb-1 block">見せるカード（複数可）</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {myCards.map(card => (
                <div
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  className={`rounded-lg p-2.5 border cursor-pointer transition-colors text-xs ${
                    selectedCardIds.includes(card.id)
                      ? 'border-purple-500 bg-purple-900/30 text-purple-200'
                      : 'border-purple-900 text-purple-500 hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedCardIds.includes(card.id) ? 'bg-purple-600 border-purple-500' : 'border-purple-700'}`}>
                      {selectedCardIds.includes(card.id) && <span className="text-white text-[10px]">✓</span>}
                    </span>
                    <span className="line-clamp-1">{card.content}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-purple-400 text-xs mb-1 block">ひとこと（任意）</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-[#120a22] border border-purple-800 text-purple-200 rounded-lg px-3 py-2 text-xs focus:outline-none placeholder:text-purple-700"
              placeholder="密談のメモ…"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!selectedTarget || selectedCardIds.length === 0 || sending}
            className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs rounded-lg py-2.5 font-medium transition-colors"
          >
            {sent ? '送信しました ✓' : sending ? '送信中…' : `${selectedCardIds.length}枚のカードを送信`}
          </button>
        </div>
      )}
    </div>
  )
}
