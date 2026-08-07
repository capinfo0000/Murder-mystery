import type { Weapon } from '../types/game'

export const WEAPONS: Weapon[] = [
  // ── 毒物・薬物（病死・中毒に偽装）──
  { id: 'poison_herb',  name: '毒草エキス',         disguisedAs: '持病による発作死',
    howHint: '飲み物に毒草エキスを混ぜて源太郎に飲ませ、心臓の持病が急に悪化して倒れたかのような「発作死」に見せかけた。', isPoison: true },
  { id: 'sedative',     name: '睡眠薬の過剰投与',   disguisedAs: '老衰・自然死',
    howHint: '睡眠薬を大量に飲ませて眠らせたまま死に至らしめ、高齢ゆえの「老衰・自然死」に見せかけた。', isPoison: true },
  { id: 'poison_wine',  name: '毒入りワイン',       disguisedAs: '食中毒',
    howHint: '毒を仕込んだワインを源太郎に飲ませ、傷んだ飲食物にあたったかのような「食中毒」に見せかけた。', isPoison: true },
  { id: 'digitalis',    name: 'ジギタリスの過剰投与', disguisedAs: '心臓発作による急死',
    howHint: '強心剤ジギタリスを過剰に摂らせて心臓を止め、「心臓発作による急死」に見せかけた。', isPoison: true },
  { id: 'arsenic',      name: '砒素入りの料理',     disguisedAs: '急性の食あたり',
    howHint: '料理に砒素を盛って源太郎に食べさせ、悪いものを口にしたかのような「急性の食あたり」に見せかけた。', isPoison: true },
  { id: 'tainted_tea',  name: '毒を仕込んだ紅茶',   disguisedAs: '急な発作死',
    howHint: '毒を仕込んだ紅茶を源太郎に飲ませ、突然の「発作死」に見せかけた。', isPoison: true },
  // ── 鈍器・刃物（転落・外傷事故に偽装）──
  { id: 'dagger',       name: '古い短剣',           disguisedAs: '転落による外傷死',
    howHint: '古い短剣で源太郎に致命傷を負わせ、暗い階段から転落した際に鋭利なもので負ったかのような「外傷死」に見せかけた。' },
  { id: 'candlestick',  name: '重い燭台',           disguisedAs: '階段からの転落事故',
    howHint: '重い燭台で源太郎の後頭部を強打して殺害し、その打撲痕を「暗い階段で足を踏み外して頭を打った転落事故」に見せかけた。' },
  { id: 'poker',        name: '暖炉の火かき棒',     disguisedAs: '転落による頭部外傷',
    howHint: '暖炉の火かき棒で源太郎の頭部を強打して殺害し、階段からの転落でできた「頭部外傷」に見せかけた。' },
  { id: 'marble_paperweight', name: '大理石の文鎮', disguisedAs: '転倒による頭部強打',
    howHint: '大理石の文鎮で源太郎の頭部を強打して殺害し、自分で足を取られて「転倒し頭を打った」ように見せかけた。' },
  { id: 'wine_bottle',  name: 'ワインの瓶（殴打）', disguisedAs: '転落による外傷死',
    howHint: 'ワインの瓶で源太郎の頭部を殴打して殺害し、階段からの転落による「外傷死」に見せかけた。' },
  // ── 絞殺具（首吊り自殺に偽装）──
  { id: 'strangling',   name: '絞殺',               disguisedAs: '自殺（首吊り）',
    howHint: '背後から源太郎を絞めて殺害し、そのあと遺体を吊るして「自ら首を吊った自殺」に見せかけた。' },
  { id: 'cord',         name: '電気コードによる絞殺', disguisedAs: '自殺（首吊り）',
    howHint: '電気コードで背後から源太郎を絞殺し、遺体を吊るして「自ら首を吊った自殺」に見せかけた。' },
  { id: 'scarf',        name: '絹のスカーフによる絞殺', disguisedAs: '自殺（首吊り）',
    howHint: '絹のスカーフで背後から源太郎を絞殺し、遺体を吊るして「自ら首を吊った自殺」に見せかけた。' },
  // ── 環境・仕掛け（事故・焼死・遠隔に偽装）──
  { id: 'stair_trap',   name: '階段への細工',       disguisedAs: '転落事故死',          isEnvironmental: true,
    howHint: '階段にひそかに細工を施し、源太郎が踏み外して転落するよう仕向けて「転落事故死」に見せかけた。' },
  { id: 'arson_setup',  name: '放火の仕掛け',       disguisedAs: '焼死（失火）',        isEnvironmental: true,
    howHint: '部屋に火を放って源太郎を焼死させ、暖炉や煙草の不始末による「失火・焼死」に見せかけた。' },
  { id: 'oil_lamp',     name: 'ランプの油への引火', disguisedAs: '焼死（失火）',        isEnvironmental: true,
    howHint: 'ランプの油に引火させて火を放ち、源太郎を巻き込んで「失火による焼死」に見せかけた。' },
]

// 出血を伴う凶器（鈍器・刃物）。毒物・絞殺・放火・仕掛けは血痕・返り血を残さない。
// 「書斎の血痕」「返り血を拭った布」等の血の手がかりは、この凶器のときだけ整合する。
const BLOODY_WEAPON_IDS = new Set(['dagger', 'candlestick', 'poker', 'marble_paperweight', 'wine_bottle'])
export function isBloodyWeapon(weaponId: string): boolean {
  return BLOODY_WEAPON_IDS.has(weaponId)
}

// 現場に血痕が生じうる死因（鈍器・刃物に加え、転落＝頭部の裂傷でも出血しうる）。
// 毒殺・絞殺・焼死では現場に血は出ない。ハーネスの血痕整合チェックで使う。
export function isBloodPlausible(weaponId: string): boolean {
  return BLOODY_WEAPON_IDS.has(weaponId) || weaponId === 'stair_trap'
}

// 凶器→偽装死因の「手口」を一文で返す（犯人ハンドアウト・物語で使用）。
export function killMethodSentence(w: Weapon): string {
  return w.howHint ?? `${w.name}で源太郎を手にかけ、「${w.disguisedAs}」に見せかけた。`
}
