import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { subscribeGame, advancePhase, setReady } from '../services/firebase'
import type { GameState, CharacterSlot } from '../types/game'
import { CHARACTERS, MAIN_VICTIM } from '../data/characters'
import { LOCATION_NAMES } from '../data/locations'
import AlibiMatrix from '../components/AlibiMatrix'
import EvidenceCardView from '../components/EvidenceCard'
import ManorMap from '../components/ManorMap'

const ROUND1_PHASE = 'round1'

export default function HandoutPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') ?? ''

  const navigate = useNavigate()
  const [game, setGame] = useState<GameState | null>(null)
  const [screen, setScreen] = useState<'common' | 'individual'>('common')
  const [showAnnounce, setShowAnnounce] = useState(false)
  const [tab, setTab] = useState<'character' | 'alibi' | 'cards'>('character')
  const [showMap, setShowMap] = useState(false)
  const [activeViewSlot, setActiveViewSlot] = useState<CharacterSlot | null>(null)

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

  const scenario = game.scenario!
  const isDebug = game.playerCount < 4
  const allSlots = Object.keys(scenario.roles) as CharacterSlot[]
  const viewSlot: CharacterSlot = (isDebug && activeViewSlot) ? activeViewSlot : mySlot
  const viewUid = Object.entries(game.players).find(([, p]) => p.characterSlot === viewSlot)?.[0] ?? uid

  const char = CHARACTERS[viewSlot]
  const myRole = scenario.roles[viewSlot]
  const myKillerInfo = (scenario.killers ?? []).find(k => k.slot === viewSlot)
  const myAlibis = scenario.alibis[viewSlot]
  const myCards = Object.values(game.cards ?? {}).filter(c => c.ownerId === viewUid)
  const isHost = game.hostId === uid

  const allReady = Object.values(game.players ?? {}).filter(p => !p.isNPC).every(p => p.isReady)

  const relationships = Object.entries(char.relationships ?? {}) as [CharacterSlot, string][]

  // ── COMMON SCREEN ──────────────────────────────────────────────────────────
  if (screen === 'common') {
    return (
      <div className="min-h-screen bg-[#0f0a1a] pb-24">
        <div className="bg-[#1a0f2e] border-b border-purple-900 px-4 py-3 text-center">
          <h2 className="text-purple-200 font-bold text-base" style={{ fontFamily: 'serif' }}>紫苑館の秘密</h2>
          <p className="text-purple-500 text-xs mt-0.5">共通情報 — 全員で確認してください</p>
        </div>
        <div className="max-w-md mx-auto px-4 py-4 space-y-4">
          {scenario.synopsis && (
            <Section title="あらすじ">
              <div className="space-y-3">
                {scenario.synopsis.split('\n\n').map((para, i) => (
                  <p key={i} className="text-purple-200 text-sm leading-relaxed">{para}</p>
                ))}
              </div>
            </Section>
          )}
          <Section title={`被害者: ${MAIN_VICTIM.name}（${MAIN_VICTIM.role}）`}>
            <p className="text-purple-200 text-sm leading-relaxed">{MAIN_VICTIM.background}</p>
          </Section>
          {((scenario.npcVictims ?? []).length > 0 || (scenario.npcSurvivors ?? []).length > 0) && (
            <Section title="館で見つかった死亡者・生存者">
              <p className="text-purple-500 text-xs mb-3 leading-relaxed">
                この夜、館の内外で複数の人物が死亡した。判明しているのは「どこで」「いつ頃」亡くなったと推定されるかのみ。
                死因や、事故なのか殺人なのかは、討議やカードの手がかりから各自で推理すること。
              </p>
              <div className="space-y-2.5">
                {(scenario.npcVictims ?? []).map((v, i) => (
                  <div key={`dead-${i}`} className="flex gap-3 text-sm">
                    <span className="text-red-400/80 text-xs w-4 shrink-0 mt-0.5">✝</span>
                    <div className="min-w-0">
                      <span className="text-blue-300 font-medium">{v.role}</span>
                      <div className="text-purple-400 text-xs mt-0.5 space-y-0.5">
                        <p>推定死亡場所: <span className="text-purple-200">{v.deathLocation}</span></p>
                        <p>推定死亡時刻: <span className="text-purple-200">{v.deathTime}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
                {(scenario.npcSurvivors ?? []).map((s, i) => (
                  <div key={`alive-${i}`} className="flex gap-3 text-sm">
                    <span className="text-green-500/60 text-xs w-4 shrink-0 mt-0.5">●</span>
                    <div className="min-w-0">
                      <span className="text-blue-300 font-medium">{s.role}</span>
                      <span className="text-green-400/70 text-xs ml-2">生存（証言可能）</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
        {showAnnounce && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
            <div className="bg-[#1a0f2e] border border-purple-700 rounded-2xl p-6 max-w-sm w-full text-center">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-purple-100 font-bold text-base mb-3" style={{ fontFamily: 'serif' }}>
                ここからは個別情報です
              </h3>
              <p className="text-purple-300 text-sm leading-relaxed mb-5">
                スマホを他のプレイヤーから遠ざけてください。<br />
                他のプレイヤーには絶対に見せないでください。
              </p>
              <button
                onClick={() => { setShowAnnounce(false); setScreen('individual') }}
                className="w-full bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-xl py-3 text-sm"
              >
                わかった →
              </button>
            </div>
          </div>
        )}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a0f2e] border-t border-purple-900 px-4 py-3">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setShowAnnounce(true)}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-xl py-3 text-sm"
            >
              個別情報へ進む →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── INDIVIDUAL SCREEN ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0a1a] pb-24">
      {showMap && <ManorMap onClose={() => setShowMap(false)} npcVictims={scenario.npcVictims ?? []} />}
      {/* Top bar */}
      <div className="bg-[#1a0f2e] border-b border-purple-900 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-purple-400 text-xs">
            {viewSlot}枠
            {isDebug && viewSlot !== mySlot && (
              <span className="text-amber-500 text-xs ml-1">（閲覧モード）</span>
            )}
          </span>
          <h2 className="text-purple-100 font-bold text-lg leading-tight" style={{ fontFamily: 'serif' }}>{char.name}</h2>
          <span className="text-purple-500 text-xs">{char.role}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMap(true)}
            className="text-purple-400 hover:text-purple-200 text-xs px-2 py-1 rounded border border-purple-800 hover:border-purple-600 transition-colors"
          >
            🗺 マップ
          </button>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${myRole === 'killer' ? 'bg-red-900/50 text-red-300 border border-red-800' : 'bg-purple-900/50 text-purple-300 border border-purple-800'}`}>
            {myRole === 'killer' ? '🔪 犯人' : '👁 無実'}
          </div>
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

      {/* Debug character switcher */}
      {isDebug && (
        <div className="bg-[#0d0820] border-b border-purple-900/50 px-4 py-2">
          <div className="flex flex-wrap gap-1.5 max-w-md mx-auto">
            {allSlots.map(slot => {
              const slotEntry = Object.entries(game.players).find(([, p]) => p.characterSlot === slot)
              const slotPlayer = slotEntry?.[1]
              return (
                <button
                  key={slot}
                  onClick={() => setActiveViewSlot(slot === mySlot ? null : slot)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    viewSlot === slot
                      ? 'bg-purple-700 border-purple-500 text-white'
                      : 'bg-[#1a0f2e] border-purple-800 text-purple-500 hover:border-purple-600 hover:text-purple-300'
                  }`}
                >
                  {slot}:{CHARACTERS[slot]?.name}
                  {slotPlayer?.isNPC && <span className="opacity-50 ml-0.5"> NPC</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

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
            {(() => {
              const myConns = (scenario.connections ?? []).filter(
                c => c.fromSlot === viewSlot || c.toSlot === viewSlot
              )
              if (myConns.length === 0) return null
              const typeLabel: Record<string, string> = {
                lookout: '見張り番',
                preparation: '準備の手伝い',
                silence_deal: '口止め取引',
                weapon_supply: '凶器・品物の調達',
                victim_lure: '被害者の誘導',
                map_provision: '見取り図の提供',
                false_alibi: '偽アリバイの口裏合わせ',
                distraction: '陽動・騒ぎの演出',
                evidence_disposal: '証拠品の処分',
                key_provision: '合鍵の提供',
              }
              return (
                <Section title="今夜の密約（あなただけが知ること）" accent="amber">
                  <div className="space-y-4">
                    {myConns.map((conn, i) => {
                      const isFrom = conn.fromSlot === viewSlot
                      const otherSlot = isFrom ? conn.toSlot : conn.fromSlot
                      const otherChar = CHARACTERS[otherSlot]
                      const text = isFrom ? conn.fromText : conn.toText
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded border border-amber-700 bg-amber-900/30 text-amber-300">
                              {typeLabel[conn.type]}
                            </span>
                            <span className="text-purple-400 text-xs">
                              {otherChar.name}
                            </span>
                          </div>
                          <p className="text-amber-100 text-sm leading-relaxed">{text}</p>
                        </div>
                      )
                    })}
                  </div>
                </Section>
              )
            })()}
            {(() => {
              const chain = scenario.cooperationChain
              if (!chain) return null
              const myLinks = chain.links.filter(l => l.fromSlot === viewSlot || l.toSlot === viewSlot)
              if (myLinks.length === 0) return null
              const methodLabel: Record<string, string> = {
                anonymous_phone: '声変え電話',
                anonymous_letter: '差出人不明の手紙',
                blackmail_face: '直接対面での脅迫',
              }
              return (
                <Section title="秘密の指令（あなただけが知ること）" accent="amber">
                  <p className="text-amber-400/70 text-xs mb-3">以下の情報は他のプレイヤーには絶対に見せないでください。</p>
                  <div className="space-y-4">
                    {myLinks.map((link, i) => {
                      const isFrom = link.fromSlot === viewSlot
                      const text = isFrom ? link.fromText : link.toText
                      const label = isFrom
                        ? `指示を出した（${methodLabel[link.method]}）`
                        : link.senderKnown
                          ? `脅迫を受けた — ${CHARACTERS[link.fromSlot].name}から`
                          : `${methodLabel[link.method]}を受けた（送り主不明）`
                      return (
                        <div key={i} className="space-y-1.5">
                          <span className="inline-block text-xs px-2 py-0.5 rounded border border-amber-700 bg-amber-900/30 text-amber-300">
                            {label}
                          </span>
                          <p className="text-amber-100 text-sm leading-relaxed">{text}</p>
                        </div>
                      )
                    })}
                  </div>
                </Section>
              )
            })()}
            {myRole === 'killer' && myKillerInfo && (
              <Section title="あなたが行った凶行（厳重に秘密）" accent="red">
                <div className="space-y-2 text-sm">
                  <Row label="被害者" value={
                    myKillerInfo.victimSlot
                      ? (CHARACTERS[myKillerInfo.victimSlot]?.name ?? '？')
                      : (myKillerInfo.victimName ?? '？')
                  } />
                  <Row label={myKillerInfo.method === 'poison' ? '毒物' : myKillerInfo.method === 'environmental' ? '仕掛け' : '凶器'} value={myKillerInfo.weapon.name} />
                  <Row label="場所" value={LOCATION_NAMES[myKillerInfo.location]} />
                  <Row label="偽装死因" value={myKillerInfo.weapon.disguisedAs} />
                  <Row label="時刻" value="T2（21:00〜22:00頃）" />
                </div>
                {myKillerInfo.isDualKiller && (
                  <div className="mt-3 pt-3 border-t border-red-900/40">
                    <p className="text-red-200/80 text-xs leading-relaxed">
                      {(() => {
                        const v = myKillerInfo.victimName ?? '被害者'
                        const pat = scenario.dualKillerInfo?.type
                        const isFirst = (scenario.killers ?? []).findIndex(k => k.slot === viewSlot) === 0

                        if (myKillerInfo.method === 'poison') {
                          if (pat === 'poison_failed_weapon_killed') {
                            return `あなたは毒を使ったが、${v}はその後も動き回っているように見えた。量が足りなかったのか、体質的に効かなかったのか——自分でも今夜起きたことへの確信が持てないまま討議に臨んでいる。`
                          }
                          if (pat === 'weapon_then_poison') {
                            return `T2、${v}の元へ向かうとすでに${v}は苦しんでいた。何があったかは確認できなかったが、毒を盛り立ち去った。自分が止めを刺したのかどうか、今もはっきりしない。`
                          }
                          return `あなたは毒を盛り、その場を立ち去った。遅効性のため${v}はすぐには倒れなかった。その後、遺体がどのような状態で発見されたかはあなたも知らない。`
                        }
                        if (myKillerInfo.method === 'environmental') {
                          return `T2前に${LOCATION_NAMES[myKillerInfo.location]}へ${myKillerInfo.weapon.name}を仕掛けた。${v}が罠に落ち負傷したのを遠目に確認し、その場を去った。死亡は直接確認していない。しかし夜が明けてもたらされた報告には、罠だけでは説明できない傷も含まれていたという。`
                        }
                        if (pat === 'weapon_found_dead') {
                          return `T2、凶器を手に${v}の部屋へ踏み込んだとき、すでに${v}は床に倒れており、脈はなかった。誰かに先を越されたのだと悟り、動揺しながらその場を後にした。凶器はそのまま持ち帰った。`
                        }
                        if (pat === 'weapon_then_poison') {
                          return `T2に${v}を凶器で傷つけ、致命傷を与えたと判断してその場を去った。その後、別の誰かが来て何かをしたとは知る由もない。`
                        }
                        if (pat === 'poison_failed_weapon_killed') {
                          return `T2に${v}を凶器で仕留めた。完全に息絶えたのを確認して立ち去った。誰かが先に毒を盛っていたとは知る由もない。`
                        }
                        if (pat === 'double_weapon_first_failed') {
                          if (isFirst) {
                            return `T2に${myKillerInfo.weapon.name}で${v}を攻撃し、動かなくなったのを見て立ち去った。だが遺体には自分の凶器とは異なる傷が残されていた。誰かがあとから来たのか——自分の一撃で本当に死んだのか、確かめる術はない。`
                          }
                          return `T2、${v}のもとへ向かうとすでに${v}は倒れ、傷を負っていた。息がある——あなたは${myKillerInfo.weapon.name}で止めを刺した。誰が先に手を下したのかは知らない。`
                        }
                        if (pat === 'double_weapon_overlap') {
                          return `T2、あなたは${myKillerInfo.weapon.name}で${v}を攻撃した。致命傷を与えたはずだ。だが後に、遺体には自分の凶器とは異なる傷も見つかったという。同じ夜に同じ相手を、別の誰かも狙っていたとはまったく知らなかった。`
                        }
                        if (pat === 'environment_then_weapon') {
                          return `T2、${myKillerInfo.weapon.name}を手に${v}のもとへ向かうと、${v}はすでに傷を負い苦しんでいた。誰かが先に手を下したのかもしれない——あなたは構わず凶器で止めを刺した。罠が仕掛けられていたとは知らなかった。`
                        }
                        return `T2に${v}の元へ向かい、凶器で致命傷を与えた。${v}の様子に違和感があったかもしれないが、あなたは凶器による一撃しか知らない。`
                      })()}
                    </p>
                  </div>
                )}
              </Section>
            )}
            <Section title="あなたが知る関係図">
              {relationships.length === 0 ? (
                <p className="text-purple-500 text-sm">関係情報なし</p>
              ) : (
                <div className="space-y-2">
                  {relationships.map(([slot, desc]) => (
                    <div key={slot} className="flex gap-2">
                      <span className="text-purple-500 text-xs w-20 shrink-0">
                        {CHARACTERS[slot]?.name ?? slot}
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
              <div className="grid grid-cols-2 gap-3">
                {myCards.map(card => (
                  <EvidenceCardView key={card.id} card={card} showActions={false} />
                ))}
              </div>
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
  const border = accent === 'red' ? 'border-red-900' : accent === 'amber' ? 'border-amber-900' : 'border-purple-900'
  const titleColor = accent === 'red' ? 'text-red-300' : accent === 'amber' ? 'text-amber-300' : 'text-purple-300'
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
