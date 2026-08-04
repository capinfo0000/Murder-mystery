import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { subscribeGame } from '../services/firebase'
import type { GameState, CharacterSlot } from '../types/game'
import { CHARACTERS } from '../data/characters'
import { LOCATION_NAMES } from '../data/locations'

export default function ResultPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') ?? ''
  const [game, setGame] = useState<GameState | null>(null)
  const [tab, setTab] = useState<'scores' | 'truth' | 'cards'>('scores')

  useEffect(() => {
    if (!gameId) return
    return subscribeGame(gameId, setGame)
  }, [gameId])

  if (!game) return <Loading />
  if (!game.result) return <Loading />

  const { result, players, scenario, cards } = game
  const sortedPlayers = Object.entries(result.scores).sort(
    (a, b) => b[1].total - a[1].total
  )
  const isWinner = (pid: string) => result.winnerIds.includes(pid)

  return (
    <div className="min-h-screen bg-[#0f0a1a] pb-16">
      {/* Header */}
      <div className="bg-[#1a0f2e] border-b border-purple-900 px-4 py-4 text-center">
        {result.outsideKillerCase ? (
          <>
            <div className={`text-2xl mb-1 ${result.mainKillerCaught ? 'text-green-400' : 'text-red-400'}`}>
              {result.mainKillerCaught ? '✓ 外部犯を見破った' : '✗ 外部犯を見破れず'}
            </div>
            <p className="text-purple-400 text-xs">組織の殺し屋による犯行 — 迷宮入り</p>
          </>
        ) : (
          <>
            <div className={`text-2xl mb-1 ${result.mainKillerCaught ? 'text-green-400' : 'text-red-400'}`}>
              {result.mainKillerCaught ? '✓ 犯人逮捕成功' : '✗ 犯人逃走'}
            </div>
            <p className="text-purple-400 text-xs">
              {result.mainKillerCaught
                ? '真犯人への最多票が一致しました'
                : '無実の人物への最多票が集まりました'}
            </p>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-purple-900 bg-[#12091e]">
        {(['scores', 'truth', 'cards'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === t ? 'text-purple-200 border-b-2 border-purple-500' : 'text-purple-600'}`}
          >
            {t === 'scores' ? 'スコア' : t === 'truth' ? '真相' : 'カード真偽'}
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* SCORES */}
        {tab === 'scores' && (
          <div className="space-y-2">
            {sortedPlayers.map(([playerId, score], i) => {
              const player = players[playerId]
              if (!player) return null
              const isMe = playerId === uid
              const slot = player.characterSlot
              const char = slot ? CHARACTERS[slot] : null
              return (
                <div
                  key={playerId}
                  className={`rounded-xl p-3 border ${
                    isWinner(playerId)
                      ? 'border-amber-500 bg-amber-900/20'
                      : 'border-purple-900 bg-[#1a0f2e]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-purple-500 text-sm w-5">{i + 1}.</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isMe ? 'text-purple-100' : 'text-purple-200'}`}>
                          {player.name}
                          {isMe && <span className="text-purple-500 text-xs ml-1">（あなた）</span>}
                        </span>
                        {isWinner(playerId) && (
                          <span className="text-amber-400 text-xs">👑 勝者</span>
                        )}
                      </div>
                      {char && (
                        <span className="text-purple-500 text-xs">{char.name} ({slot}枠)</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-purple-100 text-lg font-bold">{score.total}pt</div>
                      <div className="text-purple-600 text-[10px]">
                        基本{score.base} + 立回{score.tachimawari} + ボーナス{score.bonus}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* TRUTH */}
        {tab === 'truth' && scenario && (
          <div className="space-y-4">
            {/* Killers */}
            {scenario.outsideKiller ? (
              <Section title="🔫 真犯人">
                <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3">
                  <div className="text-red-300 font-medium text-sm mb-1">組織の殺し屋（身元不明・逃走済み）</div>
                  <p className="text-red-200/70 text-xs">犯罪組織から派遣されたプロの殺し屋が当主を暗殺し、目撃者を口封じした後に逃走した。プレイヤーの誰も殺人は犯していない。</p>
                </div>
              </Section>
            ) : (
              <Section title="🔪 真犯人">
                {scenario.killers.map(k => (
                  <div key={k.slot} className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 mb-2">
                    <div className="text-red-300 font-medium text-sm mb-1">
                      {CHARACTERS[k.slot]?.name} ({k.slot}枠)
                    </div>
                    <div className="text-red-200/70 text-xs space-y-0.5">
                      <p>被害者: {k.victimSlot ? `${CHARACTERS[k.victimSlot]?.name}（${k.victimSlot}枠）` : k.victimName}</p>
                      <p>凶器: {k.weapon.name}</p>
                      <p>場所: {LOCATION_NAMES[k.location]}</p>
                      <p>偽装: {k.weapon.disguisedAs}</p>
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* NPC victim truth */}
            {scenario.npcVictims && scenario.npcVictims.length > 0 && (
              <Section title="🕯 死亡者の真実">
                {scenario.npcVictims.map((v, i) => (
                  <div key={i} className="py-2 border-b border-purple-900/30 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${v.isRelatedToCase ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-purple-900/30 text-purple-400 border-purple-800'}`}>
                        {v.isRelatedToCase ? (v.dualKillerPattern ? '二重犯行' : '他殺') : '自然死'}
                      </span>
                      <span className="text-purple-200 text-sm font-medium">{v.name}</span>
                      <span className="text-purple-600 text-xs">{v.role}</span>
                    </div>
                    <p className="text-purple-400 text-xs ml-0.5">
                      報告書: {v.apparentCause}
                    </p>
                    {v.isRelatedToCase && v.trueMurderDetail && (
                      <p className="text-red-300 text-xs mt-0.5 ml-0.5">真相: {v.trueMurderDetail}</p>
                    )}
                    {v.isRelatedToCase && (
                      <div className="mt-0.5 ml-0.5 space-y-0.5">
                        {v.dualKillerPattern ? (
                          <>
                            <p className="text-red-400 text-xs">
                              毒を盛った者: {CHARACTERS[v.killerSlot!]?.name}（{v.killerSlot}枠）
                            </p>
                            <p className="text-red-400 text-xs">
                              {v.dualKillerPattern === 'poison_then_weapon'
                                ? `止めを刺した者: ${CHARACTERS[v.secondKillerSlot!]?.name}（${v.secondKillerSlot}枠）`
                                : `凶器持参・未使用: ${CHARACTERS[v.secondKillerSlot!]?.name}（${v.secondKillerSlot}枠）`
                              }
                            </p>
                          </>
                        ) : v.killerSlot ? (
                          <p className="text-red-400 text-xs">
                            犯人: {CHARACTERS[v.killerSlot]?.name}（{v.killerSlot}枠）
                          </p>
                        ) : scenario.outsideKiller ? (
                          <p className="text-red-400 text-xs">犯人: 組織の殺し屋</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {/* All secret actions */}
            <Section title="全員の秘密行動">
              {(Object.entries(scenario.secretActions) as [CharacterSlot, string][]).map(([slot, action]) => (
                <div key={slot} className="flex gap-2 py-1.5 border-b border-purple-900/30 last:border-0">
                  <span className="text-purple-500 text-xs w-20 shrink-0">{CHARACTERS[slot]?.name}</span>
                  <span className="text-purple-300 text-xs">{action}</span>
                </div>
              ))}
            </Section>

            {/* Alibis */}
            <Section title="真のアリバイ一覧">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-purple-500">
                      <th className="text-left pb-1">人物</th>
                      <th className="text-left pb-1">T1</th>
                      <th className="text-left pb-1 text-red-400">T2</th>
                      <th className="text-left pb-1">T3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.entries(scenario.alibis) as [CharacterSlot, { T1: string; T2: string; T3: string }][]).map(([slot, ali]) => (
                      <tr key={slot} className="text-purple-300">
                        <td className="py-0.5 pr-2">{CHARACTERS[slot]?.name}</td>
                        <td className="py-0.5 pr-2">{(LOCATION_NAMES as Record<string, string>)[ali.T1] ?? ali.T1}</td>
                        <td className="py-0.5 pr-2 text-red-300">{(LOCATION_NAMES as Record<string, string>)[ali.T2] ?? ali.T2}</td>
                        <td className="py-0.5">{(LOCATION_NAMES as Record<string, string>)[ali.T3] ?? ali.T3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

        {/* CARDS TRUE/FALSE */}
        {tab === 'cards' && (
          <div className="space-y-2">
            <p className="text-purple-500 text-xs">全カードの真偽を公開します。感想戦にご活用ください。</p>
            {Object.values(cards ?? {}).map(card => (
              <div
                key={card.id}
                className={`rounded-xl p-3 border text-xs ${
                  card.isTrue
                    ? 'border-green-900/60 bg-green-950/20'
                    : 'border-red-900/40 bg-red-950/10'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 mt-0.5 ${card.isTrue ? 'text-green-400' : 'text-red-400'}`}>
                    {card.isTrue ? '✓ 真実' : '✗ 嘘'}
                  </span>
                  <span className="text-purple-200 leading-relaxed">{card.content}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a0f2e] border border-purple-900 rounded-xl p-4">
      <h3 className="text-purple-300 text-xs font-medium mb-3">{title}</h3>
      {children}
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
