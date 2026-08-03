import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGame, joinGame, signIn } from '../services/firebase'

export default function HomePage() {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!playerName.trim()) { setError('お名前を入力してください'); return }
    setLoading(true)
    try {
      const uid = await signIn()
      const gameId = await createGame(uid, 5, 'normal', 3, 20, 10)
      navigate(`/lobby/${gameId}?uid=${uid}&name=${encodeURIComponent(playerName)}`)
    } catch (e) {
      setError('ゲームの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!playerName.trim()) { setError('お名前を入力してください'); return }
    if (!joinCode.trim()) { setError('ゲームコードを入力してください'); return }
    setLoading(true)
    try {
      const uid = await signIn()
      await joinGame(joinCode.toUpperCase(), uid, playerName, false)
      navigate(`/lobby/${joinCode.toUpperCase()}?uid=${uid}&name=${encodeURIComponent(playerName)}`)
    } catch (e) {
      setError('参加に失敗しました。コードを確認してください')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0a1a] flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-purple-200 tracking-wider mb-2"
            style={{ fontFamily: 'serif', textShadow: '0 0 30px rgba(167,139,250,0.5)' }}>
          紫苑館の秘密
        </h1>
        <p className="text-purple-400 text-sm tracking-widest">— 館に眠る嘘と真実 —</p>
      </div>

      <div className="w-full max-w-sm bg-[#1a0f2e] border border-purple-900 rounded-2xl p-6 shadow-xl">
        {/* Name input */}
        <div className="mb-5">
          <label className="block text-purple-300 text-xs mb-1 tracking-wide">あなたの名前</label>
          <input
            className="w-full bg-[#120a22] border border-purple-800 text-purple-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 placeholder:text-purple-700"
            placeholder="例: 田中太郎"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
          />
        </div>

        {/* Create game */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-purple-700 hover:bg-purple-600 active:bg-purple-800 disabled:opacity-50 text-white font-medium rounded-xl py-3 mb-3 transition-colors text-sm"
        >
          ゲームを作成する（GM）
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-purple-900" />
          <span className="text-purple-600 text-xs">または</span>
          <div className="flex-1 h-px bg-purple-900" />
        </div>

        {/* Join game */}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-[#120a22] border border-purple-800 text-purple-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 placeholder:text-purple-700 uppercase tracking-widest"
            placeholder="XXXXXX"
            maxLength={6}
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
          />
          <button
            onClick={handleJoin}
            disabled={loading}
            className="bg-[#2a1040] hover:bg-[#3a1550] active:bg-[#1a0a30] disabled:opacity-50 border border-purple-700 text-purple-200 font-medium rounded-xl px-4 py-2.5 transition-colors text-sm"
          >
            参加
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs mt-3 text-center">{error}</p>
        )}
      </div>

      <p className="text-purple-800 text-xs mt-6">5〜7人対応 · 対面プレイ推奨</p>
    </div>
  )
}
