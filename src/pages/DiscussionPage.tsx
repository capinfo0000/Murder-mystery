import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  subscribeGame, advancePhase, shareCardWithAll, drawFromDeck,
} from '../services/firebase'
import type { GameState, GamePhase } from '../types/game'
import EvidenceCardView from '../components/EvidenceCard'
import DeckPanel from '../components/DeckPanel'
import SecretMessagePanel from '../components/SecretMessagePanel'
import ManorMap from '../components/ManorMap'

const PHASE_LABELS: Record<string, string> = {
  round1: 'ラウンド1 — 全体討議',
  secret_talk: '密談フェーズ',
  round2: 'ラウンド2 — 全体討議',
  round3: 'ラウンド3 — 全体討議',
}

const NEXT_PHASE: Record<string, GamePhase> = {
  round1: 'secret_talk',
  secret_talk: 'round2',
  round2: 'round3',
  round3: 'voting',
}

export default function DiscussionPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') ?? ''

  const navigate = useNavigate()
  const [game, setGame] = useState<GameState | null>(null)
  const [tab, setTab] = useState<'public' | 'hand' | 'deck' | 'secret'>('public')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    if (!gameId) return
    return subscribeGame(gameId, setGame)
  }, [gameId])

  useEffect(() => {
    if (!game) return
    if (game.phase === 'voting') navigate(`/vote/${gameId}?uid=${uid}`, { replace: true })
    else if (game.phase === 'result') navigate(`/result/${gameId}?uid=${uid}`, { replace: true })
    else if (!['round1', 'secret_talk', 'round2', 'round3'].includes(game.phase))
      navigate(`/handout/${gameId}?uid=${uid}`, { replace: true })
  }, [game, gameId, uid, navigate])

  // Timer
  useEffect(() => {
    if (!game?.roundStartAt) return
    const duration =
      game.phase === 'secret_talk'
        ? game.secretTalkDurationMinutes * 60
        : game.roundDurationMinutes * 60

    const tick = () => {
      const elapsed = Math.floor((Date.now() - game.roundStartAt!) / 1000)
      setTimeLeft(Math.max(0, duration - elapsed))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [game?.roundStartAt, game?.phase])

  const handleShareAll = useCallback(async (cardId: string) => {
    if (!gameId) return
    await shareCardWithAll(gameId, cardId)
  }, [gameId])

  const handleDraw = useCallback(async () => {
    if (!gameId) return
    await drawFromDeck(gameId, uid)
  }, [gameId, uid])

  const handleGmReveal = useCallback(async () => {
    if (!gameId) return
    // GM reveals one deck card publicly
    const deckCardIds = Object.entries(game?.cards ?? {})
      .filter(([, c]) => c.ownerId === 'deck')
      .map(([id]) => id)
    if (deckCardIds.length === 0) return
    const randomId = deckCardIds[Math.floor(Math.random() * deckCardIds.length)]
    await shareCardWithAll(gameId, randomId)
  }, [gameId, game])

  if (!game) return <Loading />

  if (!['round1', 'secret_talk', 'round2', 'round3'].includes(game.phase)) return null

  const isHost = game.hostId === uid
  const myPlayer = game.players[uid]
  const myCards = Object.values(game.cards ?? {}).filter(c => c.ownerId === uid)
  const publicCards = Object.values(game.cards ?? {}).filter(c => c.sharedWith.includes('all'))
  const deckCards = Object.values(game.cards ?? {}).filter(c => c.ownerId === 'deck')
  const hasDrawn = !!myPlayer?.hasDrawn

  const nextPhase = NEXT_PHASE[game.phase]
  const isSecretTalk = game.phase === 'secret_talk'

  const mins = timeLeft != null ? Math.floor(timeLeft / 60) : '--'
  const secs = timeLeft != null ? String(timeLeft % 60).padStart(2, '0') : '--'
  const timerColor = timeLeft != null && timeLeft < 60 ? 'text-red-400' : 'text-purple-200'

  return (
    <div className="min-h-screen bg-[#0f0a1a] pb-24">
      {showMap && <ManorMap onClose={() => setShowMap(false)} />}
      {/* Top bar */}
      <div className="bg-[#1a0f2e] border-b border-purple-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-purple-200 font-medium text-sm">
            {PHASE_LABELS[game.phase] ?? game.phase}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMap(true)}
              className="text-purple-400 hover:text-purple-200 text-sm px-2 py-0.5 rounded border border-purple-800 hover:border-purple-600 transition-colors"
            >
              🗺 マップ
            </button>
            <div className={`text-lg font-mono font-bold ${timerColor}`}>
              {mins}:{secs}
            </div>
          </div>
        </div>
        {isSecretTalk && (
          <p className="text-purple-500 text-xs mt-1">
            カードを送り合うか、対面で1対1の会話を行ってください
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-purple-900 bg-[#12091e] text-xs">
        {[
          { key: 'public', label: `公開 ${publicCards.length}枚` },
          { key: 'hand', label: `手札 ${myCards.length}枚` },
          { key: 'deck', label: `山札 ${deckCards.length}枚` },
          { key: 'secret', label: '密談' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex-1 py-2.5 font-medium transition-colors ${tab === key ? 'text-purple-200 border-b-2 border-purple-500' : 'text-purple-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {/* PUBLIC */}
        {tab === 'public' && (
          <>
            {publicCards.length === 0 ? (
              <p className="text-purple-600 text-sm text-center py-8">まだ公開されたカードがありません</p>
            ) : (
              publicCards.map(card => (
                <EvidenceCardView key={card.id} card={card} showActions={false} />
              ))
            )}
          </>
        )}

        {/* HAND */}
        {tab === 'hand' && (
          <>
            {myCards.length === 0 ? (
              <p className="text-purple-600 text-sm text-center py-8">手札がありません</p>
            ) : (
              myCards.map(card => (
                <EvidenceCardView
                  key={card.id}
                  card={card}
                  showActions
                  onShareAll={handleShareAll}
                  onSecretSend={() => setTab('secret')}
                />
              ))
            )}
          </>
        )}

        {/* DECK */}
        {tab === 'deck' && (
          <DeckPanel
            deckCards={deckCards}
            isHost={isHost}
            hasDrawn={hasDrawn}
            onGmReveal={handleGmReveal}
            onPlayerDraw={handleDraw}
          />
        )}

        {/* SECRET */}
        {tab === 'secret' && (
          <SecretMessagePanel
            game={game}
            gameId={gameId!}
            uid={uid}
            myCards={myCards}
          />
        )}
      </div>

      {/* Bottom bar (GM only) */}
      {isHost && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a0f2e] border-t border-purple-900 px-4 py-3">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => advancePhase(gameId!, uid, nextPhase)}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-xl py-3 text-sm"
            >
              {nextPhase === 'voting' ? '投票フェーズへ' : `${PHASE_LABELS[nextPhase] ?? nextPhase}へ進む`}
            </button>
          </div>
        </div>
      )}
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
