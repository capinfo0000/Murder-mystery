export interface PastProfession {
  id: string
  title: string           // 元ソムリエ
  observableHint: string  // 他者が観察できる行動の癖（背景テキストに追加）
  secretDetail: string    // そのプレイヤーだけが知る過去の詳細
}

export const PAST_PROFESSIONS: PastProfession[] = [
  {
    id: 'sommelier',
    title: '元ソムリエ',
    observableHint: '飲み物を口にするとき、素材や産地を確かめるような仕草を無意識にする。',
    secretDetail: '若い頃、欧州の一流ホテルでヘッドソムリエとして10年以上働いた。飲料への微量物質の混入と、それを感知させないための技術を身につけた。',
  },
  {
    id: 'locksmith',
    title: '元錠前師',
    observableHint: '金具や錠前を目にするとき、ほんの一瞬だけ指先が先回りするような動きを見せる。',
    secretDetail: '10代のころ、老鍵師の工房で数年間修行した。どんな錠でも音を立てずに開ける技術を今も持っている。',
  },
  {
    id: 'magician_assistant',
    title: '元マジシャンアシスタント',
    observableHint: '人の外見の変化や仮装に対して、異様に鋭い観察眼を見せることがある。',
    secretDetail: 'かつてステージマジックの世界で変装・特殊メイク・早着替えを担当していた。別人に見せる技術に長けている。',
  },
  {
    id: 'pharma_researcher',
    title: '元製薬研究員',
    observableHint: '薬品や化学物質の話題になると、専門家でなければ知らないような用語が自然に出てくる。',
    secretDetail: '大手製薬会社の毒性試験部門に7年在籍し、致死量や解毒剤について深い知識を持つ。処方外の薬物への精通が時折顔を出す。',
  },
  {
    id: 'art_appraiser',
    title: '元美術鑑定士',
    observableHint: '書類や絵画を見るとき、素材と光の当たり方を確かめるような独特の視線で観察する癖がある。',
    secretDetail: '欧州の競売会社で美術品・古文書の真贋鑑定を担当。筆跡・印刷・紙質を見分け、模倣する技術にも精通している。',
  },
  {
    id: 'performer',
    title: '元旅芸人',
    observableHint: 'ロープや結び目を扱うとき、舞台で見せるような鮮やかな手つきを見せることがある。',
    secretDetail: '10代から数年間、旅回りの一座で曲芸・脱出術を演じた。縄の扱いと密閉空間からの脱出技術を体得している。',
  },
  {
    id: 'forger',
    title: '元書類偽造師',
    observableHint: '書類の扱いや印鑑の押し方が異様に手慣れており、ペンを持つ手が一瞬も迷わない。',
    secretDetail: '過去、非合法な書類偽造に関与していた時期がある。契約書・戸籍・遺言書の偽造技術を持ち、細部の再現に長けている。',
  },
  {
    id: 'perfumer',
    title: '元調香師',
    observableHint: '香りや微量な匂いに対して異常なほど敏感で、素材の成分を言い当てることがある。',
    secretDetail: 'かつて調香師として香料・化学物質の特性と混合技術を学んだ。無味無臭の物質を飲料や食品に混入する方法に精通している。',
  },
  {
    id: 'architect_assistant',
    title: '元建築士助手',
    observableHint: '部屋や廊下の構造に対して、設計図を見るような目を向けることがある。',
    secretDetail: '建築事務所で建物の設計図・隠し構造の作図を担当。建物の抜け穴・隠し通路の発見と利用を得意とする。',
  },
  {
    id: 'actor',
    title: '元舞台俳優',
    observableHint: '語る経歴が聞くたびに微妙にずれており、自然と別の人物を演じているように見えることがある。',
    secretDetail: 'かつて舞台俳優として活動し、なりすまし・偽の経歴を演じる技術を磨いた。他人の口調・仕草を模倣することに長けている。',
  },
  {
    id: 'herbalist',
    title: '元薬草師',
    observableHint: '植物や自然素材を手にするとき、薬効や毒性を確認するような目つきを見せることがある。',
    secretDetail: 'かつて山岳ガイドとして毒草・薬草の知識を深め、採取と加工の技術を身につけた。少量で致命的な植物毒の扱いに精通している。',
  },
  {
    id: 'acrobat',
    title: '元曲芸師',
    observableHint: '狭い場所の出入りや暗所での移動に慣れた身のこなしを見せることがある。',
    secretDetail: 'サーカス系の訓練を受けており、狭い隙間や暗所での移動・高所からの飛び降りを苦にしない。密かな潜入・移動に長けている。',
  },
]
