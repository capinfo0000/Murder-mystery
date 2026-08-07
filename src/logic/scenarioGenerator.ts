import type {
  ChainContactMethod,
  ChainLink,
  CharacterSlot,
  ConnectionType,
  CooperationChain,
  DualKillerInfo,
  DualKillerPattern,
  GameMode,
  KillerInfo,
  Location,
  NpcSurvivor,
  Weapon,
  NpcVictim,
  PlayerConnection,
  Scenario,
  TimelineEntry,
  MainTrick,
  VictimInfo,
} from '../types/game'
import { CHARACTERS, MAIN_VICTIM, getSlotsForCount } from '../data/characters'
import { PAST_PROFESSIONS } from '../data/pastProfessions'
import { WEAPONS, killMethodSentence } from '../data/weapons'
import { CRIME_SCENE_LOCATIONS, LOCATION_NAMES } from '../data/locations'
import { VICTIM_BACKGROUNDS } from '../data/victimBackgrounds'
import { EXTRA_NPCS } from '../data/extraNpcs'
import { generateAlibis } from './alibiGenerator'
import { naturalizeTime, PERIOD_T1, PERIOD_T2, PERIOD_T3 } from './timeText'

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function connFromText(type: ConnectionType, toName: string): string {
  if (type === 'lookout') {
    return `${toName}に今夜T2の見張りを頼んだ。自分が秘密行動を実行している間、廊下を見張ってもらった。${toName}は何があったかは知らないが、誰かが近づいたら知らせるよう言われている。`
  }
  if (type === 'preparation') {
    return `${toName}に今夜の準備の一部を手伝ってもらった。具体的な用途は告げず、道具の手配と受け渡しだけを依頼した。`
  }
  if (type === 'weapon_supply') {
    return `${toName}に「ある品物を人知れず調達しておいてほしい」と頼んだ。何に使うのかは一切告げていない。${toName}は言われた通りに動き、今夜それを渡してきた。`
  }
  if (type === 'victim_lure') {
    return `${toName}に「ある人物を今夜の決まった時刻にここへ来るよう取り計らってほしい」と頼んだ。理由は適当に言いくるめるよう指示した。${toName}は役目を果たしてくれた。`
  }
  if (type === 'map_provision') {
    return `${toName}から館の内部構造を詳しく教えてもらった。どこに何があるか、誰がどこを通るかを事前に把握した。${toName}はなぜ知りたいのかを聞かずに教えてくれた。`
  }
  if (type === 'false_alibi') {
    return `${toName}には「T2、ふたりで話していたことにしてほしい」と頼んである。実際に何があったかは告げていない。${toName}は了承してくれた。`
  }
  if (type === 'distraction') {
    return `${toName}に「T2頃、食堂か廊下で何か騒ぎを起こして人目を引きつけておいてほしい」と頼んだ。理由は告げなかったが、${toName}は引き受けてくれた。`
  }
  if (type === 'evidence_disposal') {
    return `${toName}に「ある物を人知れず処分してほしい」と頼んだ。中身を見せず、理由も告げなかった。${toName}は黙って引き受けてくれた。`
  }
  if (type === 'key_provision') {
    return `今夜のために、${toName}が持っていた合鍵を借りた。何に使うかは告げなかった。`
  }
  // silence_deal
  return `T2の頃、あなたは偶然にも${toName}の秘密の行動を目撃してしまった。本人も気づいていた——目が合った瞬間、${toName}の顔が青ざめるのがわかった。その後、ふたりきりになった際、あなたは静かに切り出した。「見てしまったことは、誰にも言わない。ただ、今夜の話し合いで少しだけ協力してほしい」。${toName}は長い沈黙の後、うなずいた。`
}

function connToText(type: ConnectionType, fromName: string): string {
  if (type === 'lookout') {
    return `${fromName}に頼まれ、T2の間、廊下で見張りに立った。何があったかは問われていないが、誰かが近づいたら合図するよう言われた。T2にそこにいた理由の説明として使えるかもしれない。`
  }
  if (type === 'preparation') {
    return `${fromName}に頼まれ、今夜の準備を手伝った。内容の詳細は聞かされていないが、言われた通りに道具を用意して渡した。`
  }
  if (type === 'weapon_supply') {
    return `${fromName}から「内緒で頼みたいことがある」と呼び出され、ある品の調達を依頼された。何に使うのか問いただしても教えてもらえず、ただ言われた通りに用意して手渡した。自分が何に加担したのか、今も知らない。`
  }
  if (type === 'victim_lure') {
    return `${fromName}から「ある人物を特定の時刻に特定の場所へ誘い出してほしい」と頼まれた。口実は自分で考えるよう言われた。なぜそんなことを頼むのか理由は聞かされなかったが、言われた通りに動いた。`
  }
  if (type === 'map_provision') {
    return `${fromName}に、館の見取り図や通路の位置を教えてほしいと頼まれた。こんな時間になぜそんなことを聞くのかと思いながらも、聞かれたことだけを答えた。その情報がどう使われたかは知らない。`
  }
  if (type === 'false_alibi') {
    return `${fromName}から「もし誰かに聞かれたら、T2はふたりで話していたと答えてほしい」と頼まれた。実際は別々にいたが、なぜそんなことを頼むのかを聞かずに承諾した。`
  }
  if (type === 'distraction') {
    return `${fromName}に「人目を引くような些細な騒ぎを起こしてほしい」と頼まれた。詳しい理由は教えてもらえなかったが、言われた通りに動いた。自分が何かの計画に使われたとは知らない。`
  }
  if (type === 'evidence_disposal') {
    return `${fromName}から包まれた何かを渡され「誰にも見られないよう捨ててきてほしい」と頼まれた。中身は確認していない。自分が何を処分したのか、今も知らない。`
  }
  if (type === 'key_provision') {
    return `${fromName}に「今夜だけ合鍵を貸してほしい」と頼まれた。「大事なものを確認するだけだ」と言われたが、それ以上の説明はなかった。鍵がどう使われたかは知らない。`
  }
  // silence_deal
  return `T2の頃、${fromName}と目が合った。あの瞬間、見られたと悟った。その後、${fromName}が静かに近づいてきた。「あのことは、誰にも話さない。ただ、今夜の話し合いで少しだけ協力してほしい」。断ることもできたが——できなかった。あなたは無言でうなずいた。`
}

function generateConnections(slots: CharacterSlot[]): PlayerConnection[] {
  if (slots.length < 2) return []
  const count = Math.floor(Math.random() * 3)  // 0, 1, 2 — equally likely
  if (count === 0) return []
  const result: PlayerConnection[] = []
  const used = new Set<string>()
  const shuffled = shuffle(slots)
  const types: ConnectionType[] = [
    'lookout', 'preparation', 'silence_deal',
    'weapon_supply', 'victim_lure', 'map_provision',
    'false_alibi', 'distraction', 'evidence_disposal', 'key_provision',
  ]

  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const from = shuffled[Math.floor(Math.random() * shuffled.length)]
      const to = shuffled[Math.floor(Math.random() * shuffled.length)]
      if (from === to) continue
      const key = from < to ? `${from}-${to}` : `${to}-${from}`
      if (used.has(key)) continue
      used.add(key)
      const type = types[Math.floor(Math.random() * types.length)]
      result.push({
        fromSlot: from,
        toSlot: to,
        type,
        fromText: naturalizeTime(connFromText(type, CHARACTERS[to].name)),
        toText: naturalizeTime(connToText(type, CHARACTERS[from].name)),
      })
      break
    }
  }
  return result
}

// ── cooperation chain (anonymous chain coordination) ──────────

const CHAIN_METHODS: ChainContactMethod[] = ['anonymous_phone', 'anonymous_letter', 'blackmail_face']
const ANON_METHODS: ChainContactMethod[] = ['anonymous_phone', 'anonymous_letter']

function buildChainLink(
  from: CharacterSlot,
  to: CharacterSlot,
  method: ChainContactMethod,
  relayTo?: CharacterSlot,
  relayMethod?: ChainContactMethod,
): ChainLink {
  const toName = CHARACTERS[to].name
  const fromName = CHARACTERS[from].name
  const relayToName = relayTo ? CHARACTERS[relayTo].name : undefined
  const senderKnown = method === 'blackmail_face'

  const relayInstructionFrom = relayTo && relayToName
    ? `また、${relayToName}に対しても${relayMethod === 'anonymous_letter' ? '差出人不明の手紙を届けるよう' : relayMethod === 'blackmail_face' ? '直接接触するよう' : '声を変えて電話するよう'}命じた。${toName}があなたとの繋がりを${relayToName}に明かすことはない——あなたとCとの直接の繋がりは存在しない。`
    : ''

  const relayReceiveText = relayTo && relayToName
    ? `さらに「${relayToName}に${relayMethod === 'anonymous_letter' ? '封書を届けろ' : relayMethod === 'blackmail_face' ? '直接接触せよ' : '匿名で連絡せよ'}」とも命じられた。あなたは言われた通り${relayToName}に接触した。`
    : ''

  let fromText: string
  if (method === 'anonymous_phone') {
    fromText = `あなたは変声器を使い、${toName}に電話で接触した。「今夜の計画に従え。断れば秘密を暴く」と告げた。${toName}はあなたの正体を知らない。${relayInstructionFrom}`
  } else if (method === 'anonymous_letter') {
    fromText = `あなたは差出人不明の手紙を${toName}に届け、今夜の凶行への協力を命じた。筆跡を変え、証拠を残さないよう細心の注意を払った。${toName}はあなたの正体を知らない。${relayInstructionFrom}`
  } else {
    fromText = `あなたは${toName}の弱みを握り、直接対面して脅迫した。「今夜の凶行に協力しろ。断れば秘密を暴く」と告げた。${toName}はあなたが${fromName}であることを知っているが、計画の全容は告げていない。${relayInstructionFrom}`
  }

  let toText: string
  if (method === 'anonymous_phone') {
    toText = `T2の直前、声を変えた電話がかかってきた。「今夜の凶行に従え。断れば秘密を暴く」と脅された。送り主は名乗らず——誰からの電話かわからない。${relayReceiveText}その指示に従うしかなかった。`
  } else if (method === 'anonymous_letter') {
    toText = `今夜の始まる前、差出人のない封書が手元に届いた。「今夜の凶行に従え。断れば秘密を暴く」とあった。誰が送ってきたのかわからない。${relayReceiveText}指示に従うしかなかった。`
  } else {
    toText = `${fromName}に弱みを握られていた。直接「今夜の凶行に協力しろ。断れば秘密を暴く」と脅された。${fromName}が何を企んでいるかは教えてもらえなかった。${relayReceiveText}逆らえなかった。`
  }

  return { fromSlot: from, toSlot: to, method, senderKnown, relayToSlot: relayTo, relayMethod, fromText: naturalizeTime(fromText), toText: naturalizeTime(toText) }
}

function generateCooperationChain(killerSlots: CharacterSlot[]): CooperationChain | null {
  if (killerSlots.length < 2) return null
  const chainThreshold = 0.01 + Math.random() * 0.89  // 1〜90% variable
  if (Math.random() < (1 - chainThreshold)) return null

  const shuffled = shuffle(killerSlots)
  const mastermind = shuffled[0]
  const links: ChainLink[] = []

  if (killerSlots.length === 2) {
    // A → B
    links.push(buildChainLink(mastermind, shuffled[1], pickRandom(CHAIN_METHODS)))
  } else if (killerSlots.length === 3) {
    if (Math.random() < 0.5) {
      // Chain: A → B (relay to C) → C
      const relay = shuffled[1]
      const foot = shuffled[2]
      const m1 = pickRandom(CHAIN_METHODS)
      const m2 = pickRandom(ANON_METHODS)
      links.push(buildChainLink(mastermind, relay, m1, foot, m2))
      links.push(buildChainLink(relay, foot, m2))
    } else {
      // Fork: A → B, A → C (both blind to each other)
      links.push(buildChainLink(mastermind, shuffled[1], pickRandom(CHAIN_METHODS)))
      links.push(buildChainLink(mastermind, shuffled[2], pickRandom(CHAIN_METHODS)))
    }
  } else {
    // 4+ killers: chain of 3 (A→B→C) + remaining as direct from A
    const relay = shuffled[1]
    const foot = shuffled[2]
    const m1 = pickRandom(CHAIN_METHODS)
    const m2 = pickRandom(ANON_METHODS)
    links.push(buildChainLink(mastermind, relay, m1, foot, m2))
    links.push(buildChainLink(relay, foot, m2))
    for (let i = 3; i < shuffled.length; i++) {
      links.push(buildChainLink(mastermind, shuffled[i], pickRandom(CHAIN_METHODS)))
    }
  }

  return { mastermindSlot: mastermind, links }
}

// ── 当主殺しの手口プロファイル ──────────────────────────────────
// 凶器・偽装・発見場所・発見時の描写を「整合した束」として持つ。
// これにより手口や場所を変えても、あらすじ・犯人ハンドアウト・マップが矛盾しない。
type DeathCat = 'natural' | 'fall' | 'hang' | 'fire'
const CAT_WEAPONS: Record<DeathCat, string[]> = {
  natural: ['poison_herb', 'sedative', 'poison_wine', 'digitalis', 'arsenic', 'tainted_tea'],  // 病死・自然死・中毒に見せる
  fall: ['dagger', 'candlestick', 'poker', 'marble_paperweight', 'wine_bottle', 'stair_trap'],  // 転落・外傷事故に見せる
  hang: ['strangling', 'cord', 'scarf'],                   // 首吊り自殺に見せる
  fire: ['arson_setup', 'oil_lamp'],                       // 失火・焼死に見せる
}
// 手口ごとに「その死が起こりうる／偽装が成立する」場所だけを許可
const CAT_LOCS: Record<DeathCat, Location[]> = {
  natural: ['master_bedroom', 'study', 'library', 'dining', 'greenhouse', 'guest_room', 'gallery'],
  fall: ['basement'],                                      // 転落＝地下へ下りる階段
  hang: ['study', 'guest_room', 'master_bedroom'],         // 梁のある部屋
  fire: ['study', 'library', 'guest_room', 'gallery'],     // 焼け落ちうる部屋
}
const CAT_DISCOVERY: Record<DeathCat, (loc: string) => string> = {
  natural: loc => `源太郎が${loc}で倒れているのが発見された。取り乱した様子はなく、急な発作で亡くなったようにも見えるが、その死にはどうにも腑に落ちない点が残った。`,
  fall: loc => `源太郎が${loc}へ下りる階段の下で、頭を強く打って倒れていた。足を踏み外して転落したようにも見えるが、現場にはどこか不自然な点が残った。`,
  hang: loc => `源太郎が${loc}で、首に索状の痕を残して事切れていた。自ら首を吊ったようにも見えるが、その死にはどうにも腑に落ちない点が残った。`,
  fire: loc => `${loc}が半ば焼け落ち、その焼け跡から源太郎が見つかった。失火による焼死のようにも見えるが、現場には不審な点が残った。`,
}
// natural を厚めに（穏やかな発見＝古典的な館ミステリーの手触り）
const DEATH_CATS: DeathCat[] = ['natural', 'natural', 'natural', 'fall', 'hang', 'fire']

// 手口カテゴリごとの「物音・におい」と「物的痕跡」（凶器と一致する手がかり）
const CAT_SOUND: Record<DeathCat, (loc: string) => string> = {
  natural: loc => `21時頃、${loc}の方から争う物音は聞こえなかった。ただ、源太郎が誰かと短く言葉を交わす声だけがした、という証言がある。`,
  fall: loc => `21時頃、${loc}の方から、重いものが落ちるような鈍い音がした、という証言がある。`,
  hang: loc => `21時頃、${loc}の方から、くぐもった短い呻き声のようなものを聞いた、という証言がある。`,
  fire: loc => `21時頃、${loc}の方から何かを引きずる音がし、しばらくして焦げ臭さが漂ってきた、という証言がある。`,
}
const CAT_TRACE: Record<DeathCat, (loc: string) => string> = {
  natural: loc => `${loc}の源太郎の傍らに、飲みかけの杯が残されていた。底にわずかな沈殿物がある。`,
  fall: loc => `${loc}の手すりと床に、いちど拭き取ろうとした血の跡が残っていた。`,
  hang: loc => `${loc}の床に、吊るす前に何かを引きずったような擦れた跡が残っていた。`,
  fire: loc => `${loc}の火元付近から、不自然に強い燃焼促進剤のにおいが検出された。`,
}

// コナン風トリック。cats='any' は全カテゴリで使える。{n}=犯人名, {loc}=犯行場所
// needsPrep=true は事前準備が要る（＝計画的犯行でしか使えない）。
// needsPrep=false は犯行後にその場で即席にできる（＝衝動的な口封じのあとでも使える）。
const TRICKS: { name: string; cats: 'any' | DeathCat[]; needsPrep: boolean; build: (loc: string) => { appearance: string; flaw: string; note: string } }[] = [
  {
    name: '録音による生存偽装トリック',
    cats: 'any',
    needsPrep: true,
    build: loc => ({
      appearance: `犯行のあった後になっても、${loc}の方から源太郎本人の声が聞こえた——だから源太郎はその時刻まで生きていた、と多くの者が思い込んでいる。`,
      flaw: `だが聞こえた「源太郎の声」は、いつも決まって同じ一言の繰り返しだった。後に、部屋の隅から小型の録音機が見つかっている。`,
      note: `あなたは源太郎の声を録音しておき、犯行の後に${loc}からそれを流した。皆が「その時刻まで源太郎は生きていた」と錯覚し、あなたのアリバイが成立した。録音機を回収し損ねていないか気を配ること。`,
    }),
  },
  {
    name: '替え玉による目撃偽装トリック',
    cats: 'any',
    needsPrep: true,
    build: loc => ({
      appearance: `犯行の後、${loc}の窓辺に源太郎らしき人影が立っているのを遠目に見た、という証言がある。だから源太郎はその時刻まで生きていた、と思われている。`,
      flaw: `だがその人影は、源太郎にしては背が高すぎたという。源太郎が決して着なかったはずの色の上着をまとっていた、とも。`,
      note: `あなたは源太郎の上着を着た人物を${loc}の窓辺に立たせ、遠目に「生きている源太郎」を演じさせた。おかげで死亡時刻がずれて見え、あなたのアリバイが成立している。`,
    }),
  },
  {
    name: '時計の細工による死亡時刻偽装トリック',
    cats: ['fall', 'natural'],
    needsPrep: false,
    build: loc => ({
      appearance: `${loc}に落ちて止まっていた時計は、実際よりも遅い時刻を指していた。そのため、源太郎はもっと遅い時刻に亡くなったと思われている。`,
      flaw: `だがその時計は「数日前から進みがおかしい」と源太郎自身がこぼしていた。止まった時刻をそのまま信じることはできない。冷めきった料理が、本当の時刻を物語っている。`,
      note: `あなたは現場の時計に細工をして、死亡時刻を実際より遅く見せかけた。その"遅い時刻"にはあなたのアリバイがある。時計以外の時間の手がかり（冷めた料理、溶けた氷）に矛盾が出ていないか注意すること。`,
    }),
  },
  {
    name: '施錠トリック（外からの密室工作）',
    cats: ['hang', 'fall'],
    needsPrep: false,
    build: loc => ({
      appearance: `${loc}の扉は内側から施錠されていた。そのため、これは事件ではなく源太郎自身の身に起きたこと（自死や事故）だと思われている。`,
      flaw: `だが鍵穴の内側に、細い糸か針でこすったような真新しい傷が残っていた。扉は、外から施錠された可能性がある。`,
      note: `あなたは糸を使い、${loc}の扉を外側から施錠して密室を装った。密室であること自体が「他殺ではない」という思い込みを生み、あなたのアリバイを守っている。糸や器具を残していないか気を配ること。`,
    }),
  },
  {
    name: '体温操作による死亡時刻偽装トリック',
    cats: ['natural', 'fall', 'hang'],
    needsPrep: false,
    build: loc => ({
      appearance: `${loc}の遺体はまだ温もりを残しているように感じられ、そこから見積もられた死亡推定時刻は実際よりかなり遅かった。その遅い時刻には、主だった者にアリバイがある。`,
      flaw: `だが死後硬直と死斑の進み具合は、もっと早い時刻の死を示していた。${loc}の暖炉の灰が不自然に掻き乱され、遺体の背にだけ妙な温もりが残っている。`,
      note: `あなたは犯行後、遺体を暖炉のそばで温め、体温から割り出される死亡推定時刻を実際より遅らせた。その"遅い時刻"にはあなたのアリバイがある。ただし死後硬直や死斑までは操作できない——そこを突かれると危うい。`,
    }),
  },
  {
    name: '首吊り自殺への偽装トリック',
    cats: ['hang'],
    needsPrep: false,
    build: loc => ({
      appearance: `${loc}で源太郎は首を吊った状態で見つかった。誰もがこれを源太郎自身の首吊り自殺だと思い込んでいる。`,
      flaw: `だが首の索条痕は二重になっており、吊るされる前にすでに絞められた跡が残っていた。足場の台は、源太郎の背では届かない位置にある。`,
      note: `あなたは源太郎を絞めたあと、自殺に見せかけて${loc}で首を吊らせた。「自殺＝事件性なし」という思い込みがあなたを守っている。だが索条痕の向きや二重の痕、足場の位置を検分されると偽装が露見する。`,
    }),
  },
  {
    name: '転落事故への偽装トリック',
    cats: ['fall'],
    needsPrep: false,
    build: loc => ({
      appearance: `源太郎は${loc}へ下りる階段の下で倒れており、暗がりで足を踏み外した不運な転落事故のように見えている。`,
      flaw: `だが致命傷は後頭部にあるのに、遺体はうつ伏せに倒れていた——転落では説明がつかない。落下ではできない、それ以前の打撲の跡も残っている。`,
      note: `あなたは源太郎を手にかけたあと、${loc}の階段下へ横たえ、足を滑らせた転落事故に見せかけた。だが傷の位置と倒れ方の矛盾、落下前の打撲を見抜かれると、事故ではないと露見する。`,
    }),
  },
  {
    name: '一人二役（被害者へのなりすまし）トリック',
    cats: 'any',
    needsPrep: true,
    build: loc => ({
      appearance: `犯行のあった後になっても、源太郎らしき人物が${loc}付近を歩いているのを見た、という証言がある。だから源太郎はその時刻まで生きていた、と思われている。`,
      flaw: `だが源太郎とその人物が同時に目撃された場面は一度もない。その"源太郎"は左手で扉を開けていた——源太郎は右利きだったはずだ。`,
      note: `あなたは源太郎の身なりを真似て変装し、死亡後も「生きている源太郎」を演じて歩き回った。おかげで死亡時刻が遅く見積もられ、あなたのアリバイが成立している。声や利き手、体格の綻びを見抜かれないよう気を配ること。`,
    }),
  },
  {
    name: '氷による密室偽装トリック',
    cats: ['hang', 'fall'],
    needsPrep: true,
    build: loc => ({
      appearance: `${loc}の扉は内側からつっかい棒で固く閉ざされ、外からは決して入れない密室だった。だからこれは他殺ではなく、源太郎自身の身に起きたことだと思われている。`,
      flaw: `だが扉の内側の床には、説明のつかない水たまりと濡れ跡が残っていた。室内は季節に合わず妙に冷え込んでいる。`,
      note: `あなたは嵐の寒気で凍らせた氷を扉のつっかい棒代わりにし、外へ出たあと氷が溶けて自然に施錠された密室を装った。溶けた水の跡を残していないか、気を配ること。`,
    }),
  },
  {
    name: '時間差毒殺トリック',
    cats: ['natural'],
    needsPrep: true,
    build: loc => ({
      appearance: `源太郎は夜、${loc}で誰かと杯を交わしたあと、しばらくして急に苦しみだして亡くなった。だから「一緒にいて別れたあとの急死＝同席者は無関係」と思われている。`,
      flaw: `だが源太郎の杯だけ、底に溶け残ったカプセルの殻のようなものが沈んでいた。口にしてから発症までの時間の空きが、遅効性の毒を疑わせる。`,
      note: `あなたは遅効性の毒（溶けやすいカプセルなどの細工）を源太郎の杯に仕込み、その場を立ち去った。あなたが去ってから源太郎が倒れたため、あなたは無関係に見える。だが杯に残った痕跡と発症の時間差が毒殺を示している。`,
    }),
  },
  {
    name: '仕掛けの物音による死亡時刻偽装トリック',
    cats: ['fall', 'hang'],
    needsPrep: true,
    build: loc => ({
      appearance: `${loc}の方から物音や短い叫びが聞こえたのは、もっと遅い時刻だった。だから源太郎が絶命したのはその時刻で、そのときあなたは皆と一緒にいた——と思われている。`,
      flaw: `だが遺体の傷や冷えは、その音よりずっと早い時刻の死を示している。${loc}の隅からは、焦げた紙片と、はじけた小さな仕掛けの残骸が見つかった。`,
      note: `あなたは源太郎を早い時刻に手にかけたあと、後から音が鳴る仕掛け（爆ぜる紙筒など）を残しておいた。皆がその"音"を死亡時刻と信じ込み、そのときあなたにはアリバイがある。仕掛けの残骸を回収し損ねていないか注意すること。`,
    }),
  },
  {
    name: '発見時施錠（潜伏・早業）トリック',
    cats: ['natural', 'fall', 'hang'],
    needsPrep: false,
    build: loc => ({
      appearance: `${loc}の扉は内側から施錠されており、皆で押し破って入ったときには源太郎はすでに事切れていた。完全な密室で、外からは手を下せない——だから事件ではないと思われている。`,
      flaw: `だが真っ先に「扉を破ろう」と言い出したのはあなただった。押し破る混乱のわずかな隙に、内側の鍵をかける（あるいは抜け出す）ことはできる。物陰には、人が潜んでいた埃の乱れが残っていた。`,
      note: `あなたは${loc}に潜んで犯行におよび、皆が扉を破る混乱に紛れて内側から施錠する（あるいは抜け出す）ことで密室を装った。自分から進んで扉を破ろうとする不自然さや、潜伏の痕跡を見抜かれないよう立ち回ること。`,
    }),
  },
  {
    name: 'ダイイングメッセージ捏造トリック',
    cats: ['natural', 'fall', 'hang'],
    needsPrep: false,
    build: loc => ({
      appearance: `${loc}の源太郎のそばには、血で乱暴に書かれた文字が残されていた。まるで源太郎が最期に犯人の名を書き遺したかのように読め、ある人物へ疑いが向いている。`,
      flaw: `だがその血文字は、源太郎が息絶えた"あと"に付いた血で書かれていた。筆跡も、源太郎の利き手とは逆の手で書いたように歪んでいる——捏造されたものだ。`,
      note: `あなたは源太郎を手にかけたあと、偽のダイイングメッセージを残し、別の無実の人物へ疑いが向くよう仕向けた。だが死後に付いた血や、利き手と逆の不自然な筆跡を見抜かれると、捏造だと露見する。`,
    }),
  },
  {
    name: '薬のすり替えによる病死偽装トリック',
    cats: ['natural'],
    needsPrep: true,
    build: loc => ({
      appearance: `源太郎は持病を抱えており、${loc}で発作を起こして急死したように見えた。だから「持病による病死＝事件性なし」と思われている。`,
      flaw: `だが源太郎の常用薬が、よく似た別の錠剤とすり替えられていた。空の薬包が不自然な場所から見つかり、発作は誘発された疑いが濃い。`,
      note: `あなたは源太郎の常用薬を似た偽薬とすり替え、持病の発作を誘発して病死に見せかけた。直接手を下していないぶん足はつきにくいが、すり替えた薬や空の薬包が残っていると露見する。`,
    }),
  },
  {
    name: '合鍵のすり替え（第一発見者）トリック',
    cats: ['natural', 'fall', 'hang'],
    needsPrep: true,
    build: loc => ({
      appearance: `${loc}の扉は施錠され、源太郎の鍵は室内にあった。押し入って最初に鍵を確かめたのはあなただ——鍵は一貫して室内にあり、外部の者には手を下せない、と思われている。`,
      flaw: `だが室内で見つかった鍵は、源太郎のものにしては摩耗や刻印がわずかに違っていた。源太郎の鍵束からは、本来あるはずの一本が消えている。`,
      note: `あなたは扉を破る第一発見者を装い、混乱に紛れて用意した合鍵と現場の鍵をすり替えた。「鍵はずっと室内にあった」という思い込みが密室を成立させている。合鍵の細部の違いや、源太郎の鍵束の不足を突かれると露見する。`,
    }),
  },
  {
    name: '鍵の所在の錯誤（懐への返却）トリック',
    cats: ['natural', 'fall', 'hang'],
    needsPrep: false,
    build: loc => ({
      appearance: `${loc}の唯一の鍵は、源太郎自身の懐に収まっていた。本人が中から施錠したとしか考えられず、これは他殺ではない——そう思われている。`,
      flaw: `だが鍵は、死後硬直の始まった指に無理やり握らせたように不自然に収まっていた。本人が握ったなら残るはずの手のぬくもりの跡もない。`,
      note: `あなたは犯行後、${loc}の鍵を源太郎の懐に戻し、「本人が中から施錠した密室」を装った。だが死後に握らせた不自然さや、死斑と手の位置の矛盾を検分されると露見する。`,
    }),
  },
  {
    name: '凶器の移送（配膳用昇降機）トリック',
    cats: ['fall'],
    needsPrep: false,
    build: loc => ({
      appearance: `源太郎は撲たれて倒れていたのに、${loc}のどこを探しても凶器が見つからない。だから「凶器を持ち去れた外部の者の仕業だ」と思われている。`,
      flaw: `だが${loc}の配膳用昇降機の滑車に、真新しい油と埃の擦れ跡が残っていた。庫内には、重いものを載せた跡がある。`,
      note: `あなたは源太郎を手にかけたあと、凶器を配膳用昇降機に載せて別の階へ送り、現場から消した。凶器がないことで疑いが外部へ逸れている。昇降機に残した痕跡を拭い忘れていないか気を配ること。`,
    }),
  },
  {
    name: '隠し扉からの退出（回転本棚）トリック',
    cats: ['natural', 'fall', 'hang'],
    needsPrep: true,
    build: loc => ({
      appearance: `${loc}の扉は内側から施錠されていた。完全な密室で、源太郎は一人きりだった——だから他殺ではないと思われている。`,
      flaw: `だが${loc}の本棚の前の絨毯に、扇形の擦り跡が残っていた。背表紙の一列だけ、埃の付き方が違う。壁のどこかに隠し口があるのだ。`,
      note: `あなたは正規の扉を内側から施錠したうえで、${loc}に隠された回転本棚（隠し扉）から抜け出し、完全な密室を装った。隠し口の存在を知る者は限られる——絨毯の擦り跡や埃の乱れを見抜かれると、あなたに疑いが向く。`,
    }),
  },
  {
    name: '永久磁石による施錠（無電源の物理密室）トリック',
    cats: ['hang', 'fall'],
    needsPrep: true,
    build: loc => ({
      appearance: `${loc}の鉄製のかんぬきは内側から掛かっており、外からは決して閉められない。完全な密室だ、と思われている。`,
      flaw: `だが扉のかんぬきに方位磁石を近づけると、針が大きく振れた——金属が磁化している。外から強い磁石でかんぬきを動かした跡だ。`,
      note: `あなたは退室後、扉の隙間から強力な永久磁石で鉄のかんぬきを動かし、外から施錠された密室を作った。かんぬきに残った磁化（鉄粉の付着）を見抜かれると露見する。`,
    }),
  },
  {
    name: '偽りの目撃証言の植え付け（暗示）トリック',
    cats: ['natural', 'fall', 'hang'],
    needsPrep: false,
    build: loc => ({
      appearance: `複数の招待客が「もっと遅い時刻に、源太郎が生きて歩いているのを見た」と証言している。だから源太郎はその時刻まで生きていた、と信じられている。`,
      flaw: `だがその「目撃」された時刻、${loc}の源太郎はすでに息絶え、死斑が浮き始めていたはずだ。複数の証言は、あとから誰かに刷り込まれた偽りだった。`,
      note: `あなたは犯行の前後、他の招待客に「さっき源太郎が歩いていた」と暗示・反復して刷り込み、偽の目撃証言を他人の口から言わせて死亡時刻をずらした。だが停電の暗がりや死斑の状態と証言の矛盾を突かれると、崩れる。`,
    }),
  },
]

export function generateScenario(
  playerCount: number,
  mode: GameMode
): Scenario {
  const slots = getSlotsForCount(playerCount)
  const shuffledSlots = shuffle(slots)

  // ── killers ───────────────────────────────────────────────
  let killerSlots: CharacterSlot[]
  let outsideKiller = false
  let suicide = false
  if (mode === 'puzzle') {
    killerSlots = [...slots]
  } else {
    // 1-killer = 50%; rest = 50% split among: multi-killers (2..n-1) + outside killer + suicide
    // multiKillerCount = max(0, n-2), remainingOptions = multiKillerCount + 2
    const multiKillerCount = Math.max(0, slots.length - 2)
    const remainingOptions = multiKillerCount + 2

    let roll: number
    if (Math.random() < 0.5) {
      roll = 0
    } else {
      roll = 1 + Math.floor(Math.random() * remainingOptions)
    }

    if (roll === 0) {
      killerSlots = shuffledSlots.slice(0, 1)
    } else {
      const idx = roll - 1  // 0-based index into remaining options
      if (idx < multiKillerCount) {
        killerSlots = shuffledSlots.slice(0, idx + 2)
      } else if (idx === multiKillerCount) {
        killerSlots = []
        outsideKiller = true
      } else {
        killerSlots = []
        suicide = true
      }
    }
  }

  // ── roles ─────────────────────────────────────────────────
  const roles = {} as Partial<Record<CharacterSlot, 'killer' | 'innocent'>>
  for (const s of slots) {
    roles[s] = killerSlots.includes(s) ? 'killer' : 'innocent'
  }

  // ── victims ───────────────────────────────────────────────
  // puzzle mode: every player kills the next in a cycle (all are victims too)
  // non-puzzle: no player characters die — only NPCs
  let victims: VictimInfo[] = []
  let npcVictims: NpcVictim[] = []

  // helper: build a NpcVictim from an EXTRA_NPCS entry (guarantees location/time fields)
  type ExtraNpc = (typeof EXTRA_NPCS)[number]
  const mkNpc = (npc: ExtraNpc, murder: boolean, extra: Partial<NpcVictim> = {}): NpcVictim => ({
    name: npc.role,
    role: npc.role,
    apparentCause: murder ? npc.disguisedMurderCause : npc.naturalDeathCause,
    deathLocation: npc.deathLocation,
    deathTime: npc.deathTime,
    causeFinding: npc.causeFinding,
    causeContradiction: npc.causeContradiction,
    isRelatedToCase: murder,
    ...extra,
  })

  if (mode === 'puzzle') {
    victims = slots.map(slot => ({
      slot,
      background: pickRandom(VICTIM_BACKGROUNDS).detail,
    }))
  } else if (suicide) {
    // 当主が自ら命を絶った夜 — 関係者は誰も殺されていない（0〜2件の自然死がノイズとして混入）
    const shuffledNpcs = shuffle(EXTRA_NPCS)
    const naturalNpcs = shuffledNpcs.slice(0, Math.floor(Math.random() * 3))
    npcVictims = naturalNpcs.map(npc => mkNpc(npc, false))
  } else if (outsideKiller) {
    const shuffledNpcs = shuffle(EXTRA_NPCS)
    // Hitman killed 2–4 NPCs; rest died naturally (noise)
    const numMurderNpcs = Math.floor(Math.random() * 3) + 2
    const murderNpcs = shuffledNpcs.slice(0, numMurderNpcs)
    const naturalNpcs = shuffledNpcs.slice(numMurderNpcs, numMurderNpcs + Math.floor(Math.random() * 3))

    npcVictims = [
      // killerSlot intentionally undefined — hitman, not a player
      ...murderNpcs.map(npc => mkNpc(npc, true, { trueMurderDetail: npc.hitmanMurderDetail })),
      ...naturalNpcs.map(npc => mkNpc(npc, false)),
    ]
  } else {
    const shuffledNpcs = shuffle(EXTRA_NPCS)
    const numKillers = killerSlots.length
    const dualThreshold = 0.01 + Math.random() * 0.89  // 1〜90% variable
    const dualActive = numKillers >= 2 && Math.random() < dualThreshold

    if (dualActive) {
      type DualCategory = 'poison' | 'physical' | 'environmental'
      const POISON_NPC_IDS = ['cook', 'maid_haru', 'gardener', 'secretary', 'footman', 'accountant']
      const PHYSICAL_NPC_IDS = ['lawyer', 'maid_tsuki', 'night_guard']
      const ENVIRONMENTAL_NPC_IDS = ['driver']
      const PATTERNS_BY_CATEGORY: Record<DualCategory, DualKillerPattern[]> = {
        poison: ['poison_then_weapon', 'weapon_found_dead', 'weapon_then_poison', 'poison_failed_weapon_killed'],
        physical: ['double_weapon_first_failed', 'double_weapon_overlap'],
        environmental: ['environment_then_weapon'],
      }
      const chosenCategory = pickRandom<DualCategory>(['poison', 'physical', 'environmental'])
      const preferredIds = chosenCategory === 'poison' ? POISON_NPC_IDS
        : chosenCategory === 'physical' ? PHYSICAL_NPC_IDS
        : ENVIRONMENTAL_NPC_IDS
      const sharedNpc = shuffledNpcs.find(n => preferredIds.includes(n.id)) ?? shuffledNpcs[0]
      const remainingNpcs = shuffledNpcs.filter(n => n.id !== sharedNpc.id)
      const soloNpcs = remainingNpcs.slice(0, numKillers - 2)  // killers[2+]
      const naturalNpcs = remainingNpcs.slice(numKillers - 2, numKillers - 2 + Math.floor(Math.random() * 3))
      const chosenDualPattern = pickRandom(PATTERNS_BY_CATEGORY[chosenCategory])

      npcVictims = [
        mkNpc(sharedNpc, true, {
          trueMurderDetail: undefined,  // filled after killers are built
          killerSlot: killerSlots[0],
          secondKillerSlot: killerSlots[1],
          dualKillerPattern: chosenDualPattern,
        }),
        ...soloNpcs.map((npc, i) => mkNpc(npc, true, {
          trueMurderDetail: npc.trueMurderDetail,
          killerSlot: killerSlots[i + 2],
        })),
        ...naturalNpcs.map(npc => mkNpc(npc, false)),
      ]
    } else {
      // 当主殺しは killers[0] のみ。追加の犯人は「口封じ」で目撃したNPCを殺害する
      const npcKillerSlots = killerSlots.slice(1)
      const murderNpcs = shuffledNpcs.slice(0, npcKillerSlots.length)
      const naturalNpcs = shuffledNpcs.slice(npcKillerSlots.length, npcKillerSlots.length + Math.floor(Math.random() * 3))

      npcVictims = [
        ...murderNpcs.map((npc, i) => mkNpc(npc, true, {
          trueMurderDetail: npc.trueMurderDetail,
          killerSlot: npcKillerSlots[i],
        })),
        ...naturalNpcs.map(npc => mkNpc(npc, false)),
      ]
    }
  }

  // ── killers (with victim assignment) ─────────────────────
  const poisonWeapons = WEAPONS.filter(w => w.isPoison)
  const physicalWeapons = WEAPONS.filter(w => !w.isPoison && !w.isEnvironmental)
  const environmentalWeapons = WEAPONS.filter(w => w.isEnvironmental)
  const dualPattern = npcVictims[0]?.dualKillerPattern

  // 二重犯行も当主殺し。凶行＝遺体発見場所（毎回ランダムに変え、あらすじ・ハンドアウトと一致させる）
  const DUAL_LOCS: Location[] = ['study', 'library', 'dining', 'gallery', 'greenhouse', 'guest_room', 'basement', 'master_bedroom']
  const sharedLocation: Location | null = dualPattern ? pickRandom(DUAL_LOCS) : null

  // Pre-build the dual pair so weapon[1] can avoid repeating weapon[0]
  type DualPair = [KillerInfo, KillerInfo]
  const preDual: DualPair | null = (() => {
    if (!dualPattern) return null
    const isEnv = dualPattern === 'environment_then_weapon'
    const isDbl = dualPattern === 'double_weapon_first_failed' || dualPattern === 'double_weapon_overlap'
    const method0: 'poison' | 'weapon' | 'environmental' =
      isEnv ? 'environmental' : isDbl ? 'weapon' : 'poison'
    const w0 = isEnv ? pickRandom(environmentalWeapons) :
               method0 === 'poison' ? pickRandom(poisonWeapons) :
               pickRandom(physicalWeapons)
    const w1 = isDbl
      ? pickRandom(physicalWeapons.filter(w => w.id !== w0.id))
      : pickRandom(physicalWeapons)
    const vName = MAIN_VICTIM.name
    return [
      { slot: killerSlots[0], victimName: vName, weapon: w0, location: sharedLocation!, method: method0, isDualKiller: true },
      { slot: killerSlots[1], victimName: vName, weapon: w1, location: sharedLocation!, method: 'weapon' as const, isDualKiller: true },
    ]
  })()

  // ── 当主殺しの発見状況（手口・場所・描写を整合させる）──────────────
  // mainVictimLocation = 遺体の"発見"場所（マップ★・あらすじ）
  // mainMurderLocation = 実際の"犯行"現場（犯人がいた場所）。通常は発見場所と同じだが、
  //   死体移動トリックのときだけ別室になる（死斑の手がかりで露見する）。
  let mainVictimLocation: Location
  let mainMurderLocationOpt: Location | null = null  // 犯行現場（死体移動時のみ発見場所と別。それ以外はnull→発見場所を使う）
  let deathDiscovery: string
  let mainMurderWeapon: Weapon | null = null   // 非二重・プレイヤー犯の当主殺しに使う凶器
  let mainCat: DeathCat | null = null          // 当主殺しの手口カテゴリ（トリック生成に使う）
  let bodyMoved = false
  let remoteDevice = false   // 遠隔・自動殺人装置：犯人は犯行時刻に現場不在
  // 死体を移す可能性のある発見場所（人目につく／運び込みやすい部屋）
  const DISCOVERY_LOCS: Location[] = ['study', 'library', 'dining', 'gallery', 'greenhouse', 'guest_room', 'master_bedroom']
  if (mode === 'puzzle') {
    mainVictimLocation = 'master_bedroom'
    deathDiscovery = `源太郎が${LOCATION_NAMES[mainVictimLocation]}で事切れているのが発見された。その死には不審な点が残った。`
  } else if (suicide) {
    mainVictimLocation = pickRandom(CAT_LOCS.natural)
    deathDiscovery = `源太郎が${LOCATION_NAMES[mainVictimLocation]}で事切れているのが発見された。取り乱した様子はなく、一見おだやかな死のようにも見えるが、その死にはどうにも腑に落ちない点が残った。`
  } else if (outsideKiller) {
    mainVictimLocation = pickRandom(CAT_LOCS.natural)
    deathDiscovery = `源太郎が${LOCATION_NAMES[mainVictimLocation]}で倒れているのが発見された。表向きは急な発作のようだが、現場には見過ごせない不審な点が残った。`
  } else if (dualPattern) {
    mainVictimLocation = sharedLocation!
    deathDiscovery = `源太郎が${LOCATION_NAMES[mainVictimLocation]}で複数の傷を負って倒れていた。ひと目で穏やかな死でないことは分かるが、その経緯は判然としない。`
  } else {
    const cat = pickRandom(DEATH_CATS)
    mainCat = cat
    const murderLoc = pickRandom(CAT_LOCS[cat])
    // 遠隔・自動殺人装置：転落系のときのみ、一定確率で。犯人は罠を仕掛け犯行時は不在。
    remoteDevice = cat === 'fall' && Math.random() < 0.35
    const wid = remoteDevice ? 'stair_trap' : pickRandom(CAT_WEAPONS[cat])
    mainMurderWeapon = WEAPONS.find(w => w.id === wid) ?? pickRandom(poisonWeapons)
    // 死体移動：発見場所を犯行現場と別室にする。ただし転落・首吊り・焼死は
    // 偽装が場所（階段・梁・火元）に依存するため移動させると破綻する。
    // 病死・中毒（natural）だけは死の外見が場所非依存なので、移動しても偽装が成立する。
    bodyMoved = !remoteDevice && cat === 'natural' && Math.random() < 0.35
    const discoveryLoc = bodyMoved
      ? pickRandom(DISCOVERY_LOCS.filter(l => l !== murderLoc))
      : murderLoc
    mainMurderLocationOpt = murderLoc
    mainVictimLocation = discoveryLoc
    deathDiscovery = bodyMoved
      ? `源太郎が${LOCATION_NAMES[discoveryLoc]}で倒れているのが発見された。だが床には何かを引きずったような跡が残り、本当にこの場所で息絶えたのか、どうにも腑に落ちない点があった。`
      : CAT_DISCOVERY[cat](LOCATION_NAMES[murderLoc])
  }
  // 犯行現場：死体移動シナリオのみ発見場所と異なる。それ以外は発見場所＝犯行現場。
  const mainMurderLocation: Location = mainMurderLocationOpt ?? mainVictimLocation

  // 口封じでNPCを殺した犯人（slot→NPC役職）。二重犯行の当主殺し(dualKillerPattern付き)は除外
  const npcKillMap: Partial<Record<CharacterSlot, string>> = {}
  for (const v of npcVictims) {
    if (v.isRelatedToCase && v.killerSlot && !v.dualKillerPattern) {
      npcKillMap[v.killerSlot] = v.role
    }
  }

  const killers: KillerInfo[] = killerSlots.map((slot, i) => {
    if (preDual && i === 0) return preDual[0]
    if (preDual && i === 1) return preDual[1]

    let victimSlot: CharacterSlot | undefined
    let victimName: string | undefined
    let location: Location
    let weapon

    if (mode === 'puzzle') {
      const idx = slots.indexOf(slot)
      victimSlot = slots[(idx + 1) % slots.length]
      victimName = CHARACTERS[victimSlot]?.name
      location = pickRandom(CRIME_SCENE_LOCATIONS)
      weapon = pickRandom(WEAPONS.filter(w => !w.isEnvironmental))
    } else if (npcKillMap[slot]) {
      // 口封じ犯：目撃したNPCを殺害。凶器・偽装死因はそのNPCの死因と一致させる
      victimName = npcKillMap[slot]
      location = pickRandom(CRIME_SCENE_LOCATIONS)
      const def = EXTRA_NPCS.find(nn => nn.role === victimName)
      weapon = def
        ? { id: `npc_${def.id}`, name: def.method, disguisedAs: def.disguisedMurderCause }
        : pickRandom(physicalWeapons)
    } else {
      // 当主殺し：手口プロファイルで選んだ凶器・場所（＝実際の犯行現場。死体移動時は発見場所と別）
      victimName = MAIN_VICTIM.name
      location = mainMurderLocation
      weapon = mainMurderWeapon ?? pickRandom(poisonWeapons)
    }

    const method: 'weapon' | 'poison' | 'environmental' | undefined =
      victimName === MAIN_VICTIM.name && !preDual
        ? (weapon.isPoison ? 'poison' : weapon.isEnvironmental ? 'environmental' : 'weapon')
        : undefined
    return { slot, victimSlot, victimName, weapon, location, method }
  })

  // Fill trueMurderDetail for dual killer shared victim
  if (dualPattern && npcVictims[0].dualKillerPattern) {
    const k1 = killers[0]
    const k2 = killers[1]
    const k1Name = CHARACTERS[k1.slot].name
    const k2Name = CHARACTERS[k2.slot].name
    const v = MAIN_VICTIM.name

    let detail: string
    switch (dualPattern) {
      case 'poison_then_weapon':
        detail = `${k1Name}がT2に遅効性の毒（${k1.weapon.name}）を使い立ち去った。苦しみながら部屋へ戻った${v}のところへ、${k2Name}が${k2.weapon.name}を持って現れ止めを刺した。ふたりは互いの行動を知らなかった。`
        break
      case 'weapon_found_dead':
        detail = `${k1Name}がT2に遅効性の毒（${k1.weapon.name}）で${v}を毒殺した。その後、${k2Name}が凶器（${k2.weapon.name}）を持って部屋へ乗り込んだとき、すでに遺体となっていた。凶器は使われなかった。`
        break
      case 'weapon_then_poison':
        detail = `${k2Name}がT2に${v}を${k2.weapon.name}で傷つけ立ち去った。瀕死の${v}のもとへその後${k1Name}が現れ、毒（${k1.weapon.name}）を用いて止めを刺した。どちらが致命傷を与えたかは、遺体の傷を見比べても判然としない。`
        break
      case 'poison_failed_weapon_killed':
        detail = `${k1Name}がT2より前に${v}に毒（${k1.weapon.name}）を盛ったが、量が足りず死に至らなかった。独立して${v}を狙っていた${k2Name}がT2に${k2.weapon.name}で殺害した。${k1Name}は自分の毒が効いたと信じているが、実際の死因は凶器による外傷である。`
        break
      case 'double_weapon_first_failed':
        detail = `${k1Name}がT2に${k1.weapon.name}で${v}を攻撃し、動かなくなったのを見て立ち去った。しかし${v}はまだ息があり、後から現れた${k2Name}が${k2.weapon.name}で致命傷を与えた。ふたりは互いの存在を知らない。`
        break
      case 'double_weapon_overlap':
        detail = `${k1Name}と${k2Name}が、それぞれ独立に${v}を狙っていた。T2前後に両者がほぼ同時期に接触し、それぞれ別の凶器（${k1.weapon.name}と${k2.weapon.name}）で攻撃した。どちらの一撃が致命傷となったかは、遺体の傷を見比べても断定できない。`
        break
      case 'environment_then_weapon':
        detail = `${k1Name}がT2より前に${LOCATION_NAMES[k1.location]}で${k1.weapon.name}を仕掛け、${v}が罠にかかり負傷した。その場を立ち去った後、事情を知らない${k2Name}が${k2.weapon.name}を手に現れ止めを刺した。ふたりは互いの計画を知らない。`
        break
    }
    npcVictims[0] = { ...npcVictims[0], trueMurderDetail: naturalizeTime(detail) }
    if (dualPattern === 'environment_then_weapon') {
      npcVictims[0] = { ...npcVictims[0], apparentCause: killers[0].weapon.disguisedAs }
    }
  }

  // ── alibis ────────────────────────────────────────────────
  const alibis = generateAlibis(slots)

  // 犯人のアリバイ整合：犯行時刻(21時台)は必ず犯行現場にいた、という真実にそろえる。
  // 秘密行動の場所(t2Location)は20時台へ移す。これでアリバイ表・タイムライン・
  // 目撃カード（21時台に犯人を現場付近で目撃）がすべて矛盾なく噛み合う。
  for (const k of killers) {
    const a = alibis[k.slot]
    if (!a) continue
    // 当主を21時台に殺した犯人だけ現場へそろえる。NPC殺し犯は「自分の秘密行動を
    // 目撃され、後日その口を封じた」ので、事件当夜21時台は自分の秘密行動の場所にいた
    // （＝無実者と同じアリバイのまま）。ここで上書きしない。
    if (k.victimName !== MAIN_VICTIM.name) continue
    const secretSpot = CHARACTERS[k.slot].t2Location
    const isRemoteMain = remoteDevice && !k.isDualKiller && k.victimName === MAIN_VICTIM.name
    if (isRemoteMain) {
      // 遠隔犯：20時台に現場で罠を設置、21時台は別室（秘密行動の場所）でアリバイ
      const scene = k.location
      const away = secretSpot !== scene ? secretSpot : (a.T3 !== scene ? a.T3 : a.T1)
      alibis[k.slot] = {
        T1: scene,
        T2: away,
        T3: a.T3 !== scene && a.T3 !== away ? a.T3 : a.T1,
      }
    } else {
      alibis[k.slot] = {
        T1: secretSpot,
        T2: k.location,
        T3: a.T3 === k.location ? a.T1 : a.T3,
      }
    }
  }

  // ── secret actions ────────────────────────────────────────
  const secretActions = {} as Partial<Record<CharacterSlot, string>>
  for (const slot of slots) {
    secretActions[slot] = CHARACTERS[slot].secretAction
  }

  // ── puzzle targets ────────────────────────────────────────
  let puzzleTargets: Record<CharacterSlot, CharacterSlot> | undefined
  if (mode === 'puzzle') {
    puzzleTargets = {} as Record<CharacterSlot, CharacterSlot>
    for (const k of killers) {
      if (k.victimSlot) puzzleTargets[k.slot] = k.victimSlot
    }
  }

  const connections = generateConnections(slots)

  let dualKillerInfo: DualKillerInfo | undefined
  if (dualPattern && killers.length >= 2) {
    dualKillerInfo = {
      type: dualPattern,
      poisonKillerSlot: killers[0].slot,
      weaponKillerSlot: killers[1].slot,
      victimName: npcVictims[0].role,
    }
  }

  const cooperationChain =
    !outsideKiller && !suicide && mode !== 'puzzle' && killerSlots.length >= 2
      ? generateCooperationChain(killerSlots)
      : undefined

  // ── profession assignment (killer aligned with weapon category) ──────
  const POISON_PROF_IDS = ['sommelier', 'herbalist', 'pharma_researcher', 'perfumer']
  const PHYSICAL_PROF_IDS = ['locksmith', 'architect_assistant', 'acrobat', 'performer']
  const shuffledProfessions = shuffle([...PAST_PROFESSIONS])
  const assignedProfessionIds = new Set<string>()

  function pickProfForCategory(preferIds: string[]): string {
    const preferred = shuffledProfessions.find(p => preferIds.includes(p.id) && !assignedProfessionIds.has(p.id))
    if (preferred) { assignedProfessionIds.add(preferred.id); return preferred.id }
    const any = shuffledProfessions.find(p => !assignedProfessionIds.has(p.id))!
    assignedProfessionIds.add(any.id); return any.id
  }

  const assignedProfessions: Partial<Record<CharacterSlot, string>> = {}
  for (const killer of killers) {
    const prefIds = killer.weapon.isPoison ? POISON_PROF_IDS : PHYSICAL_PROF_IDS
    assignedProfessions[killer.slot] = pickProfForCategory(prefIds)
  }
  for (const slot of slots) {
    if (assignedProfessions[slot]) continue
    const prof = shuffledProfessions.find(p => !assignedProfessionIds.has(p.id))!
    assignedProfessionIds.add(prof.id)
    assignedProfessions[slot] = prof.id
  }

  // ── npc survivors (manor staff not selected as victims) ───────────────
  const usedNpcRoles = new Set(npcVictims.map(v => v.role))
  const npcSurvivors: NpcSurvivor[] = shuffle(
    EXTRA_NPCS.filter(n => !usedNpcRoles.has(n.role))
  ).slice(0, 3).map(n => ({ role: n.role }))

  // ── 当主殺しの手がかり（非二重・プレイヤー犯のみ）─────────────────────
  // 計画的犯行か、目撃されての衝動的な口封じかで大きく分岐する。
  //  ・計画的  … 事前に用意したコナン風トリック（録音・替え玉・変装など）あり
  //  ・衝動的  … 「秘密の行動を見られたから殺した」。凝ったトリックは無い（矛盾防止）
  let mainTrick: MainTrick | undefined
  if (mainCat && !outsideKiller && !suicide && mode !== 'puzzle') {
    const mainKiller = killers.find(k => k.victimName === MAIN_VICTIM.name && !k.isDualKiller)
    if (mainKiller) {
      const killerName = CHARACTERS[mainKiller.slot].name
      // 目撃・物音・痕跡・トリックはすべて"実際の犯行現場"を基準にする（死体移動時は発見場所と別）
      const locName = LOCATION_NAMES[mainMurderLocation]
      const innocentSlots = slots.filter(s => !killerSlots.includes(s))
      const premeditated = Math.random() < 0.5
      const eyeVariants = [
        `21時頃、${killerName}が${locName}の方へ急ぎ足で向かうのを廊下で見た、という証言がある。`,
        `21時頃、${killerName}が${locName}のあたりから出てくるのを見た者がいる。ひどく思いつめた様子だったという。`,
        `21時前後、${killerName}の姿だけが${locName}付近で見当たらなくなった時間がある、と複数の者が話している。`,
      ]
      // 現場の物音・痕跡・目撃は、計画的でも衝動的でも共通の「真の手がかり」
      const eyewitness = pickRandom(eyeVariants)
      const sound = CAT_SOUND[mainCat](locName)
      const trace = CAT_TRACE[mainCat](locName)

      const innocentNameG = innocentSlots.length > 0 ? CHARACTERS[pickRandom(innocentSlots)].name : '館の使用人'
      if (remoteDevice) {
        // 遠隔・自動殺人装置：犯人は20時台に現場で罠を仕掛け、犯行時刻(21時台)は別室。
        // 決定的手がかりは「装置の痕跡」＋「20時台に現場で仕掛けを設置していた目撃」。
        mainTrick = {
          name: '遠隔・自動殺人装置トリック',
          premeditated: true,
          remote: true,
          killerSlots: [mainKiller.slot],
          killerNote: `あなたは事前に${locName}へ、源太郎が通りかかると自動で作動する仕掛け（重りと糸で凶器が落ちる罠など）を設置した。そして源太郎が罠にかかった21時、あなた自身は別室で他の者と一緒にいた——犯行の瞬間に現場にいないことが、あなたの鉄壁のアリバイになっている。ただし仕掛けを固定した釘穴や糸、滑車の残骸を回収し損ねると、遠隔殺人だと露見する。`,
          eyewitness: `20時頃、${killerName}が${locName}のあたりで何かを仕掛けるように屈み込んでいるのを見た、という証言がある。`,
          sound,
          trace,
          appearance: `犯行の時刻、${killerName}は別室で他の者たちと一緒にいた。だから${killerName}に犯行は不可能だ——多くの者がそう考えている。`,
          flaw: `だが${locName}には、何かを固定するために打たれた真新しい釘穴と、切れた糸の端が残っていた。人の手を借りずに凶器が動いた——自動で作動する仕掛けがあったのだ。`,
          misdirection: `21時頃、${innocentNameG}が落ち着かない様子で廊下を行き来していた、という証言がある。`,
        }
      } else if (bodyMoved) {
        // 死体移動が主軸のシナリオ。時刻トリックや変装は重ねず（過剰・混乱を避ける）、
        // 死斑による「別室で殺され運ばれた」手がかりを決定的なものとする（後段で付与）。
        mainTrick = {
          name: '死体移動による犯行現場の偽装',
          premeditated: true,
          killerSlots: [mainKiller.slot],
          killerNote: `あなたは${locName}で源太郎を手にかけた。`,
          eyewitness,
          sound,
          trace,
          misdirection: `21時頃、${innocentNameG}が落ち着かない様子で廊下を行き来していた、という証言がある。`,
        }
      } else if (premeditated) {
        // 濡れ衣を着せる相手（変装トリックを使う場合の対象）
        const framedSlot = innocentSlots.length > 0 ? pickRandom(innocentSlots) : null
        const framedName = framedSlot ? CHARACTERS[framedSlot].name : '館の使用人'
        const usable = TRICKS.filter(t => t.cats === 'any' || t.cats.includes(mainCat!))
        const trick = pickRandom(usable)
        const built = trick.build(locName)
        mainTrick = {
          name: trick.name,
          premeditated: true,
          killerSlots: [mainKiller.slot],
          killerNote: built.note,
          eyewitness,
          sound,
          trace,
          appearance: built.appearance,
          flaw: built.flaw,
          misdirection: `21時頃、${framedName}が落ち着かない様子で廊下を行き来していた、という証言がある。`,
        }

        // 変装して無実の人物に濡れ衣を着せるトリック（コナン風）を一定確率で重ねる。
        // 濡れ衣の相手の"本当のアリバイ"（21時台は自分の秘密行動の場所にいた）と
        // 突き合わせれば、現場付近の目撃が変装だったと分かる——矛盾しない手がかりになる。
        if (framedSlot && Math.random() < 0.4) {
          const framedRealLoc = LOCATION_NAMES[alibis[framedSlot]?.T2 ?? CHARACTERS[framedSlot].t2Location]
          mainTrick.framedName = framedName
          mainTrick.framedSighting = `21時頃、${framedName}が${locName}のすぐ近くにいるのを見た、という証言がある。犯行現場のそばだ。`
          mainTrick.framedAlibi = `だが${framedName}は21時頃、確かに${framedRealLoc}にいたことが別の証言から裏づけられている。${locName}付近で見かけられた「${framedName}」は、変装した何者かだった可能性が高い。`
          mainTrick.killerNote += `\n\nさらにあなたは${framedName}の身なりを真似て変装し、わざと${locName}付近で目撃されることで、疑いを${framedName}へ向けようと仕組んだ。ただし${framedName}自身には21時頃の本当の居場所があり、そこを突かれると変装が露見する。`
        }
      } else {
        // 衝動的な口封じ：秘密の行動を目撃され、とっさに手を下した。
        // 事前準備の要るトリック（録音・替え玉）は使えないが、犯行"後"に
        // その場で即席にできる工作（時計細工・外からの施錠）なら使うことがある。
        const innocentName = innocentSlots.length > 0 ? CHARACTERS[pickRandom(innocentSlots)].name : '館の使用人'
        const improvisable = TRICKS.filter(t => !t.needsPrep && (t.cats === 'any' || t.cats.includes(mainCat!)))
        const improvises = improvisable.length > 0 && Math.random() < 0.6

        if (improvises) {
          const trick = pickRandom(improvisable)
          const built = trick.build(locName)
          mainTrick = {
            name: trick.name,
            premeditated: false,
            killerSlots: [mainKiller.slot],
            killerNote: `これは計画された殺人ではない。秘密の行動を源太郎に目撃され、露見を恐れてとっさに手を下してしまった。だが、そのまま立ち去れば真っ先に疑われる——我に返ったあなたは、その場でできる工作をとっさに施した。\n\n${built.note}\n\nただし事前に用意した計画ではなく即席の細工だ。どこかに綻びを残していないか、気を張っていなければならない。`,
            eyewitness,
            sound,
            trace,
            appearance: built.appearance,
            flaw: built.flaw,
            misdirection: `21時頃、${innocentName}が落ち着かない様子で廊下を行き来していた、という証言がある。`,
          }
        } else {
          // 工作もできず、痕跡を慌てて拭って逃げただけ。
          mainTrick = {
            name: '計画外の犯行（とっさの口封じ）',
            premeditated: false,
            killerSlots: [mainKiller.slot],
            killerNote: `これは計画された殺人ではない。あなたが秘密の行動をしているところを源太郎に目撃され、露見を恐れてとっさに手を下してしまった。凝ったアリバイ工作をする余裕はなく、せいぜい現場に残った痕跡を慌てて拭い、その場を離れるのが精一杯だった。だからこそ、慌てて消し忘れた痕跡や、犯行時刻そのものを突かれると弱い。`,
            eyewitness,
            sound,
            trace,
            misdirection: `21時頃、${innocentName}が落ち着かない様子で廊下を行き来していた、という証言がある。`,
          }
        }
      }

      // 死体移動シナリオ：発見場所と犯行現場が別。死斑の手がかりで「動かされた」と分かり、
      // 真の犯行現場（＝犯人が目撃された場所）へ捜査が戻る。
      if (bodyMoved) {
        const discoveryName = LOCATION_NAMES[mainVictimLocation]
        mainTrick.movedApparent = `源太郎は${discoveryName}で発見された。その場の様子から、多くの者はそこで倒れて息絶えたと思い込んでいる。`
        mainTrick.movedReveal = `だが源太郎の死斑は、発見時の姿勢では説明のつかない向きに出ていた——別の場所で絶命し、あとから${discoveryName}へ運ばれたのだ。遺体には${locName}特有の埃と匂いが付着しており、本当の犯行現場は${locName}だと分かる。`
        mainTrick.killerNote += `\n\nまた、あなたは犯行後、源太郎の遺体を${locName}から${discoveryName}へ運び、そこで倒れていたように見せかけて本当の犯行現場を隠した。だが死斑は動かした事実まで消してはくれない。`
      }
    }
  }

  // ── タイムライン（各キャラの事件当日の行動＝唯一の真実）──────────────
  const timelines = generateTimelines(slots, alibis, secretActions, killers, mainTrick)
  // ── 物語（個別ハンドアウトを一人称の物語として綴る）────────────────────
  const stories = generateStories(slots, timelines, killers, mainTrick, connections, cooperationChain ?? undefined)

  // ── 第一発見者と発見の経緯 ───────────────────────────────────────────
  // 生き残った使用人が朝いちばんに主人を見つけ、その報せで一同が集まる（古典的な導入）。
  const discovererRole = npcSurvivors[0]?.role ?? '早くに目を覚ました使用人'
  const discoveryReason = pickRandom([
    '朝の支度のため',
    '主人が朝の呼びかけに応じないのを不審に思い',
    '夜明け前の見回りの途中で',
    '灯りが点いたままなのに気づいて',
  ])
  const discoveredBy = discovererRole
  const discoveryScene = `第一発見者は${discovererRole}だった。${discoveryReason}${LOCATION_NAMES[mainVictimLocation]}をのぞいたところ、変わり果てた源太郎を見つけて悲鳴をあげ、その声に居合わせた者たちが次々と駆けつけて事件は明るみに出た。`

  // ── synopsis ──────────────────────────────────────────────────────────
  const synopsis = generateSynopsis(npcVictims, slots, deathDiscovery, discoveryScene)

  return {
    discoveredBy,
    victims,
    npcVictims,
    killers,
    roles,
    alibis,
    secretActions,
    puzzleTargets,
    outsideKiller: outsideKiller || undefined,
    suicide: suicide || undefined,
    connections: connections.length > 0 ? connections : undefined,
    dualKillerInfo,
    cooperationChain: cooperationChain ?? undefined,
    assignedProfessions,
    synopsis,
    npcSurvivors,
    mainVictimLocation,
    mainTrick,
    timelines,
    stories,
  }
}

// 各キャラの事件当日の行動を時系列で組み立てる。アリバイ表・凶行・トリックと
// 同一の実データから導出するため、ヒントカードと矛盾しない「唯一の真実」となる。
const ARRIVAL_ACTIONS = [
  '夕食を終えたあと、人目を避けてここへ移っていた。',
  'ひとり静かに、思いにふけって時間を過ごしていた。',
  '雨音を聞きながら、落ち着かない気持ちを持て余していた。',
  'ほかの滞在客の気配を感じつつ、身を落ち着けていた。',
  '長旅の疲れを癒すように、しばらく腰を落ち着けていた。',
]
const LATE_ACTIONS = [
  '寝支度をしながら、その夜の出来事を反芻していた。',
  '廊下の物音に気を留めつつ、静かに過ごしていた。',
  '館のどこかで上がった声に気づいたが、関わるまいと息をひそめていた。',
  '寝つけぬまま、雨の音を聞いて過ごしていた。',
  'ひとり、落ち着かない気持ちを持て余していた。',
]

// 当主(源太郎)を手にかけた動機。凶器・場所・手口はランダムで変わるため、
// 手口に依存しない「なぜ殺したのか」だけを書く（矛盾を防ぐ）。
const KILL_MOTIVE: Record<CharacterSlot, string> = {
  A: '会社の巨額赤字と自らの廃嫡を父・源太郎に知られ、すべてを失うことへの恐怖から、真実を知る源太郎の口を封じた。',
  B: '過去の重大な医療ミスを源太郎に握られ、脅迫されていた。公表と医師免許の剥奪を恐れ、脅迫者である源太郎を手にかけた。',
  C: '館の名画を偽物にすり替える計画を源太郎に気づかれた。すべてを暴露されまいと、証人となる源太郎を口封じした。',
  D: '長年にわたり源太郎から受け続けた陰湿な虐待——その積年の恨みを晴らすための復讐だった。',
  E: '源太郎の悪事に加担させられ、裏金で口止めされていた。全容を暴露すると脅され、逆に源太郎を消して自らの保身を図った。',
  F: '突然呼び戻された末に廃嫡・絶縁を宣告され、源太郎への怒りが頂点に達した。',
  G: '源太郎の隠し子である自分の存在を、源太郎自身が隠蔽しようとした。正当な相続の権利を奪われまいと、源太郎を手にかけた。',
}

function generateTimelines(
  slots: CharacterSlot[],
  alibis: Partial<Record<CharacterSlot, { T1: Location; T2: Location; T3: Location }>>,
  secretActions: Partial<Record<CharacterSlot, string>>,
  killers: KillerInfo[],
  mainTrick: MainTrick | undefined,
): Record<CharacterSlot, TimelineEntry[]> {
  const result = {} as Record<CharacterSlot, TimelineEntry[]>
  const killerBySlot = new Map(killers.map(k => [k.slot, k] as const))

  for (const slot of slots) {
    const a = alibis[slot]
    if (!a) continue
    const secret = secretActions[slot] ?? ''
    const killer = killerBySlot.get(slot)
    const arrival = ARRIVAL_ACTIONS[Math.floor(Math.random() * ARRIVAL_ACTIONS.length)]
    const late = LATE_ACTIONS[Math.floor(Math.random() * LATE_ACTIONS.length)]

    if (killer) {
      const sceneName = LOCATION_NAMES[killer.location]
      const isMain = killer.victimName === MAIN_VICTIM.name
      const victimName = killer.victimSlot ? (CHARACTERS[killer.victimSlot]?.name ?? '相手') : (killer.victimName ?? '相手')
      const isMainKillerHere = !!mainTrick && mainTrick.killerSlots.includes(slot)
      const isRemote = isMainKillerHere && !!mainTrick!.remote

      if (isRemote) {
        // 遠隔犯：20時台に現場(a.T1)で罠を設置、21時台は別室(a.T2)。犯行時に現場不在。
        const awayName = LOCATION_NAMES[a.T2]
        result[slot] = [
          { period: PERIOD_T1, location: sceneName, action: `${sceneName}へひそかに向かい、源太郎が通りかかれば自動で作動する仕掛けを施した。あとは待つだけだった。` },
          { period: PERIOD_T2, location: awayName, action: `${awayName}で人目を避けて過ごしていた（${secret}）。——まさにその頃、${sceneName}に仕掛けた装置が源太郎の命を奪った。あなたは現場にいなかった。これがこの事件の犯行時刻である。` },
          { period: PERIOD_T3, location: LOCATION_NAMES[a.T3], action: `${LOCATION_NAMES[a.T3]}へ移り、仕掛けた装置の痕跡が見つからないことを祈りながら、何食わぬ顔で過ごした。` },
        ]
        continue
      }

      // NPC殺し犯：事件当夜は"自分の秘密行動"をしていて、それをNPCに目撃された。
      // 口封じの殺害はその後（NPCの推定死亡時刻＝多くは翌日）に行われる別の出来事。
      if (!isMain) {
        result[slot] = [
          { period: PERIOD_T1, location: LOCATION_NAMES[a.T1], action: `${LOCATION_NAMES[a.T1]}にいた。${arrival}` },
          { period: PERIOD_T2, location: LOCATION_NAMES[a.T2], action: `人に言えない事情があり、ひそかに${LOCATION_NAMES[a.T2]}にいた。${secret}——だが、この秘密の行動を${victimName}に見られてしまった。露見すれば破滅だ。` },
          { period: PERIOD_T3, location: LOCATION_NAMES[a.T3], action: `${LOCATION_NAMES[a.T3]}にいた。${late}（——そして秘密を知った${victimName}を、危険が去らぬうちにと、その夜のうちに口封じのため手にかけることになる。）` },
        ]
        continue
      }

      const isIncidental = isMain && isMainKillerHere && !mainTrick!.premeditated
      const hasTrick = isMainKillerHere && !!mainTrick!.appearance   // 実際に仕掛け／工作がある
      const motive = isIncidental
        ? '秘密の行動を源太郎に目撃され、露見を恐れたあなたは、とっさに'
        : (KILL_MOTIVE[slot] ?? '')
      const t2Action = `${motive}${sceneName}で源太郎を手にかけた——これがこの事件の真の犯行時刻である。`
      const t3Action = !hasTrick
        ? `${LOCATION_NAMES[a.T3]}へ移り、動揺を隠しながら何事もなかったように振る舞った。`
        : isIncidental
          ? `現場にとっさの工作を施したうえで${LOCATION_NAMES[a.T3]}へ移り、即席の細工が見抜かれないことを祈りながら振る舞った。`
          : `${LOCATION_NAMES[a.T3]}へ移り、仕掛けたトリックによって「その時刻には別の場所にいた」というアリバイが成立するよう振る舞った。`
      result[slot] = [
        { period: PERIOD_T1, location: LOCATION_NAMES[a.T1], action: `人目を避けて${LOCATION_NAMES[a.T1]}に入り、${secret}この時点では、まだ最後の一線は越えていなかった。` },
        { period: PERIOD_T2, location: sceneName, action: t2Action },
        { period: PERIOD_T3, location: LOCATION_NAMES[a.T3], action: t3Action },
      ]
    } else {
      result[slot] = [
        { period: PERIOD_T1, location: LOCATION_NAMES[a.T1], action: `${LOCATION_NAMES[a.T1]}にいた。${arrival}` },
        { period: PERIOD_T2, location: LOCATION_NAMES[a.T2], action: `人に言えない事情があり、ひそかに${LOCATION_NAMES[a.T2]}にいた。${secret}そのため、事件の時刻に何をしていたかを正直には話しづらい。` },
        { period: PERIOD_T3, location: LOCATION_NAMES[a.T3], action: `${LOCATION_NAMES[a.T3]}にいた。${late}` },
      ]
    }
  }
  return result
}

// 個別ハンドアウト（背景・秘密・時系列・動機・凶行・トリック・密約）を
// 一人称視点の"物語"として綴る。タイムライン等と同じ実データから導出するので矛盾しない。
function generateStories(
  slots: CharacterSlot[],
  timelines: Record<CharacterSlot, TimelineEntry[]>,
  killers: KillerInfo[],
  mainTrick: MainTrick | undefined,
  connections: PlayerConnection[],
  cooperationChain: CooperationChain | undefined,
): Record<CharacterSlot, string> {
  const stories = {} as Record<CharacterSlot, string>
  const killerBySlot = new Map(killers.map(k => [k.slot, k] as const))

  for (const slot of slots) {
    const char = CHARACTERS[slot]
    const tl = timelines[slot]
    if (!char || !tl) continue
    const killer = killerBySlot.get(slot)
    const isKiller = !!killer
    const [t1, t2, t3] = tl
    const hasPact =
      connections.some(c => c.fromSlot === slot || c.toSlot === slot) ||
      !!cooperationChain?.links.some(l => l.fromSlot === slot || l.toSlot === slot)

    const paras: string[] = []

    // 1. 自己紹介と背景
    paras.push(`あなたは${char.name}——${char.role}。${char.background}`)

    // 2. 事件当夜の物語（時系列を接続詞でつなぐ）
    let night = `事件のあった夜。20時を過ぎた頃、${t1.action}`
    night += `\n\nそして21時——館の運命が変わる時刻が訪れた。${t2.action}`
    night += `\n\n22時を回る頃、${t3.action}`
    paras.push(night)

    // 3. 犯人なら、凶器・偽装・トリックまで語る（計画的／衝動的で語り口を変える）
    if (isKiller && killer && killer.victimName !== MAIN_VICTIM.name) {
      // NPC殺し犯：源太郎は手にかけていない。秘密の行動を目撃され、後日その口を封じた。
      const v = killer.victimName ?? '相手'
      paras.push(`——念のため言っておく。あなたは源太郎を手にかけてはいない。だが事件の夜、人には言えない秘密の行動をしているところを、${v}に見られてしまった。`)
      paras.push(`放っておけば、その秘密からすべてが露見する。時間を置けば置くほど危うい——追い詰められたあなたは、危険が去らぬその夜のうちに、口止めを図る${v}を「${killer.weapon.disguisedAs}」に見せかけて手にかけた（手段は「${killer.weapon.name}」）。館で起きたのは源太郎殺しだけではない——これもまた、まぎれもないもう一つの殺人だ。\n\n夜が明けて始まる犯人捜しでは、源太郎を殺した犯人だけでなく、${v}を手にかけたあなたのことも暴かれてはならない。`)
    } else if (isKiller && killer) {
      const isMainKillerHere = !!mainTrick && mainTrick.killerSlots.includes(slot)
      const incidental = isMainKillerHere && !mainTrick!.premeditated
      const hasTrick = isMainKillerHere && !!mainTrick!.appearance
      const moved = isMainKillerHere && !!mainTrick!.movedReveal   // 死体を移動して発見場所を偽装した
      const isRemote = isMainKillerHere && !!mainTrick!.remote      // 遠隔・自動殺人装置（犯行時不在）
      const movedNote = '\n\nさらにあなたは犯行後、源太郎の遺体を別の部屋へ運び、そこで倒れていたように見せかけて本当の犯行現場を隠した（詳しくは下の「遺体の状況」の手がかりを参照）。だが死斑は、動かした事実まで消してはくれない。'
      let how: string
      if (isRemote) {
        how = `——あなたは源太郎に直接手を下してはいない。事前に犯行現場へ、源太郎が通りかかれば自動で作動する仕掛け（凶器は「${killer.weapon.name}」）を仕込んでおいたのだ。そして罠が作動した時刻、あなたは別室で他の者と一緒にいた。犯行の瞬間に現場にいなかったことこそ、あなたの鉄壁のアリバイである（詳しくは下の「仕掛けたトリック」欄を参照）。だが装置を固定した釘穴や糸の残骸を残していれば、遠隔殺人だと露見する。`
      } else if (incidental) {
        how = `——断っておくが、これは計画された殺人ではなかった。あなたの本当の目的は別にあった。だがその秘密の行動の最中、よりにもよって源太郎に見咎められてしまう。露見すればすべてを失う——そう悟った瞬間、あなたはとっさに手を下していた。使ったのは「${killer.weapon.name}」。`
        if (hasTrick) {
          how += `\n\nそのまま逃げれば真っ先に疑われる。我に返ったあなたは、その場でできる工作をとっさに施し、少しでも追及を逸らそうとした（詳しくは下の「とっさに施した工作」欄を参照）。だが用意した計画ではない、即席の細工だ。綻びを残していないか気が気ではない。`
        } else if (!moved) {
          how += ` とはいえ凝ったアリバイ工作をする余裕などなく、あなたはただ現場に残った痕跡を慌てて拭い、その場を離れるだけで精一杯だった。表向きは「${killer.weapon.disguisedAs}」として処理されるかもしれないが、それは仕組んだというより、ただの幸運にすぎない。`
        }
        if (moved) how += movedNote
      } else {
        how = `——${killMethodSentence(killer.weapon)}`
        if (hasTrick) {
          how += `\n\nそして何より、あなたには周到に用意した仕掛けがある——それがあなたのアリバイを作っている（詳しくは下の「仕掛けたトリック」欄を参照）。`
        }
        if (moved) how += movedNote
      }
      how += `\n\n夜が明ければ、この孤立した館で「犯人捜し」が始まる。あなたは無実の顔で、その輪の中に紛れ込まなければならない。`
      paras.push(how)
    } else {
      paras.push(`あなたは誰も手にかけてなどいない。だが、事件の時刻に人には言えない行動をとっていたことだけは事実だ。それを正直に明かせば身の破滅——かといって黙っていれば、疑いの目はあなたに向く。夜明けとともに始まる犯人捜しを、どう切り抜けるかはあなた次第だ。`)
    }

    // 4. 密約・指令があれば、物語として触れる（詳細は下記の該当欄を参照）
    if (hasPact) {
      paras.push(isKiller
        ? 'なお、この凶行の影では、あなたと他の誰かとのあいだに今夜かぎりの密約が交わされている（詳しくは下の「密約／秘密の指令」を参照）。その約束が守られるか裏切られるかは、討議の行方しだいだ。'
        : 'そしてこの夜、あなたは他の誰かと今夜かぎりの密約を交わしている（詳しくは下の「密約／秘密の指令」を参照）。それを表沙汰にできない事情もまた、あなたの口を重くさせる。')
    }

    stories[slot] = paras.join('\n\n')
  }
  return stories
}

function generateSynopsis(
  npcVictims: NpcVictim[],
  slots: CharacterSlot[],
  deathDiscovery: string,
  discoveryScene: string,
): string {
  const playerCount = slots.length

  const npcLine = npcVictims.length > 0
    ? `同じ数日のうちに、館では他にも数名が相次いで命を落としている。`
    : ''

  const commonParagraphs = [
    '現代日本。中部山間の深い森に抱かれた石造りの西洋館「紫苑館」——神条財閥総帥・神条 源太郎が昭和期に建て、半世紀以上にわたって使い続けてきた別邸である。東京の本邸とは異なり、来客を厳選することで知られるこの館には、源太郎が認めた者だけが足を踏み入れることができた。',

    '数週間前、源太郎は親族・側近・館の関係者に一方的な連絡を入れた。「今月中に紫苑館まで来るように」——理由は告げられなかった。源太郎がこのような招集をかけること自体が異例であり、呼ばれた者たちはそれぞれ思惑を巡らせながら館へと足を向けた。こうして今夜この館には、家族として呼び寄せられた者、定期的な用件でここを訪れていた者、依頼を受けて館内の仕事を進めていた者、そして長年ここに住み込んで仕えてきた者たちが、それぞれの立場で同じ屋根の下に集うことになった。',

    '夕刻から雨が強まり、その夜のうちに暴風雨となった。山間の細い道路は崖崩れで寸断され、電話回線も途絶える。嵐は幾晩も居座り、館は数日にわたって外の世界から完全に切り離された。この孤立のあいだに、館ではいくつもの死が続くことになる。',
  ]

  // 全シナリオ共通で「特定人物を疑わせる一文」を入れる。
  // 自殺回だけの特徴にすると「名指しの疑い＝自殺」というメタ情報が漏れるため、
  // 他殺・外部犯・自殺のいずれでも同じ体裁で疑いを提示する（=ネタバレ防止）。
  const suspect = CHARACTERS[slots[Math.floor(Math.random() * slots.length)]]
  const n = suspect.name
  const redHerrings = [
      `${n}が深夜に源太郎の部屋付近を出入りするのを目撃した者がいる。`,
      `前夜、${n}と源太郎が言い争うような声が聞こえたという証言がある。`,
      `発見直前、${n}が廊下を急ぎ足で立ち去るのを見た者がいた。`,
      `源太郎の部屋の前に、${n}のものと思しき品が残されていた。`,
      `${n}が21時頃、なぜか自室にいなかったという証言がある。`,
      `源太郎の机の上に、${n}宛ての破り捨てられた手紙の切れ端があった。`,
      `${n}の袖口に、拭い切れなかった赤い染みが残っていたのを見た者がいる。`,
      `夜半、${n}が誰かと押し殺した声で口論しているのを使用人が耳にした。`,
      `${n}が事件前夜、「もう我慢の限界だ」と漏らしていたという。`,
      `源太郎の部屋の鍵が、なぜか${n}の部屋の近くで見つかった。`,
      `${n}が夜中に手を震わせながら水を飲んでいたのを目撃されている。`,
      `事件直後、${n}だけが妙に取り乱していたと複数の者が証言している。`,
      `${n}が源太郎から多額の借金をしていたという噂が館内に流れている。`,
      `源太郎の遺体のそばに、${n}が普段身につけている品の一部が落ちていた。`,
      `${n}が事件の数日前、館の見取り図を熱心に眺めていたという。`,
      `深夜、${n}の部屋の灯りだけが明け方近くまで消えなかった。`,
      `${n}が源太郎に「あなたさえいなければ」と言い放ったのを聞いた者がいる。`,
      `事件当夜、${n}の靴だけが泥と雨で濡れていたのを不審に思った者がいた。`,
      `${n}が最近、源太郎の日課や就寝時刻を頻繁に尋ねていたという証言がある。`,
      `源太郎の部屋の窓の外に、${n}の足跡らしきものが残されていた。`,
      `${n}が事件前、誰にも言わずに何かを庭の隅に埋めていたのを見た者がいる。`,
      `${n}が事件の直前まで源太郎の身近にいられた数少ない人物だと囁かれている。`,
      `事件の朝、${n}の手が小刻みに震えていたのを気づいた者がいた。`,
      `${n}が前夜、「今夜ですべてが終わる」と独り言のように呟いていたという。`,
      `源太郎が最後に会っていたのは${n}だったのではないか、という証言がある。`,
      `${n}が事件後、真っ先に源太郎の書斎の書類を確認しようとしていた。`,
      `${n}の手帳に、源太郎の名前が何度も乱暴に書き殴られていたという。`,
      `${n}が事件当夜だけ、いつもと違う裏階段を使っていたのを見た者がいる。`,
      `${n}が源太郎に恨みを抱く動機を持っていると、ひそかに噂されている。`,
      `事件直前、${n}が源太郎の部屋の方向をじっと見つめていたのを目撃されている。`,
    ]
  const hint = redHerrings[Math.floor(Math.random() * redHerrings.length)]
  const discoveryParagraph = `そして最初の夜明け前、${deathDiscovery}${discoveryScene}`
  const lastParagraph = `${hint}${npcLine}救急も警察も呼べないなか、その場に居合わせた${playerCount}名で、この孤立した数日のあいだに何が起きたのかを明らかにしなければならない。`

  return [...commonParagraphs, discoveryParagraph, lastParagraph].join('\n\n')
}

export { getSlotsForCount }
