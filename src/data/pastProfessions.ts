import type { CardCategory, CharacterSlot } from '../types/game'

export interface ProfessionCard {
  content: string     // {name} をキャラクター名に置換して使用
  category: CardCategory
  isTrue: boolean
}

export interface PastProfession {
  id: string
  title: string
  observableHint: string  // 他者が観察できる行動の癖
  secretDetail: string    // そのプレイヤーだけが知る過去の詳細
  cards: ProfessionCard[] // ゲーム中に配られるカード（2〜3枚）
}

export const PAST_PROFESSIONS: PastProfession[] = [
  {
    id: 'sommelier',
    title: '元ソムリエ',
    observableHint: '飲み物を口にするとき、素材や産地を確かめるような仕草を無意識にする。',
    secretDetail: '若い頃、欧州の一流ホテルでヘッドソムリエとして10年以上働いた。飲料への微量物質の混入と、それを感知させないための技術を身につけた。',
    cards: [
      {
        content: '今夜、{name}が誰かの飲み物に何かを溶かすような動作をしていたという目撃証言がある。',
        category: 'alibi',
        isTrue: true,
      },
      {
        content: '{name}が飲み物に異常な関心を示すのは、胃腸の持病による食事制限からくるものだという。',
        category: 'psychology',
        isTrue: false,
      },
    ],
  },
  {
    id: 'locksmith',
    title: '元錠前師',
    observableHint: '金具や錠前を目にするとき、ほんの一瞬だけ指先が先回りするような動きを見せる。',
    secretDetail: '10代のころ、老鍵師の工房で数年間修行した。どんな錠でも音を立てずに開ける技術を今も持っている。',
    cards: [
      {
        content: '今夜、{name}が施錠されているはずの部屋から音もなく出てきたという目撃情報がある。',
        category: 'alibi',
        isTrue: true,
      },
      {
        content: '{name}の錠前への関心は、過去に盗難被害に遭ったことへの不安からくるものだという。',
        category: 'psychology',
        isTrue: false,
      },
    ],
  },
  {
    id: 'magician_assistant',
    title: '元マジシャンアシスタント',
    observableHint: '人の外見の変化や仮装に対して、異様に鋭い観察眼を見せることがある。',
    secretDetail: 'かつてステージマジックの世界で変装・特殊メイク・早着替えを担当していた。別人に見せる技術に長けている。',
    cards: [
      {
        content: '今夜の夕食後、{name}の髪型や服装が微妙に変わっていたと気づいた者がいる。',
        category: 'alibi',
        isTrue: true,
      },
      {
        content: '{name}の変装への関心は、かつて舞台芸術を趣味にしていたことの名残に過ぎないという。',
        category: 'psychology',
        isTrue: false,
      },
    ],
  },
  {
    id: 'pharma_researcher',
    title: '元製薬研究員',
    observableHint: '薬品や化学物質の話題になると、専門家でなければ知らないような用語が自然に出てくる。',
    secretDetail: '大手製薬会社の毒性試験部門に7年在籍し、致死量や解毒剤について深い知識を持つ。処方外の薬物への精通が時折顔を出す。',
    cards: [
      {
        content: '{name}が今夜、薬品保管庫の近くで不審な動きをしていたという目撃情報がある。',
        category: 'alibi',
        isTrue: true,
      },
      {
        content: '{name}の薬品への詳しい知識は、長年の慢性疾患を自己管理するうちに自然と身についたものだという。',
        category: 'psychology',
        isTrue: false,
      },
    ],
  },
  {
    id: 'art_appraiser',
    title: '元美術鑑定士',
    observableHint: '書類や絵画を見るとき、素材と光の当たり方を確かめるような独特の視線で観察する癖がある。',
    secretDetail: '欧州の競売会社で美術品・古文書の真贋鑑定を担当。筆跡・印刷・紙質を見分け、模倣する技術にも精通している。',
    cards: [
      {
        content: '今夜、{name}が書斎で書類をペンで丁寧になぞるような動作をしていたという目撃証言がある。',
        category: 'alibi',
        isTrue: true,
      },
      {
        content: '{name}の書類への異常な関心は、過去に重要な契約でトラブルがあったことへの慎重さからくるものだという。',
        category: 'psychology',
        isTrue: false,
      },
    ],
  },
  {
    id: 'performer',
    title: '元旅芸人',
    observableHint: 'ロープや結び目を扱うとき、舞台で見せるような鮮やかな手つきを見せることがある。',
    secretDetail: '10代から数年間、旅回りの一座で曲芸・脱出術を演じた。縄の扱いと密閉空間からの脱出技術を体得している。',
    cards: [
      {
        content: '今夜、{name}が封鎖されているはずの出口から姿を現したという証言がある。',
        category: 'alibi',
        isTrue: true,
      },
      {
        content: '{name}のロープへの異様な親しみは、幼少期から船乗りの父親に習った結び方の趣味によるものだという。',
        category: 'psychology',
        isTrue: false,
      },
    ],
  },
  {
    id: 'forger',
    title: '元書類偽造師',
    observableHint: '書類の扱いや印鑑の押し方が異様に手慣れており、ペンを持つ手が一瞬も迷わない。',
    secretDetail: '過去、非合法な書類偽造に関与していた時期がある。契約書・戸籍・遺言書の偽造技術を持ち、細部の再現に長けている。',
    cards: [
      {
        content: '今夜、{name}が書斎で書類をペン一本で素早く書き写していたという目撃情報がある。',
        category: 'alibi',
        isTrue: true,
      },
      {
        content: '{name}の書類への手慣れた様子は、長年の事務仕事で培った職業的な習慣に過ぎないという。',
        category: 'psychology',
        isTrue: false,
      },
    ],
  },
  {
    id: 'perfumer',
    title: '元調香師',
    observableHint: '香りや微量な匂いに対して異常なほど敏感で、素材の成分を言い当てることがある。',
    secretDetail: 'かつて調香師として香料・化学物質の特性と混合技術を学んだ。無味無臭の物質を飲料や食品に混入する方法に精通している。',
    cards: [
      {
        content: '今夜の食事に使われた食材の一部に、{name}が接触した形跡があるという報告がある。',
        category: 'alibi',
        isTrue: true,
      },
      {
        content: '{name}の匂いへの異常な敏感さは、重度のアレルギー体質によるものだという。',
        category: 'psychology',
        isTrue: false,
      },
    ],
  },
  {
    id: 'architect_assistant',
    title: '元建築士助手',
    observableHint: '部屋や廊下の構造に対して、設計図を見るような目を向けることがある。',
    secretDetail: '建築事務所で建物の設計図・隠し構造の作図を担当。建物の抜け穴・隠し通路の発見と利用を得意とする。',
    cards: [
      {
        content: '今夜、{name}が館の壁に沿って手で触れながら移動していたという目撃情報がある。',
        category: 'alibi',
        isTrue: true,
      },
      {
        content: '{name}の建物構造への関心は、自宅のリフォームを検討していることへの純粋な興味からくるものだという。',
        category: 'psychology',
        isTrue: false,
      },
    ],
  },
  {
    id: 'actor',
    title: '元舞台俳優',
    observableHint: '語る経歴が聞くたびに微妙にずれており、自然と別の人物を演じているように見えることがある。',
    secretDetail: 'かつて舞台俳優として活動し、なりすまし・偽の経歴を演じる技術を磨いた。他人の口調・仕草を模倣することに長けている。',
    cards: [
      {
        content: '今夜の{name}の振る舞いが、昼間とは明らかに別人のように変わっていたと感じた者が複数いる。',
        category: 'alibi',
        isTrue: true,
      },
      {
        content: '{name}の経歴の食い違いは、過去のトラウマから特定の記憶を意図的に避けているためだという。',
        category: 'psychology',
        isTrue: false,
      },
    ],
  },
  {
    id: 'herbalist',
    title: '元薬草師',
    observableHint: '植物や自然素材を手にするとき、薬効や毒性を確認するような目つきを見せることがある。',
    secretDetail: 'かつて山岳ガイドとして毒草・薬草の知識を深め、採取と加工の技術を身につけた。少量で致命的な植物毒の扱いに精通している。',
    cards: [
      {
        content: '今夜、{name}が温室付近で何かの植物を採取していたという目撃情報がある。',
        category: 'alibi',
        isTrue: true,
      },
      {
        content: '{name}の植物への関心は、健康志向の生活習慣から来る薬草茶の趣味によるものだという。',
        category: 'psychology',
        isTrue: false,
      },
    ],
  },
  {
    id: 'acrobat',
    title: '元曲芸師',
    observableHint: '狭い場所の出入りや暗所での移動に慣れた身のこなしを見せることがある。',
    secretDetail: 'サーカス系の訓練を受けており、狭い隙間や暗所での移動・高所からの飛び降りを苦にしない。密かな潜入・移動に長けている。',
    cards: [
      {
        content: '今夜、{name}が通常では通れないような狭い隙間を通過していたという証言がある。',
        category: 'alibi',
        isTrue: true,
      },
      {
        content: '{name}の身軽な動きは、長年のヨガ・武道の習慣による体の柔軟性によるものだという。',
        category: 'psychology',
        isTrue: false,
      },
    ],
  },
]

// 各キャラの"正体"に対応する過去職業（固定）。ヒントカード（cardTemplates の
// bg_015〜ph_026 など）が示す隠れた素性と一致させ、過去職業カードと矛盾させない。
//  A=署名/骨董=文書偽造, B=薬品=製薬研究, C=特殊メイク/変装=マジック助手,
//  D=錠前=錠前師, E=ワイン/ホテル=ソムリエ, F=舞台/身体=役者的パフォーマー,
//  G=改名/経歴詐称=役者。（12種のうち各スロット一意に割り当て）
export const CANONICAL_SLOT_PROFESSION: Record<CharacterSlot, string> = {
  A: 'forger',
  B: 'pharma_researcher',
  C: 'magician_assistant',
  D: 'locksmith',
  E: 'sommelier',
  F: 'performer',
  G: 'actor',
}
