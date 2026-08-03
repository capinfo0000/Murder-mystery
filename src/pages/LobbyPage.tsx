import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { subscribeGame, advancePhase, setReady } from '../services/firebase'
import type { GameState } from '../types/game'

export default function LobbyPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') ?? ''

  const [game, setGame] = useState<GameState | null>(null)

  useEffect(() => {
    if (!gameId) return
    return subscribeGame(gameId, setGame)
  }, [gameId])

  const isHost = game?.hostId === uid
  const myPlayer = game?.players[uid]
  const players = Object.entries(game?.players ?? {})
  const humanCount = players.filter(([, p]) => !p.isNPC).length
  const allReady = humanCount > 0 && players.filter(([, p]) => !p.isNPC).every(([, p]) => p.isReady)

  if (!game) return <Loading />

  // redirect when game advances
  if (game.phase !== 'lobby') {
    window.location.href = `/handout/${gameId}?uid=${uid}`
    return null
  }

  return (
    <div className="min-h-screen bg-[#0f0a1a] px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-200 tracking-wider" style={{ fontFamily: 'serif' }}>
            紫苑館の秘密
          </h2>
          <div className="mt-2 inline-block bg-[#1a0f2e] border border-purple-700 rounded-lg px-4 py-1">
            <span className="text-purple-400 text-xs">ゲームコード　</span>
            <span className="text-purple-100 font-bold tracking-widest text-lg">{gameId}</span>
          </div>
        </div>

        {/* Player list */}
        <div className="bg-[#1a0f2e] border border-purple-900 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-purple-300 text-sm font-medium">参加者</h3>
            <span className="text-purple-500 text-xs">{humanCount} / {game.playerCount}人</span>
          </div>
          <div className="space-y-2">
            {players.map(([pid, player]) => (
              <div key={pid} className="flex items-center gap-2 py-1">
                <div className={`w-2 h-2 rounded-full ${player.isReady ? 'bg-green-400' : 'bg-purple-700'}`} />
                <span className="text-purple-200 text-sm flex-1">
                  {player.name}
                  {player.isNPC && <span className="text-purple-600 text-xs ml-1">NPC</span>}
                  {pid === uid && <span className="text-purple-500 text-xs ml-1">（あなた）</span>}
                  {pid === game.hostId && <span className="text-purple-500 text-xs ml-1">GM</span>}
                </span>
                {player.isReady && (
                  <span className="text-green-400 text-xs">準備完了</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Settings (GM only) */}
        {isHost && (
          <div className="bg-[#1a0f2e] border border-purple-900 rounded-2xl p-4 mb-4">
            <h3 className="text-purple-300 text-sm font-medium mb-3">ゲーム設定</h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-purple-400">
              <div>
                <span>プレイヤー数</span>
                <p className="text-purple-200 text-sm font-medium">{game.playerCount}人</p>
              </div>
              <div>
                <span>モード</span>
                <p className="text-purple-200 text-sm font-medium capitalize">{game.mode}</p>
              </div>
              <div>
                <span>ラウンド数</span>
                <p className="text-purple-200 text-sm font-medium">{game.totalRounds}ラウンド</p>
              </div>
              <div>
                <span>討議時間</span>
                <p className="text-purple-200 text-sm font-medium">{game.roundDurationMinutes}分/R</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {!myPlayer?.isReady && !myPlayer?.isNPC && (
          <button
            onClick={() => setReady(gameId!, uid)}
            className="w-full bg-[#2a1040] hover:bg-[#3a1550] border border-purple-700 text-purple-200 rounded-xl py-3 mb-3 text-sm transition-colors"
          >
            準備完了
          </button>
        )}

        {isHost && (
          <button
            onClick={() => advancePhase(gameId!, uid, 'handout')}
            disabled={!allReady}
            className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-medium rounded-xl py-3 text-sm transition-colors"
          >
            {allReady ? 'ゲーム開始' : `全員の準備完了を待っています…`}
          </button>
        )}

        {!isHost && myPlayer?.isReady && (
          <p className="text-center text-purple-500 text-sm py-3">GMのゲーム開始を待っています…</p>
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
