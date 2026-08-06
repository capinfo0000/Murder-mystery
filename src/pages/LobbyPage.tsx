import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { subscribeGame, joinGame, startGame, setReady, renamePlayer } from '../services/firebase'
import type { GameState } from '../types/game'

export default function LobbyPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') ?? ''

  const navigate = useNavigate()
  const [game, setGame] = useState<GameState | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [startError, setStartError] = useState('')
  const joiningRef = useRef(false)

  useEffect(() => {
    if (!gameId) return
    return subscribeGame(gameId, setGame)
  }, [gameId])

  // Navigate when lobby phase ends
  useEffect(() => {
    if (game && game.phase !== 'lobby') {
      navigate(`/handout/${gameId}?uid=${uid}`, { replace: true })
    }
  }, [game, gameId, uid, navigate])

  // Auto-join with temp name when player not yet in game
  useEffect(() => {
    if (!game || !gameId || game.players?.[uid] || joiningRef.current) return
    joiningRef.current = true
    const humanCount = Object.values(game.players ?? {}).filter(p => !p.isNPC).length
    const tempName = `参加者${humanCount + 1}`
    joinGame(gameId, uid, tempName, false).finally(() => {
      joiningRef.current = false
    })
  }, [game, gameId, uid])

  if (!game) return <Loading />
  if (game.phase !== 'lobby') return null

  const isHost = game.hostId === uid
  const myPlayer = game.players?.[uid]
  const players = Object.entries(game.players ?? {})
  const humanPlayers = players.filter(([, p]) => !p.isNPC)
  const humanCount = humanPlayers.length

  const playingHumans = (game.hasGM && isHost)
    ? humanPlayers.filter(([pid]) => pid !== uid)
    : humanPlayers
  const allReady = playingHumans.every(([, p]) => p.isReady)

  const isDebug = game.playerCount < 4
  const canStart = (isDebug && !!myPlayer) || (!isDebug && allReady && humanCount >= 4)
  const startLabel = canStart ? 'ゲーム開始'
    : isDebug && !myPlayer ? '参加中…'
    : humanCount < 4 ? `あと${4 - humanCount}人必要`
    : 'プレイヤーの準備完了を待っています…'

  async function saveName() {
    const trimmed = nameInput.trim()
    if (trimmed && gameId) await renamePlayer(gameId, uid, trimmed)
    setEditingName(false)
  }

  return (
    <div className="min-h-screen bg-[#0f0a1a] px-4 py-8">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-200 tracking-wider" style={{ fontFamily: 'serif' }}>
            紫苑館の秘密
          </h2>
          <div className="mt-3 inline-flex items-center gap-3 bg-[#1a0f2e] border border-purple-700 rounded-xl px-5 py-2">
            <span className="text-purple-400 text-xs">ルームコード</span>
            <span className="text-purple-100 font-bold tracking-[0.25em] text-xl">{gameId}</span>
          </div>
          <p className="text-purple-600 text-xs mt-2">このコードを他のプレイヤーに共有してください</p>
        </div>

        {/* Settings summary (read-only) */}
        <div className="bg-[#1a0f2e] border border-purple-900 rounded-2xl px-4 py-3 mb-4 flex gap-4 text-xs text-purple-500 flex-wrap">
          <span>{game.playerCount}人</span>
          <span>{game.mode === 'normal' ? 'ノーマル' : game.mode === 'hard' ? 'ハード' : 'パズル'}</span>
          <span>{game.hasGM ? 'GMあり' : 'GMなし'}</span>
          <span>討議{game.roundDurationMinutes}分 × {game.totalRounds}R</span>
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
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${player.isReady ? 'bg-green-400' : 'bg-purple-700'}`} />

                <div className="flex-1 min-w-0">
                  {pid === uid && editingName ? (
                    <input
                      className="bg-[#120a22] border border-purple-600 text-purple-100 rounded px-2 py-0.5 text-sm w-full focus:outline-none focus:border-purple-400"
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onBlur={saveName}
                      onKeyDown={e => { if (e.key === 'Enter') saveName() }}
                      autoFocus
                      maxLength={20}
                    />
                  ) : (
                    <span className="text-purple-200 text-sm">
                      {player.name}
                      {player.isNPC && <span className="text-purple-600 text-xs ml-1">NPC</span>}
                      {pid === uid && <span className="text-purple-500 text-xs ml-1">（あなた）</span>}
                      {pid === game.hostId && (
                        <span className="text-purple-500 text-xs ml-1">{game.hasGM ? 'GM' : 'ホスト'}</span>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {player.isReady && !player.isNPC && (
                    <span className="text-green-400 text-xs">準備完了</span>
                  )}
                  {pid === uid && !editingName && (
                    <button
                      onClick={() => { setNameInput(player.name); setEditingName(true) }}
                      className="text-purple-600 hover:text-purple-400 text-xs px-1.5 py-0.5 rounded border border-purple-800 hover:border-purple-600 transition-colors"
                    >
                      変更
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, game.playerCount - humanCount) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-2 py-1 opacity-30">
                <div className="w-2 h-2 rounded-full bg-purple-900" />
                <span className="text-purple-600 text-sm">参加待ち…</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ready button */}
        {myPlayer && !myPlayer.isReady && !myPlayer.isNPC && !(isHost && game.hasGM) && (
          <button
            onClick={() => setReady(gameId!, uid)}
            className="w-full bg-[#2a1040] hover:bg-[#3a1550] border border-purple-700 text-purple-200 rounded-xl py-3 mb-3 text-sm transition-colors"
          >
            準備完了
          </button>
        )}

        {/* Start button (host only) */}
        {isHost && (
          <>
            <button
              onClick={async () => {
                setStartError('')
                try {
                  await startGame(gameId!, uid)
                } catch (e) {
                  setStartError(e instanceof Error ? e.message : 'ゲーム開始に失敗しました')
                }
              }}
              disabled={!canStart}
              className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-medium rounded-xl py-3 text-sm transition-colors"
            >
              {startLabel}
            </button>
            {startError && <p className="text-red-400 text-xs text-center mt-2">{startError}</p>}
          </>
        )}

        {!isHost && myPlayer?.isReady && (
          <p className="text-center text-purple-500 text-sm py-3">
            {game.hasGM ? 'GMのゲーム開始を待っています…' : 'ゲーム開始を待っています…'}
          </p>
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
