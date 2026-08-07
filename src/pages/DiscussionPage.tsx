import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  subscribeGame, advancePhase, shareCardWithAll, drawFromDeck,
} from '../services/firebase'
import type { GameState, GamePhase, CharacterSlot } from '../types/game'
import { CHARACTERS, MAIN_VICTIM } from '../data/characters'
import { LOCATION_NAMES } from '../data/locations'
import EvidenceCardView from '../components/EvidenceCard'
import DeckPanel from '../components/DeckPanel'
import SecretMessagePanel from '../components/SecretMessagePanel'
import ManorMap from '../components/ManorMap'
import AlibiMatrix from '../components/AlibiMatrix'

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
  const [showProfile, setShowProfile] = useState(false)
  const [activeViewSlot, setActiveViewSlot] = useState<CharacterSlot | null>(null)

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
  const isDebug = game.playerCount < 4
  const scenario = game.scenario
  const allSlots = scenario ? Object.keys(scenario.roles) as CharacterSlot[] : []
  const mySlot = myPlayer?.characterSlot
  const viewSlot: CharacterSlot | null = (isDebug && activeViewSlot) ? activeViewSlot : (mySlot ?? null)
  const viewUid = viewSlot
    ? (Object.entries(game.players).find(([, p]) => p.characterSlot === viewSlot)?.[0] ?? uid)
    : uid
  const myCards = Object.values(game.cards ?? {}).filter(c => c.ownerId === viewUid)
  const publicCards = Object.values(game.cards ?? {}).filter(c => (c.sharedWith ?? []).includes('all'))
  const deckCards = Object.values(game.cards ?? {}).filter(c => c.ownerId === 'deck')
  const hasDrawn = !!myPlayer?.hasDrawn

  const nextPhase = NEXT_PHASE[game.phase]
  const isSecretTalk = game.phase === 'secret_talk'

  const mins = timeLeft != null ? Math.floor(timeLeft / 60) : '--'
  const secs = timeLeft != null ? String(timeLeft % 60).padStart(2, '0') : '--'
  const timerColor = timeLeft != null && timeLeft < 60 ? 'text-red-400' : 'text-purple-200'

  return (
    <div className="min-h-screen bg-[#0f0a1a] pb-24">
      {showMap && <ManorMap onClose={() => setShowMap(false)} npcVictims={scenario?.npcVictims ?? []} mainVictimLocation={scenario?.mainVictimLocation} />}
      {showProfile && scenario && viewSlot && (
        <ProfileModal scenario={scenario} slot={viewSlot} onClose={() => setShowProfile(false)} />
      )}
      {/* Top bar */}
      <div className="bg-[#1a0f2e] border-b border-purple-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-purple-200 font-medium text-sm">
            {PHASE_LABELS[game.phase] ?? game.phase}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfile(true)}
              className="text-purple-400 hover:text-purple-200 text-sm px-2 py-0.5 rounded border border-purple-800 hover:border-purple-600 transition-colors"
            >
              👤 プロフィール
            </button>
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

      {/* Debug character switcher */}
      {isDebug && allSlots.length > 0 && (
        <div className="bg-[#0d0820] border-b border-purple-900/50 px-4 py-2">
          <div className="flex gap-1.5 max-w-md mx-auto overflow-x-auto">
            {allSlots.map(slot => (
              <button
                key={slot}
                onClick={() => setActiveViewSlot(slot === mySlot ? null : slot)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  viewSlot === slot
                    ? 'bg-purple-700 border-purple-500 text-white'
                    : 'bg-[#1a0f2e] border-purple-800 text-purple-500 hover:border-purple-600 hover:text-purple-300'
                }`}
              >
                {slot}枠 {CHARACTERS[slot]?.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-md sm:max-w-2xl mx-auto px-4 py-4 space-y-3">
        {/* PUBLIC */}
        {tab === 'public' && (
          <>
            {publicCards.length === 0 ? (
              <p className="text-purple-600 text-sm text-center py-8">まだ公開されたカードがありません</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {publicCards.map(card => (
                  <EvidenceCardView key={card.id} card={card} showActions={false} />
                ))}
              </div>
            )}
          </>
        )}

        {/* HAND */}
        {tab === 'hand' && (
          <>
            {myCards.length === 0 ? (
              <p className="text-purple-600 text-sm text-center py-8">手札がありません</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {myCards.map(card => (
                  <EvidenceCardView
                    key={card.id}
                    card={card}
                    showActions
                    onShareAll={handleShareAll}
                    onSecretSend={() => setTab('secret')}
                  />
                ))}
              </div>
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

// ── Profile modal (private handout info, viewable during discussion) ──────────
function ProfileModal({
  scenario, slot, onClose,
}: {
  scenario: NonNullable<GameState['scenario']>
  slot: CharacterSlot
  onClose: () => void
}) {
  const char = CHARACTERS[slot]
  if (!char) return null
  const role = scenario.roles[slot]
  const killerInfo = (scenario.killers ?? []).find(k => k.slot === slot)
  const alibis = scenario.alibis[slot]
  const relationships = Object.entries(char.relationships ?? {}) as [CharacterSlot, string][]

  const connTypeLabel: Record<string, string> = {
    lookout: '見張り番', preparation: '準備の手伝い', silence_deal: '口止め取引',
    weapon_supply: '凶器・品物の調達', victim_lure: '被害者の誘導', map_provision: '見取り図の提供',
    false_alibi: '偽アリバイの口裏合わせ', distraction: '陽動・騒ぎの演出',
    evidence_disposal: '証拠品の処分', key_provision: '合鍵の提供',
  }
  const methodLabel: Record<string, string> = {
    anonymous_phone: '声変え電話', anonymous_letter: '差出人不明の手紙', blackmail_face: '直接対面での脅迫',
  }
  const myConns = (scenario.connections ?? []).filter(c => c.fromSlot === slot || c.toSlot === slot)
  const myLinks = scenario.cooperationChain?.links.filter(l => l.fromSlot === slot || l.toSlot === slot) ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="bg-[#12091e] border border-purple-800 rounded-xl w-full max-w-md max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-900 bg-[#1a0f2e] shrink-0">
          <div>
            <h3 className="text-purple-100 font-bold text-base leading-tight" style={{ fontFamily: 'serif' }}>{char.name}</h3>
            <span className="text-purple-500 text-xs">{char.role}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${role === 'killer' ? 'bg-red-900/50 text-red-300 border border-red-800' : 'bg-purple-900/50 text-purple-300 border border-purple-800'}`}>
              {role === 'killer' ? '🔪 犯人' : '👁 無実'}
            </div>
            <button onClick={onClose} className="text-purple-500 hover:text-purple-300 text-lg leading-none">✕</button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-4 space-y-4">
          {/* ── 共通情報（全員共通） ── */}
          {scenario.synopsis && (
            <PSection title="あらすじ（全員共通）">
              <div className="space-y-3">
                {scenario.synopsis.split('\n\n').map((para, i) => (
                  <p key={i} className="text-purple-200 text-sm leading-relaxed">{para}</p>
                ))}
              </div>
            </PSection>
          )}
          <PSection title={`被害者: ${MAIN_VICTIM.name}（${MAIN_VICTIM.role}）`}>
            <p className="text-purple-200 text-sm leading-relaxed">{MAIN_VICTIM.background}</p>
          </PSection>
          {((scenario.npcVictims ?? []).length > 0 || (scenario.npcSurvivors ?? []).length > 0) && (
            <PSection title="館の関係者（全員既知）">
              <div className="space-y-2">
                {(scenario.npcVictims ?? []).map((v, i) => (
                  <div key={`d-${i}`} className="flex gap-3 text-sm">
                    <span className="text-red-400/80 text-xs w-4 shrink-0 mt-0.5">✝</span>
                    <div className="min-w-0">
                      <span className="text-blue-300 font-medium">{v.role}</span>
                      <div className="text-purple-400 text-xs mt-0.5">
                        <p>推定死亡場所: <span className="text-purple-200">{v.deathLocation}</span></p>
                        <p>推定死亡時刻: <span className="text-purple-200">{v.deathTime}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
                {(scenario.npcSurvivors ?? []).map((s, i) => (
                  <div key={`a-${i}`} className="flex gap-3 text-sm">
                    <span className="text-green-500/60 text-xs w-4 shrink-0 mt-0.5">●</span>
                    <div className="min-w-0">
                      <span className="text-blue-300 font-medium">{s.role}</span>
                      <span className="text-green-400/70 text-xs ml-2">生存（証言可能）</span>
                    </div>
                  </div>
                ))}
              </div>
            </PSection>
          )}

          <div className="border-t border-purple-900/60 pt-1 text-center">
            <span className="text-purple-600 text-[10px] tracking-widest">── ここからあなただけの情報 ──</span>
          </div>

          <PSection title="背景">
            <p className="text-purple-200 text-sm leading-relaxed">{char.background}</p>
          </PSection>
          <PSection title="あなただけの秘密（誰にも言わないこと）" accent="amber">
            <p className="text-amber-200 text-sm leading-relaxed">{char.secretAction}</p>
          </PSection>

          {myConns.length > 0 && (
            <PSection title="今夜の密約（あなただけが知ること）" accent="amber">
              <div className="space-y-4">
                {myConns.map((conn, i) => {
                  const isFrom = conn.fromSlot === slot
                  const otherSlot = isFrom ? conn.toSlot : conn.fromSlot
                  const text = isFrom ? conn.fromText : conn.toText
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded border border-amber-700 bg-amber-900/30 text-amber-300">{connTypeLabel[conn.type]}</span>
                        <span className="text-purple-400 text-xs">{CHARACTERS[otherSlot]?.name}</span>
                      </div>
                      <p className="text-amber-100 text-sm leading-relaxed">{text}</p>
                    </div>
                  )
                })}
              </div>
            </PSection>
          )}

          {myLinks.length > 0 && (
            <PSection title="秘密の指令（あなただけが知ること）" accent="amber">
              <div className="space-y-4">
                {myLinks.map((link, i) => {
                  const isFrom = link.fromSlot === slot
                  const text = isFrom ? link.fromText : link.toText
                  const label = isFrom
                    ? `指示を出した（${methodLabel[link.method]}）`
                    : link.senderKnown
                      ? `脅迫を受けた — ${CHARACTERS[link.fromSlot].name}から`
                      : `${methodLabel[link.method]}を受けた（送り主不明）`
                  return (
                    <div key={i} className="space-y-1.5">
                      <span className="inline-block text-xs px-2 py-0.5 rounded border border-amber-700 bg-amber-900/30 text-amber-300">{label}</span>
                      <p className="text-amber-100 text-sm leading-relaxed">{text}</p>
                    </div>
                  )
                })}
              </div>
            </PSection>
          )}

          {role === 'killer' && killerInfo && (
            <PSection title="あなたが行った凶行（厳重に秘密）" accent="red">
              <div className="space-y-2 text-sm">
                <PRow label="被害者" value={killerInfo.victimSlot ? (CHARACTERS[killerInfo.victimSlot]?.name ?? '？') : (killerInfo.victimName ?? '？')} />
                <PRow label={killerInfo.method === 'poison' ? '毒物' : killerInfo.method === 'environmental' ? '仕掛け' : '凶器'} value={killerInfo.weapon.name} />
                <PRow label="場所" value={LOCATION_NAMES[killerInfo.location]} />
                <PRow label="偽装死因" value={killerInfo.weapon.disguisedAs} />
                <PRow label="時刻" value="事件のあった夜（21:00〜22:00頃）" />
              </div>
            </PSection>
          )}

          {role === 'killer' && scenario.mainTrick && scenario.mainTrick.killerSlots.includes(slot) && (
            <PSection title={`🎭 あなたが仕掛けたトリック：${scenario.mainTrick.name}`} accent="red">
              <p className="text-red-100 text-sm leading-relaxed">{scenario.mainTrick.killerNote}</p>
              <p className="text-red-300/60 text-xs mt-2 leading-relaxed">※このトリックがあなたのアリバイを作っている。綻びを突かれないよう立ち回ること。</p>
            </PSection>
          )}

          {alibis && (
            <PSection title="あなたの真実のアリバイ">
              <AlibiMatrix alibis={alibis} />
            </PSection>
          )}

          <PSection title="あなたが知る関係図">
            {relationships.length === 0 ? (
              <p className="text-purple-500 text-sm">関係情報なし</p>
            ) : (
              <div className="space-y-2">
                {relationships.map(([s, desc]) => (
                  <div key={s} className="flex gap-2">
                    <span className="text-purple-500 text-xs w-20 shrink-0">{CHARACTERS[s]?.name ?? s}</span>
                    <span className="text-purple-300 text-sm">{desc}</span>
                  </div>
                ))}
              </div>
            )}
          </PSection>
        </div>
      </div>
    </div>
  )
}

function PSection({ title, children, accent = 'purple' }: { title: string; children: React.ReactNode; accent?: string }) {
  const border = accent === 'red' ? 'border-red-900' : accent === 'amber' ? 'border-amber-900' : 'border-purple-900'
  const titleColor = accent === 'red' ? 'text-red-300' : accent === 'amber' ? 'text-amber-300' : 'text-purple-300'
  return (
    <div className={`bg-[#1a0f2e] border ${border} rounded-xl p-4`}>
      <h4 className={`${titleColor} text-xs font-medium mb-2 tracking-wide`}>{title}</h4>
      {children}
    </div>
  )
}

function PRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-red-400/70 text-xs w-20 shrink-0">{label}</span>
      <span className="text-red-200 text-xs">{value}</span>
    </div>
  )
}
