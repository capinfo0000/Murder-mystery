import type { Weapon } from '../types/game'

export const WEAPONS: Weapon[] = [
  // ── 毒物・薬物（病死・中毒に偽装）──
  { id: 'poison_herb',  name: '毒草エキス',         disguisedAs: '持病による発作死',      isPoison: true },
  { id: 'sedative',     name: '睡眠薬の過剰投与',   disguisedAs: '老衰・自然死',          isPoison: true },
  { id: 'poison_wine',  name: '毒入りワイン',       disguisedAs: '食中毒',                isPoison: true },
  { id: 'digitalis',    name: 'ジギタリスの過剰投与', disguisedAs: '心臓発作による急死',   isPoison: true },
  { id: 'arsenic',      name: '砒素入りの料理',     disguisedAs: '急性の食あたり',        isPoison: true },
  { id: 'tainted_tea',  name: '毒を仕込んだ紅茶',   disguisedAs: '急な発作死',            isPoison: true },
  // ── 鈍器・刃物（転落・外傷事故に偽装）──
  { id: 'dagger',       name: '古い短剣',           disguisedAs: '転落による外傷死' },
  { id: 'candlestick',  name: '重い燭台',           disguisedAs: '階段からの転落事故' },
  { id: 'poker',        name: '暖炉の火かき棒',     disguisedAs: '転落による頭部外傷' },
  { id: 'marble_paperweight', name: '大理石の文鎮', disguisedAs: '転倒による頭部強打' },
  { id: 'wine_bottle',  name: 'ワインの瓶（殴打）', disguisedAs: '転落による外傷死' },
  // ── 絞殺具（首吊り自殺に偽装）──
  { id: 'strangling',   name: '絞殺',               disguisedAs: '自殺（首吊り）' },
  { id: 'cord',         name: '電気コードによる絞殺', disguisedAs: '自殺（首吊り）' },
  { id: 'scarf',        name: '絹のスカーフによる絞殺', disguisedAs: '自殺（首吊り）' },
  // ── 環境・仕掛け（事故・焼死・遠隔に偽装）──
  { id: 'stair_trap',   name: '階段への細工',       disguisedAs: '転落事故死',            isEnvironmental: true },
  { id: 'arson_setup',  name: '放火の仕掛け',       disguisedAs: '焼死（失火）',          isEnvironmental: true },
  { id: 'oil_lamp',     name: 'ランプの油への引火', disguisedAs: '焼死（失火）',          isEnvironmental: true },
]
