import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { subscribeGame, advancePhase, setReady } from '../services/firebase'
import type { GameState, CharacterSlot } from '../types/game'
import { CHARACTERS } from '../data/characters'
import { LOCATION_NAMES } from '../data/locations'
import AlibiMatrix from '../components/AlibiMatrix'
import EvidenceCardView from '../components/EvidenceCard'

const ROUND1_PHASE = 'round1'

export default function HandoutPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') ?? ''

  const navigate = useNavigate()
  const [game, setGame] = useState<GameState | null>(null)
  const [tab, setTab] = useState<'character' | 'alibi' | 'cards'>('character')

  useEffect(() => {
    if (!gameId) return
    return subscribeGame(gameId, setGame)
  }, [gameId])

  useEffect(() => {
    if (game && game.phase !== 'handout') {
      navigate(`/game/${gameId}?uid=${uid}`, { replace: true })
    }
  }, [game, gameId, uid, navigate])

  if (!game) return <Loading />

  if (game.phase !== 'handout') return null

  const myPlayer = game.players[uid]
  const mySlot = myPlayer?.characterSlot
  if (!mySlot) return <Loading />

  const char = CHARACTERS[mySlot]
  const scenario = game.scenario!
  const myRole = scenario.roles[mySlot]
  const myKillerInfo = scenario.killers.find(k => k.slot === mySlot)
  const myAlibis = scenario.alibis[mySlot]
  const myCards = Object.values(game.cards || {}).filter(c => c.ownerId === uid)
  const isHost = game.hostId === uid

  const allReady = Object.values(game.players).filter(p => !p.isNPC).every(p => p.isReady)

  // Relationship list from character definition
  const relationships = Object.entries(char.relationships ?? {}) as [CharacterSlot, string][]

  return (
    <div className="min-h-screen bg-[#0f0a1a] pb-24">
      {/* Top bar */}
      <div className="bg-[#1a0f2e] border-b border-purple-900 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-purple-400 text-xs">{char.slot}枠</span>
          <h2 className="text-purple-100 font-bold text-lg leading-tight" style={{ fontFamily: 'serif' }}>{char.name}</h2>
          <span className="text-purple-500 text-xs">{char.role}</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${myRole === 'killer' ? 'bg-red-900/50 text-red-300 border border-red-800' : 'bg-purple-900/50 text-purple-300 border border-purple-800'}`}>
          {myRole === 'killer' ? '🔪 犯人' : '👁 無実'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-purple-900 bg-[#12091e]">
        {(['character', 'alibi', 'cards'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === t ? 'text-purple-200 border-b-2 border-purple-500' : 'text-purple-600 hover:text-purple-400'}`}
          >
            {t === 'character' ? 'キャラクター' : t === 'alibi' ? 'アリバイ' : 'カード'}
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* CHARACTER tab */}
        {tab === 'character' && (
          <div className="space-y-4">
            <Section title="背景">
              <p className="text-purple-200 text-sm leading-relaxed">{char.background}</p>
            </Section>
            <Section title="あなただけの秘密（誰にも言わないこと）">
              <p className="text-amber-200 text-sm leading-relaxed">{char.secretAction}</p>
            </Section>
            {myRole === 'killer' && myKillerInfo && (
              <Section title="🔪 あなたが行った凶行（厳重に秘密）" accent="red">
                <div className="space-y-2 text-sm">
                  <Row label="被害者" value={`${myKillerInfo.victimSlot}枠 — ${CHARACTERS[myKillerInfo.victimSlot]?.name ?? '？'}`} />
                  <Row label="凶器" value={myKillerInfo.weapon.name} />
                  <Row label="凶行場所" value={LOCATION_NAMES[myKillerInfo.location]} />
                  <Row label="偽装死因" value={myKillerInfo.weapon.disguisedAs} />
                  <Row label="時刻" value="T2（21:00〜22:00頃）" />
                </div>
              </Section>
            )}
            <Section title="あなたが知る関係図">
              {relationships.length === 0 ? (
                <p className="text-purple-500 text-sm">関係情報なし</p>
              ) : (
                <div className="space-y-2">
                  {relationships.map(([slot, desc]) => (
                    <div key={slot} className="flex gap-2">
                      <span className="text-purple-500 text-xs w-16 shrink-0">
                        {CHARACTERS[slot]?.name ?? slot}枠
                      </span>
                      <span className="text-purple-300 text-sm">{desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}

        {/* ALIBI tab */}
        {tab === 'alibi' && (
          <div className="space-y-4">
            <p className="text-purple-400 text-xs leading-relaxed bg-purple-950/50 rounded-lg p-3 border border-purple-900">
              これはあなただけが知っている真実のアリバイです。
              <br />秘密を守るため、どこまで正直に話すかはあなた次第です。
            </p>
            {myAlibis && <AlibiMatrix alibis={myAlibis} />}
          </div>
        )}

        {/* CARDS tab */}
        {tab === 'cards' && (
          <div className="space-y-3">
            <p className="text-purple-400 text-xs bg-purple-950/50 rounded-lg p-3 border border-purple-900">
              あなたの手札カードです。討議フェーズで公開・密談送信できます。
            </p>
            {myCards.length === 0 ? (
              <p className="text-purple-600 text-sm text-center py-8">カードがありません</p>
            ) : (
              myCards.map(card => (
                <EvidenceCardView key={card.id} card={card} showActions={false} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a0f2e] border-t border-purple-900 px-4 py-3">
        <div className="max-w-md mx-auto">
          {!myPlayer?.isReady ? (
            <button
              onClick={() => setReady(gameId!, uid)}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-xl py-3 text-sm"
            >
              内容を確認した（準備完了）
            </button>
          ) : isHost && allReady ? (
            <button
              onClick={() => advancePhase(gameId!, uid, ROUND1_PHASE as any)}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-xl py-3 text-sm"
            >
              討議フェーズ開始
            </button>
          ) : (
            <p className="text-center text-purple-500 text-sm py-2">
              {isHost ? '全員の準備完了を待っています…' : 'GMの開始を待っています…'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, accent = 'purple' }: { title: string; children: React.ReactNode; accent?: string }) {
  const border = accent === 'red' ? 'border-red-900' : 'border-purple-900'
  const titleColor = accent === 'red' ? 'text-red-300' : 'text-purple-300'
  return (
    <div className={`bg-[#1a0f2e] border ${border} rounded-xl p-4`}>
      <h3 className={`${titleColor} text-xs font-medium mb-2 tracking-wide`}>{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-red-400/70 text-xs w-20 shrink-0">{label}</span>
      <span className="text-red-200 text-xs">{value}</span>
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
