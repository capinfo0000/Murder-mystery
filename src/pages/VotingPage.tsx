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
  const [selectedSlot, setSelectedSlot] = useState<CharacterSlot | null>(null)
  const [accuseAll, setAccuseAll] = useState(false)
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
  const mySlot = game.players[uid]?.characterSlot
  const scenario = game.scenario!
  const suspectSlots = Object.keys(scenario.roles) as CharacterSlot[]
  const myVote = game.votes?.[uid]
  const totalVoters = Object.values(game.players).filter(p => !p.isNPC).length
  const totalVoted = Object.values(game.votes ?? {}).length

  async function handleSubmit() {
    const vote: VoteData = { targetSlot: selectedSlot, accuseAll }
    await submitVote(gameId!, uid, vote)
    setSubmitted(true)
  }

  async function handleFinalize() {
    await finalizeResult(gameId!, uid)
  }

  const allVoted = totalVoted >= totalVoters

  return (
    <div className="min-h-screen bg-[#0f0a1a] pb-24">
      <div className="bg-[#1a0f2e] border-b border-purple-900 px-4 py-3">
        <h2 className="text-purple-200 font-bold text-lg" style={{ fontFamily: 'serif' }}>投票フェーズ</h2>
        <p className="text-purple-500 text-xs mt-0.5">犯人と思う人物を選んでください（一発勝負）</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
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
            {/* Suspect grid — all character slots including NPCs and self */}
            <div className="grid grid-cols-2 gap-2">
              {suspectSlots.map(slot => {
                const char = CHARACTERS[slot]
                if (!char) return null
                const selected = selectedSlot === slot
                const isSelf = slot === mySlot
                return (
                  <button
                    key={slot}
                    onClick={() => { setSelectedSlot(slot); setAccuseAll(false) }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-red-500 bg-red-900/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                        : 'border-purple-900 bg-[#1a0f2e] hover:border-purple-700'
                    }`}
                  >
                    <div className="text-purple-500 text-xs">
                      {slot}枠{isSelf && <span className="ml-1 text-purple-600">（自分）</span>}
                    </div>
                    <div className="text-purple-100 text-sm font-medium mt-0.5">{char.name}</div>
                    <div className="text-purple-500 text-xs mt-0.5">{char.role}</div>
                    {selected && <div className="text-red-400 text-xs mt-1">← 選択中</div>}
                  </button>
                )
              })}
            </div>

            {/* No suspect option */}
            <div
              onClick={() => { setSelectedSlot(null); setAccuseAll(false) }}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                !selectedSlot && !accuseAll
                  ? 'border-purple-600 bg-purple-900/20'
                  : 'border-purple-900 bg-[#1a0f2e] hover:border-purple-700'
              }`}
            >
              <div className="text-purple-300 text-sm font-medium">? 犯人不明</div>
              <div className="text-purple-600 text-xs mt-0.5">
                この中に犯人がいないと判断する場合に選択
              </div>
            </div>

            {/* Accuse all option (complete innocents only) */}
            <div
              onClick={() => { setAccuseAll(a => !a); setSelectedSlot(null) }}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                accuseAll
                  ? 'border-amber-500 bg-amber-900/20'
                  : 'border-purple-900 bg-[#1a0f2e] hover:border-purple-700'
              }`}
            >
              <div className="text-amber-300 text-sm font-medium">⚡ 全員悪人告発</div>
              <div className="text-purple-500 text-xs mt-0.5">
                自分以外の全員が犯人・秘密持ちだと確信する場合のみ選択（+7点ボーナス）
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl py-3 text-sm tracking-wide transition-colors"
            >
              {selectedSlot ? 'この人物を告発する' : accuseAll ? '全員を告発する' : '犯人不明で投票する'}
            </button>
          </>
        ) : (
          <div className="bg-[#1a0f2e] border border-green-800 rounded-xl p-4 text-center">
            <div className="text-green-400 text-lg mb-1">✓ 投票完了</div>
            {myVote?.targetSlot ? (
              <p className="text-purple-300 text-sm">
                {CHARACTERS[myVote.targetSlot]?.name ?? myVote.targetSlot} を告発しました
              </p>
            ) : myVote?.accuseAll ? (
              <p className="text-amber-300 text-sm">全員悪人告発を宣言しました</p>
            ) : (
              <p className="text-purple-400 text-sm">犯人不明で投票しました</p>
            )}
            <p className="text-purple-600 text-xs mt-2">他のプレイヤーの投票を待っています…</p>
          </div>
        )}

        {/* GM finalize */}
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

function Loading() {
  return (
    <div className="min-h-screen bg-[#0f0a1a] flex items-center justify-center">
      <div className="text-purple-400 text-sm animate-pulse">読み込み中…</div>
    </div>
  )
}
