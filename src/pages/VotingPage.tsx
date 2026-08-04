import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { subscribeGame, submitVote, finalizeResult } from '../services/firebase'
import type { CharacterSlot, GameState, VoteData } from '../types/game'
import { CHARACTERS } from '../data/characters'

export default function VotingPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') ?? ''

  const navigate = useNavigate()
  const [game, setGame] = useState<GameState | null>(null)
  const [killerSlots, setKillerSlots] = useState<CharacterSlot[]>([])
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!gameId) return
    return subscribeGame(gameId, setGame)
  }, [gameId])

  useEffect(() => {
    if (game?.phase === 'result') navigate(`/result/${gameId}?uid=${uid}`, { replace: true })
  }, [game, gameId, uid, navigate])

  if (!game) return <Loading />
  if (game.phase === 'result') return null

  const isHost = game.hostId === uid
  const scenario = game.scenario!
  const allSlots = Object.keys(scenario.roles) as CharacterSlot[]
  const victimSlots = scenario.victims.map(v => v.slot)
  const myVote = game.votes?.[uid]
  const totalVoters = Object.values(game.players).filter(p => !p.isNPC).length
  const totalVoted = Object.values(game.votes ?? {}).length
  const allVoted = totalVoted >= totalVoters

  function toggleKiller(slot: CharacterSlot) {
    setKillerSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    )
  }

  async function handleSubmit() {
    const vote: VoteData = { killerSlots }
    await submitVote(gameId!, uid, vote)
    setSubmitted(true)
  }

  async function handleFinalize() {
    await finalizeResult(gameId!, uid)
  }

  return (
    <div className="min-h-screen bg-[#0f0a1a] pb-24">
      <div className="bg-[#1a0f2e] border-b border-purple-900 px-4 py-3">
        <h2 className="text-purple-200 font-bold text-lg" style={{ fontFamily: 'serif' }}>投票フェーズ</h2>
        <p className="text-purple-500 text-xs mt-0.5">犯人と思う人物をチェックしてください（複数可・不明なら空欄）</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Vote progress */}
        <div className="bg-[#1a0f2e] border border-purple-900 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-purple-400 text-xs">投票状況</span>
            <span className="text-purple-200 text-sm font-medium">{totalVoted} / {totalVoters}人</span>
          </div>
          <div className="mt-2 h-1.5 bg-purple-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all"
              style={{ width: `${totalVoters > 0 ? (totalVoted / totalVoters) * 100 : 0}%` }}
            />
          </div>
        </div>

        {!submitted && !myVote ? (
          <>
            <section>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <h3 className="text-red-300 text-sm font-medium">犯人候補</h3>
              </div>
              <p className="text-purple-600 text-xs mb-3 pl-4">外部犯と思う場合は誰もチェックしない</p>
              <div className="grid grid-cols-2 gap-2">
                {allSlots.map(slot => (
                  <CheckCard
                    key={slot}
                    slot={slot}
                    checked={killerSlots.includes(slot)}
                    isVictim={victimSlots.includes(slot)}
                    onToggle={() => toggleKiller(slot)}
                  />
                ))}
              </div>
            </section>

            <button
              onClick={handleSubmit}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl py-3 text-sm tracking-wide transition-colors"
            >
              {killerSlots.length === 0 ? '外部犯で投票する' : '投票する'}
            </button>
          </>
        ) : (
          <div className="bg-[#1a0f2e] border border-green-800 rounded-xl p-4 space-y-3">
            <div className="text-green-400 text-lg text-center">✓ 投票完了</div>
            {(myVote?.killerSlots?.length ?? 0) > 0 ? (
              <div>
                <p className="text-red-400 text-xs mb-1">犯人として告発:</p>
                <p className="text-purple-200 text-sm">
                  {myVote!.killerSlots.map(s => CHARACTERS[s]?.name ?? s).join('、')}
                </p>
              </div>
            ) : (
              <p className="text-purple-400 text-sm text-center">外部犯で投票しました</p>
            )}
            <p className="text-purple-600 text-xs text-center">他のプレイヤーの投票を待っています…</p>
          </div>
        )}

        {isHost && allVoted && (
          <button
            onClick={handleFinalize}
            className="w-full bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-xl py-3 text-sm"
          >
            結果を公開する
          </button>
        )}
      </div>
    </div>
  )
}

function CheckCard({
  slot,
  checked,
  isVictim,
  onToggle,
}: {
  slot: CharacterSlot
  checked: boolean
  isVictim: boolean
  onToggle: () => void
}) {
  const char = CHARACTERS[slot]
  if (!char) return null

  return (
    <button
      onClick={onToggle}
      className={`p-3 rounded-xl border text-left transition-all ${
        checked
          ? 'border-red-500 bg-red-900/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
          : 'border-purple-900 bg-[#1a0f2e] hover:border-purple-700'
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-purple-500 text-xs">{slot}枠</span>
            {isVictim && (
              <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-800 rounded px-1">死亡</span>
            )}
          </div>
          <div className="text-purple-100 text-sm font-medium mt-0.5 truncate">{char.name}</div>
          <div className="text-purple-500 text-xs mt-0.5 truncate">{char.role}</div>
        </div>
        <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-colors ${
          checked ? 'bg-red-500 border-transparent' : 'border-purple-700'
        }`}>
          {checked && <span className="text-white text-xs font-bold">✓</span>}
        </div>
      </div>
    </button>
  )
}

function Loading() {
  return (
    <div className="min-h-screen bg-[#0f0a1a] flex items-center justify-center">
      <div className="text-purple-400 text-sm animate-pulse">読み込み中…</div>
    </div>
  )
}
