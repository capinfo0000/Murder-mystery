import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { subscribeGame, joinGame, startGame, setReady, updateGameSettings } from '../services/firebase'
import type { GameState, GameMode } from '../types/game'

export default function LobbyPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') ?? ''

  const [game, setGame] = useState<GameState | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (!gameId) return
    return subscribeGame(gameId, setGame)
  }, [gameId])

  const isHost = game?.hostId === uid
  const myPlayer = game?.players?.[uid]
  const players = Object.entries(game?.players ?? {})
  const humanPlayers = players.filter(([, p]) => !p.isNPC)
  const humanCount = humanPlayers.length
  const allReady = humanCount > 0 && humanPlayers.every(([, p]) => p.isReady)

  if (!game) return <Loading />

  if (game.phase !== 'lobby') {
    window.location.href = `/handout/${gameId}?uid=${uid}`
    return null
  }

  async function handleJoin() {
    if (!nameInput.trim()) { setNameError('お名前を入力してください'); return }
    if (!gameId) return
    setJoining(true)
    try {
      await joinGame(gameId, uid, nameInput.trim(), false)
    } catch {
      setNameError('参加に失敗しました')
    } finally {
      setJoining(false)
    }
  }

  async function handleStart() {
    if (!gameId) return
    await startGame(gameId, uid)
  }

  async function handleSettingChange(key: string, value: unknown) {
    if (!gameId) return
    await updateGameSettings(gameId, uid, { [key]: value })
  }

  const canStart = allReady && humanCount >= (game.hasGM ? 1 : 4)
  const startLabel = !allReady
    ? '全員の準備完了を待っています…'
    : humanCount < 4 && !game.hasGM
    ? `あと${4 - humanCount}人必要です（GMなしは最低4人）`
    : 'ゲーム開始'

  // Name entry screen for players not yet in the room
  if (!myPlayer) {
    return (
      <div className="min-h-screen bg-[#0f0a1a] flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-purple-200 tracking-wider" style={{ fontFamily: 'serif' }}>
            紫苑館の秘密
          </h2>
          <div className="mt-2 inline-block bg-[#1a0f2e] border border-purple-700 rounded-lg px-4 py-1">
            <span className="text-purple-400 text-xs">ルームコード　</span>
            <span className="text-purple-100 font-bold tracking-widest text-lg">{gameId}</span>
          </div>
        </div>
        <div className="w-full max-w-sm bg-[#1a0f2e] border border-purple-900 rounded-2xl p-6 shadow-xl">
          <label className="block text-purple-300 text-xs mb-1 tracking-wide">あなたの名前</label>
          <input
            className="w-full bg-[#120a22] border border-purple-800 text-purple-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 placeholder:text-purple-700 mb-4"
            placeholder="例: 田中太郎"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoFocus
          />
          {nameError && <p className="text-red-400 text-xs mb-3 text-center">{nameError}</p>}
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition-colors text-sm"
          >
            {joining ? '参加中…' : 'ルームに参加'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0a1a] px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-200 tracking-wider" style={{ fontFamily: 'serif' }}>
            紫苑館の秘密
          </h2>
          <div className="mt-2 inline-block bg-[#1a0f2e] border border-purple-700 rounded-lg px-4 py-1">
            <span className="text-purple-400 text-xs">ルームコード　</span>
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
                  {pid === game.hostId && !game.hasGM && (
                    <span className="text-purple-500 text-xs ml-1">ホスト</span>
                  )}
                  {pid === game.hostId && game.hasGM && (
                    <span className="text-purple-500 text-xs ml-1">GM</span>
                  )}
                </span>
                {player.isReady && !player.isNPC && (
                  <span className="text-green-400 text-xs">準備完了</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Settings (host only) */}
        {isHost && (
          <div className="bg-[#1a0f2e] border border-purple-900 rounded-2xl p-4 mb-4">
            <h3 className="text-purple-300 text-sm font-medium mb-3">ゲーム設定</h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-purple-500 text-xs block mb-1">プレイヤー数</label>
                <select
                  value={game.playerCount}
                  onChange={e => handleSettingChange('playerCount', Number(e.target.value))}
                  className="w-full bg-[#120a22] border border-purple-800 text-purple-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                >
                  {[4, 5, 6, 7].map(n => (
                    <option key={n} value={n}>{n}人</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-purple-500 text-xs block mb-1">モード</label>
                <select
                  value={game.mode}
                  onChange={e => handleSettingChange('mode', e.target.value as GameMode)}
                  className="w-full bg-[#120a22] border border-purple-800 text-purple-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="normal">ノーマル</option>
                  <option value="hard">ハード</option>
                  <option value="puzzle">パズル</option>
                </select>
              </div>

              <div>
                <label className="text-purple-500 text-xs block mb-1">討議時間</label>
                <select
                  value={game.roundDurationMinutes}
                  onChange={e => handleSettingChange('roundDurationMinutes', Number(e.target.value))}
                  className="w-full bg-[#120a22] border border-purple-800 text-purple-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                >
                  {[10, 15, 20, 25, 30].map(n => (
                    <option key={n} value={n}>{n}分</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-purple-500 text-xs block mb-1">GMあり</label>
                <button
                  onClick={() => handleSettingChange('hasGM', !game.hasGM)}
                  className={`w-full rounded-lg py-1.5 text-sm font-medium transition-colors border ${
                    game.hasGM
                      ? 'bg-purple-700 border-purple-600 text-white'
                      : 'bg-[#120a22] border-purple-800 text-purple-400'
                  }`}
                >
                  {game.hasGM ? 'GMあり' : 'GMなし'}
                </button>
              </div>
            </div>

            {!game.hasGM && humanCount < 4 && (
              <p className="text-yellow-600 text-xs">
                GMなしモードは最低4人必要です（現在{humanCount}人）
              </p>
            )}
          </div>
        )}

        {/* Ready button (non-host players, or host in GMなし mode) */}
        {!myPlayer.isReady && !myPlayer.isNPC && !(isHost && game.hasGM) && (
          <button
            onClick={() => setReady(gameId!, uid)}
            className="w-full bg-[#2a1040] hover:bg-[#3a1550] border border-purple-700 text-purple-200 rounded-xl py-3 mb-3 text-sm transition-colors"
          >
            準備完了
          </button>
        )}

        {/* Start button (host only) */}
        {isHost && (
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-medium rounded-xl py-3 text-sm transition-colors"
          >
            {startLabel}
          </button>
        )}

        {!isHost && myPlayer.isReady && (
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
