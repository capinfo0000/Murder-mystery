import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGame, signIn } from '../services/firebase'
type Step = 'home' | 'settings'

export default function HomePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('home')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Settings
  const [playerCount, setPlayerCount] = useState(5)
  const [hasGM, setHasGM] = useState(false)
  const [roundDurationMinutes, setRoundDurationMinutes] = useState(20)
  const [totalRounds, setTotalRounds] = useState(3)

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const uid = await signIn()
      const gameId = await createGame(uid, { playerCount, hasGM, roundDurationMinutes, totalRounds })
      navigate(`/lobby/${gameId}?uid=${uid}`)
    } catch {
      setError('ゲームの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) { setError('ゲームコードを入力してください'); return }
    setLoading(true)
    setError('')
    try {
      const uid = await signIn()
      navigate(`/lobby/${joinCode.toUpperCase()}?uid=${uid}`)
    } catch {
      setError('参加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'settings') {
    return (
      <div className="min-h-screen bg-[#0f0a1a] flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-200 tracking-wider" style={{ fontFamily: 'serif' }}>
            紫苑館の秘密
          </h1>
          <p className="text-purple-500 text-xs mt-1 tracking-widest">ゲーム設定</p>
        </div>

        <div className="w-full max-w-sm bg-[#1a0f2e] border border-purple-900 rounded-2xl p-6 shadow-xl space-y-5">

          {/* Player count */}
          <div>
            <label className="text-purple-400 text-xs block mb-1">プレイヤー数</label>
            <p className="text-purple-700 text-xs mb-2">GMは含まない人数</p>
            <div className="grid grid-cols-4 gap-2 mb-1">
              {[4, 5, 6, 7].map(n => (
                <button
                  key={n}
                  onClick={() => setPlayerCount(n)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                    playerCount === n
                      ? 'bg-purple-700 border-purple-500 text-white'
                      : 'bg-[#120a22] border-purple-800 text-purple-400 hover:border-purple-600'
                  }`}
                >
                  {n}人
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setPlayerCount(n)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    playerCount === n
                      ? 'bg-purple-900 border-purple-600 text-purple-300'
                      : 'bg-[#0d0820] border-purple-900 text-purple-700 hover:border-purple-800'
                  }`}
                >
                  {n}人 🔧
                </button>
              ))}
            </div>
          </div>

          {/* GM */}
          <div>
            <label className="text-purple-400 text-xs block mb-2">ゲームマスター</label>
            <div className="grid grid-cols-2 gap-2">
              {[false, true].map(v => (
                <button
                  key={String(v)}
                  onClick={() => setHasGM(v)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                    hasGM === v
                      ? 'bg-purple-700 border-purple-500 text-white'
                      : 'bg-[#120a22] border-purple-800 text-purple-400 hover:border-purple-600'
                  }`}
                >
                  {v ? 'GMあり' : 'GMなし'}
                </button>
              ))}
            </div>
          </div>

          {/* Discussion time */}
          <div>
            <label className="text-purple-400 text-xs block mb-2">討議時間（1ラウンド）</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[10, 15, 20, 25, 30].map(n => (
                <button
                  key={n}
                  onClick={() => setRoundDurationMinutes(n)}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors border ${
                    roundDurationMinutes === n
                      ? 'bg-purple-700 border-purple-500 text-white'
                      : 'bg-[#120a22] border-purple-800 text-purple-400 hover:border-purple-600'
                  }`}
                >
                  {n}分
                </button>
              ))}
            </div>
          </div>

          {/* Total rounds */}
          <div>
            <label className="text-purple-400 text-xs block mb-2">ラウンド数</label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setTotalRounds(n)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                    totalRounds === n
                      ? 'bg-purple-700 border-purple-500 text-white'
                      : 'bg-[#120a22] border-purple-800 text-purple-400 hover:border-purple-600'
                  }`}
                >
                  {n}ラウンド
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setStep('home'); setError('') }}
              className="flex-1 bg-[#120a22] hover:bg-[#1a0f2e] border border-purple-800 text-purple-400 font-medium rounded-xl py-3 text-sm transition-colors"
            >
              戻る
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-[2] bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-colors"
            >
              {loading ? '作成中…' : 'ルームを作成'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0a1a] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-purple-200 tracking-wider mb-2"
            style={{ fontFamily: 'serif', textShadow: '0 0 30px rgba(167,139,250,0.5)' }}>
          紫苑館の秘密
        </h1>
        <p className="text-purple-400 text-sm tracking-widest">— 館に眠る嘘と真実 —</p>
      </div>

      <div className="w-full max-w-sm bg-[#1a0f2e] border border-purple-900 rounded-2xl p-6 shadow-xl">
        <button
          onClick={() => setStep('settings')}
          disabled={loading}
          className="w-full bg-purple-700 hover:bg-purple-600 active:bg-purple-800 disabled:opacity-50 text-white font-medium rounded-xl py-3 mb-4 transition-colors"
        >
          新規作成
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-purple-900" />
          <span className="text-purple-600 text-xs">または</span>
          <div className="flex-1 h-px bg-purple-900" />
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 bg-[#120a22] border border-purple-800 text-purple-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 placeholder:text-purple-700 uppercase tracking-widest"
            placeholder="ルームコード"
            maxLength={6}
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
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

      <p className="text-purple-800 text-xs mt-6">4〜7人対応 · 対面プレイ推奨 · 🔧 1〜3人はデバッグ用</p>
    </div>
  )
}
